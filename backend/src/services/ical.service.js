const axios = require('axios');
const ical = require('node-ical');
const crypto = require('crypto');
const supabase = require('../config/supabase');

class IcalService {
    /**
     * Sincroniza um link iCal genérico (Airbnb, Booking, VRBO, etc.)
     */
    static async syncCalendar(quartoId, icalUrl, canalNomePadrao = 'EXTERNO') {
        try {
            console.log(`🔄 [Supabase] Sincronizando iCal para Quarto ID: ${quartoId}...`);

            const response = await axios.get(icalUrl);
            const icalData = response.data;
            const eventos = ical.sync.parseICS(icalData);

            let countNovos = 0;

            let canalFinal = canalNomePadrao.toUpperCase();
            if (icalUrl.includes('airbnb')) canalFinal = 'AIRBNB';
            else if (icalUrl.includes('booking')) canalFinal = 'BOOKING';

            // Buscar/Criar Canal
            let { data: canalDB, error: errCanal } = await supabase.supabaseAdmin
                .from('Canal')
                .select('*')
                .eq('nome_canal', canalFinal)
                .single();

            if (!canalDB) {
                const { data: novoCanal } = await supabase.supabaseAdmin
                    .from('Canal')
                    .insert([{ nome_canal: canalFinal, comissao_percentual: 0 }])
                    .select()
                    .single();
                canalDB = novoCanal;
            }

            for (let eventoId in eventos) {
                const ev = eventos[eventoId];

                if (ev.type === 'VEVENT') {
                    const checkIn = new Date(ev.start);
                    const checkOut = new Date(ev.end);
                    const uid = ev.uid || eventoId;
                    const summary = ev.summary || `Reserva ${canalFinal}`;

                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    if (checkOut < hoje) continue;

                    // Verificar se já existe
                    const { data: reservaExistente } = await supabase.supabaseAdmin
                        .from('Reserva')
                        .select('id')
                        .eq('quarto_id', quartoId)
                        .eq('codigo_reserva_externo', uid)
                        .limit(1)
                        .single();

                    if (!reservaExistente) {
                        const emailPlaceholder = `guest-${uid.slice(0, 8)}@${canalFinal.toLowerCase()}.com`;

                        // Buscar/Criar Hóspede
                        let { data: hospedeDB, error: errH } = await supabase.supabaseAdmin
                            .from('Hospede')
                            .select('*')
                            .eq('email', emailPlaceholder)
                            .single();

                        if (!hospedeDB) {
                            const { data: novoHospede, error: errInsH } = await supabase.supabaseAdmin
                                .from('Hospede')
                                .insert([{ id: crypto.randomUUID(), nome: summary, email: emailPlaceholder }])
                                .select()
                                .single();
                            if (errInsH) { console.error(`❌ iCal: Erro ao criar hóspede placeholder:`, errInsH.message); continue; }
                            hospedeDB = novoHospede;
                        }

                        if (!hospedeDB) { console.error(`❌ iCal: hospedeDB nulo para UID ${uid}`); continue; }

                        // Criar Reserva
                        const { error: errRes } = await supabase.supabaseAdmin.from('Reserva').insert([{
                            id: crypto.randomUUID(),
                            quarto_id: quartoId,
                            hospede_id: hospedeDB.id,
                            canal_id: canalDB.id,
                            status: 'CONFIRMADA',
                            data_check_in: checkIn.toISOString(),
                            data_check_out: checkOut.toISOString(),
                            valor_total: 0,
                            codigo_reserva_externo: uid,
                            requerimentos_especiais: `Importado via iCal (${canalFinal}). UID: ${uid}`
                        }]);

                        if (errRes) { console.error(`❌ iCal: Erro ao inserir reserva (UID: ${uid}):`, errRes.message); continue; }
                        countNovos++;
                    }
                }
            }

            console.log(`✅ Sincronização concluída. Novas: ${countNovos}`);
            return { success: true, count: countNovos };

        } catch (error) {
            console.error(`❌ Erro iCal:`, error.message);
            return { success: false, error: error.message };
        }
    }

    static async syncAllQuartos() {
        const { data: quartos, error } = await supabase.supabaseAdmin
            .from('Quarto')
            .select('*')
            .eq('ativo', true);

        if (error || !quartos) return [];

        console.log(`🚀 Iniciando Sync Automático para ${quartos.length} alojamentos...`);
        const resultados = [];

        for (const q of quartos) {
            const urls = [
                { url: q.ical_url, label: 'EXTERNO' },
                { url: q.ical_airbnb, label: 'AIRBNB' },
                { url: q.ical_booking, label: 'BOOKING' }
            ].filter(u => u.url);

            console.log(`📋 ${q.nome}: ${urls.length} link(s) iCal encontrado(s) — ${urls.map(u => u.label).join(', ')}`);

            for (const { url, label } of urls) {
                console.log(`🔄 Sincronizando ${label} para ${q.nome}...`);
                const res = await this.syncCalendar(q.id, url, label);
                console.log(`   → ${label}: ${res.success ? `✅ ${res.count} nova(s)` : `❌ ${res.error}`}`);
                resultados.push({ quarto: q.nome, canal: label, ...res });
            }
        }

        return resultados;
    }
}

module.exports = IcalService;

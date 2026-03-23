const ical = require('node-ical');
const axios = require('axios');
const supabase = require('../config/supabase');

class SyncICalService {
    static async syncQuarto(quartoId) {
        const { data: quarto, error: errQuarto } = await supabase.supabaseAdmin
            .from('Quarto')
            .select('*')
            .eq('id', quartoId)
            .single();

        if (errQuarto || !quarto || !quarto.ical_url) {
            throw new Error('Quarto não encontrado ou sem link iCal configurado');
        }

        console.log(`📡 [Supabase] Sincronizando iCal para: ${quarto.nome}`);

        try {
            const response = await axios.get(quarto.ical_url);
            const data = ical.parseICS(response.data);
            const eventos = Object.values(data).filter(item => item.type === 'VEVENT');

            let canalNome = 'AIRBNB';
            if (quarto.ical_url.toLowerCase().includes('booking')) canalNome = 'BOOKING';
            if (quarto.ical_url.toLowerCase().includes('expedia')) canalNome = 'EXPEDIA';

            // Buscar/Criar Canal
            let { data: canalDB } = await supabase.supabaseAdmin
                .from('Canal')
                .select('*')
                .eq('nome_canal', canalNome)
                .single();

            if (!canalDB) {
                const { data: novoCanal } = await supabase.supabaseAdmin
                    .from('Canal')
                    .insert([{ nome_canal: canalNome, comissao_percentual: 0 }])
                    .select()
                    .single();
                canalDB = novoCanal;
            }

            let count = 0;

            for (const event of eventos) {
                const checkIn = new Date(event.start);
                const checkOut = new Date(event.end);
                const summary = event.summary || 'Reserva Externa';
                const uid = event.uid || `${checkIn.getTime()}-${checkOut.getTime()}`;

                let nomeHospede = 'Hóspede Externo';
                if (summary.toUpperCase() !== 'RESERVED' && summary.toUpperCase() !== 'UNAVAILABLE') {
                    nomeHospede = summary.replace('RESERVED - ', '').trim();
                }

                // Verificar se a reserva já existe
                const { data: reservaExistente } = await supabase.supabaseAdmin
                    .from('Reserva')
                    .select('id')
                    .eq('quarto_id', quartoId)
                    .eq('codigo_reserva_externo', uid)
                    .limit(1)
                    .single();

                if (!reservaExistente) {
                    const emailPlaceholder = `guest-${uid.slice(0, 8)}@${canalNome.toLowerCase()}.com`;

                    // Buscar/Criar Hóspede
                    let { data: hospedeDB } = await supabase.supabaseAdmin
                        .from('Hospede')
                        .select('*')
                        .eq('email', emailPlaceholder)
                        .single();

                    if (!hospedeDB) {
                        const { data: novoHospede, error: errInsH } = await supabase.supabaseAdmin
                            .from('Hospede')
                            .insert([{ nome: nomeHospede, email: emailPlaceholder }])
                            .select()
                            .single();
                        if (errInsH) { console.error(`❌ sync iCal: Erro ao criar hóspede:`, errInsH.message); continue; }
                        hospedeDB = novoHospede;
                    }

                    if (!hospedeDB) { console.error(`❌ sync iCal: hospedeDB nulo para UID ${uid}`); continue; }

                    // Criar Reserva
                    const { error: errRes } = await supabase.supabaseAdmin.from('Reserva').insert([{
                        quarto_id: quartoId,
                        hospede_id: hospedeDB.id,
                        canal_id: canalDB.id,
                        status: 'CONFIRMADA',
                        data_check_in: checkIn.toISOString(),
                        data_check_out: checkOut.toISOString(),
                        valor_total: 0,
                        codigo_reserva_externo: uid
                    }]);

                    if (errRes) { console.error(`❌ sync iCal: Erro ao inserir reserva (UID: ${uid}):`, errRes.message); continue; }
                    count++;
                }
            }

            console.log(`✅ Sincronização concluída: ${count} novas reservas registradas.`);
            return count;
        } catch (error) {
            console.error('Erro na sincronização iCal:', error);
            throw error;
        }
    }
}

module.exports = SyncICalService;

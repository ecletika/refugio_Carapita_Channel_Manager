const supabase = require('../config/supabase');
const EmailService = require('../services/email.service');
const AimaService = require('../services/aima.service');
const crypto = require('crypto');

class ReservasController {

    // 1. Listar Disponibilidade Real
    static async listarDisponibilidade(req, res) {
        try {
            const { checkIn, checkOut, capacidade } = req.query;
            if (!checkIn || !checkOut) return res.status(400).json({ error: 'Check-in e Check-out são obrigatórios' });

            const hoje = new Date();
            hoje.setUTCHours(0, 0, 0, 0);
            const dataCheckIn = new Date(`${checkIn}T00:00:00.000Z`);

            if (dataCheckIn < hoje) {
                return res.status(400).json({ error: 'Não é possível pesquisar disponibilidade para datas passadas' });
            }

            const dataInicio = dataCheckIn.toISOString();
            const dataFim = new Date(`${checkOut}T00:00:00.000Z`).toISOString();

            let { data: quartos, error: errQ } = await supabase
                .from('Quarto')
                .select('*')
                .eq('ativo', true)
                .gte('capacidade', parseInt(capacidade || 1));

            if (errQ) throw errQ;

            const { data: reservasConflito } = await supabase.supabaseAdmin
                .from('Reserva')
                .select('quarto_id')
                .in('status', ['CONFIRMADA', 'CHECK_IN', 'PENDENTE'])
                .lt('data_check_in', dataFim)
                .gt('data_check_out', dataInicio);

            const { data: bloqueiosConflito } = await supabase.supabaseAdmin
                .from('Bloqueio')
                .select('quarto_id')
                .lt('data_inicio', dataFim)
                .gt('data_fim', dataInicio);

            const idsOcupados = new Set([
                ...(reservasConflito?.map(r => r.quarto_id) || []),
                ...(bloqueiosConflito?.map(b => b.quarto_id) || [])
            ]);

            const disponiveis = quartos.filter(q => !idsOcupados.has(q.id));
            return res.json({ status: 'success', data: disponiveis });
        } catch (error) {
            console.error("Erro ListarDisponibilidade:", error.message);
            return res.status(500).json({ error: 'Erro ao buscar disponibilidade' });
        }
    }

    // 2. Criar Reserva
    static async criarReserva(req, res) {
        try {
            console.log('1. INICIANDO CRIAR RESERVA', req.body);
            const { quartoId, hospede, checkIn, checkOut, canalNome, metodoPagamento, requerimentosEspeciais, extrasIds, cupomCodigo } = req.body;
            if (!quartoId || !hospede || !checkIn || !checkOut) return res.status(400).json({ error: 'Dados incompletos' });

            const dataInicio = new Date(`${checkIn}T00:00:00.000Z`).toISOString();
            const dataFim = new Date(`${checkOut}T00:00:00.000Z`).toISOString();

            // Buscar/Criar Hóspede
            let { data: hospedeDB } = await supabase.from('Hospede').select('*').eq('email', hospede.email).single();
            const now = new Date().toISOString();

            const hospedeData = {
                prefixo: hospede.prefixo,
                nome: hospede.nome,
                sobrenome: hospede.sobrenome,
                telefone: hospede.telefone || null,
                pais: hospede.pais,
                cidade: hospede.cidade,
                endereco1: hospede.endereco1,
                endereco2: hospede.endereco2,
                cep: hospede.cep,
                estrangeiro: hospede.estrangeiro || false,
                data_nascimento: hospede.data_nascimento || null,
                local_nascimento: hospede.local_nascimento || null,
                nacionalidade: hospede.nacionalidade || null,
                tipo_documento: hospede.tipo_documento || null,
                numero_documento: hospede.numero_documento || null,
                pais_emissor_documento: hospede.pais_emissor_documento || null,
                dependentes: hospede.dependentes || [],
                atualizado_em: now
            };

            if (!hospedeDB) {
                const { data: novoH, error: errH } = await supabase
                    .from('Hospede')
                    .insert([{ id: crypto.randomUUID(), email: hospede.email, criado_em: now, ...hospedeData }])
                    .select().single();
                if (errH) { console.error('Hospede Insert Error:', errH); throw errH; }
                hospedeDB = novoH;
            } else {
                const { data: updateH, error: errHUpd } = await supabase
                    .from('Hospede')
                    .update(hospedeData)
                    .eq('id', hospedeDB.id)
                    .select().single();
                if (errHUpd) { console.error('Hospede Update Error:', errHUpd); throw errHUpd; }
                hospedeDB = updateH;
            }

            // Buscar/Criar Canal
            let { data: canalDB } = await supabase.from('Canal').select('*').eq('nome_canal', canalNome || 'SITE').single();
            if (!canalDB) {
                const nowCanal = new Date().toISOString();
                const { data: novoC, error: errC } = await supabase
                    .from('Canal')
                    .insert([{ id: crypto.randomUUID(), nome_canal: canalNome || 'SITE', comissao_percentual: 0, criado_em: nowCanal, atualizado_em: nowCanal }])
                    .select().single();
                if (errC) { console.error('Canal Insert Error:', errC); throw errC; }
                canalDB = novoC;
            }

            // Calcular Preço
            console.log('4. CALCULANDO PRECO');
            const { data: quarto } = await supabase.from('Quarto').select('*').eq('id', quartoId).single();
            const { data: tarifas } = await supabase.from('TarifaSazonal').select('*').eq('quarto_id', quartoId);

            let valorTotal = 0;
            let d = new Date(`${checkIn}T00:00:00.000Z`);
            const dFim = new Date(`${checkOut}T00:00:00.000Z`);
            let limit = 0;
            while (d < dFim && limit < 1000) {
                limit++;
                const currentYmd = d.toISOString().split('T')[0];
                const t = tarifas?.find(tf => {
                    const tInStr = tf.data_inicio.split('T')[0];
                    const tOutStr = tf.data_fim.split('T')[0];
                    return currentYmd >= tInStr && currentYmd <= tOutStr;
                });
                valorTotal += Number(t ? t.preco_noite : quarto.preco_base);
                d.setUTCDate(d.getUTCDate() + 1);
            }

            // Calcular preço dos Extras
            console.log('5. CALCULANDO EXTRAS');
            if (extrasIds && extrasIds.length > 0) {
                const { data: extrasPriceData } = await supabase.from('Extra').select('preco').in('id', extrasIds);
                if (extrasPriceData) {
                    valorTotal += extrasPriceData.reduce((sum, e) => sum + Number(e.preco || 0), 0);
                }
            }


            let cupomDB = null;
            if (cupomCodigo) {
                const { data: cData } = await supabase.from('Cupom').select('*').eq('codigo', cupomCodigo.toUpperCase()).single();
                if (cData && cData.ativo) {
                    const validadeOk = !cData.data_validade || new Date(cData.data_validade) >= new Date();
                    const usosOk = !cData.limite_usos || cData.usos_atuais < cData.limite_usos;
                    if (validadeOk && usosOk) {
                        cupomDB = cData;
                        if (cupomDB.tipo_desconto === 'PERCENTUAL') {
                            valorTotal = valorTotal - (valorTotal * (Number(cupomDB.valor_desconto) / 100));
                        } else {
                            valorTotal = valorTotal - Number(cupomDB.valor_desconto);
                        }
                        if (valorTotal < 0) valorTotal = 0;
                    }
                }
            }
            // Salvar
            const nowReserva = new Date().toISOString();
            const { data: novaReserva, error } = await supabase
                .from('Reserva')
                .insert([{
                    id: crypto.randomUUID(),
                    quarto_id: quartoId,
                    hospede_id: hospedeDB.id,
                    canal_id: canalDB.id,
                    data_check_in: dataInicio,
                    data_check_out: dataFim,
                    status: (canalNome === 'SITE' || !canalNome) ? 'PENDENTE' : 'CONFIRMADA',
                    valor_total: valorTotal,
                    metodo_pagamento: metodoPagamento,
                    requerimentos_especiais: requerimentosEspeciais,
                    extras_ids: extrasIds && extrasIds.length > 0 ? extrasIds : null,
                    cupom_id: cupomDB ? cupomDB.id : null,
                    criado_em: nowReserva,
                    atualizado_em: nowReserva
                }])
                .select('*, Quarto(*), Hospede(*)')
                .single();

            if (error) {
                console.error('Reserva Insert Error:', error);
                throw error;
            }

            if (cupomDB) {
                await supabase.from('Cupom').update({ usos_atuais: cupomDB.usos_atuais + 1 }).eq('id', cupomDB.id);
            }

            const normalizedReserva = {
                ...novaReserva,
                quarto: novaReserva.Quarto,
                hospede: novaReserva.Hospede
            };

            console.log('7. EMAIL E RETORNO');
            if (canalNome === 'SITE' || !canalNome) {
                try { await EmailService.enviarEmailConfirmacaoReserva(hospedeDB, normalizedReserva); } catch (e) { console.error("Erro email:", e); }
            }

            return res.status(201).json({ status: 'success', data: normalizedReserva });
        } catch (error) {
            console.error("Erro criarReserva:", error.message || error);
            return res.status(500).json({ error: 'Erro ao criar reserva: ' + (error.message || JSON.stringify(error)) });
        }
    }

    // 2.1 Listar minhas reservas (Hóspede)
    static async listarMinhasReservas(req, res) {
        try {
            const hospedeId = req.usuarioId;
            const { data: reservas, error } = await supabase
                .from('Reserva')
                .select('*, Quarto(*)')
                .eq('hospede_id', hospedeId)
                .order('data_check_in', { ascending: false });

            if (error) throw error;
            return res.json({ status: 'success', data: reservas });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao listar reservas' });
        }
    }

    // 3. Status Management
    static async updateStatus(id, novoStatus, res) {
        try {
            const { data, error } = await supabase
                .from('Reserva')
                .update({ status: novoStatus })
                .eq('id', id)
                .select('*, Hospede(*), Quarto(*)')
                .single();

            if (error) throw error;

            const normalizedData = {
                ...data,
                quarto: data.Quarto,
                hospede: data.Hospede
            };

            if (novoStatus === 'CONFIRMADA' && normalizedData.hospede) {
                await EmailService.enviarEmailConfirmacao(normalizedData.hospede, normalizedData);
            }

            let aimaMessage = '';
            if (novoStatus === 'CHECK_IN' && normalizedData.hospede) {
                const aimaResult = await AimaService.enviarBoletim(normalizedData.hospede, normalizedData);
                if (aimaResult && aimaResult.sucesso) {
                    aimaMessage = ' | AIMA: Sucesso no envio!';
                } else if (aimaResult && aimaResult.erro) {
                    aimaMessage = ' | Erro AIMA: ' + aimaResult.erro;
                }
            }

            return res.json({ status: 'success', message: `Status alterado para ${novoStatus}${aimaMessage}`, data: normalizedData });
        } catch (error) {
            return res.status(500).json({ error: `Erro ao alterar status: ${error.message}` });
        }
    }

    static async cancelarReserva(req, res) { return ReservasController.updateStatus(req.params.id, 'CANCELADA', res); }
    static async confirmarReserva(req, res) { return ReservasController.updateStatus(req.params.id, 'CONFIRMADA', res); }
    static async checkIn(req, res) { return ReservasController.updateStatus(req.params.id, 'CHECK_IN', res); }
    static async checkOut(req, res) { return ReservasController.updateStatus(req.params.id, 'CHECK_OUT', res); }

    static async enviarAima(req, res) {
        try {
            const { id } = req.params;
            const { data, error } = await supabase
                .from('Reserva')
                .select('*, Hospede(*), Quarto(*)')
                .eq('id', id)
                .single();

            if (error || !data) throw error || new Error('Reserva não encontrada');

            const normalizedData = {
                ...data,
                quarto: data.Quarto,
                hospede: data.Hospede
            };

            if (!normalizedData.hospede) {
                return res.status(400).json({ error: 'Hóspede não encontrado para esta reserva' });
            }

            const resultado = await AimaService.enviarBoletim(normalizedData.hospede, normalizedData);

            if (resultado.sucesso) {
                return res.json({ status: 'success', message: resultado.mensagem });
            } else {
                return res.status(500).json({ status: 'error', error: resultado.erro });
            }

        } catch (error) {
            return res.status(500).json({ error: `Erro ao enviar AIMA: ${error.message}` });
        }
    }


    // 7. Admin List
    static async listarTodas(req, res) {
        try {
            const { data: reservas, error } = await supabase
                .from('Reserva')
                .select('*, Quarto(*), Hospede(*), Canal(*)')
                .order('criado_em', { ascending: false });

            if (error) throw error;

            // Normalizar chaves para o frontend (Hospede -> hospede, etc)
            const normalized = (reservas || []).map(r => ({
                ...r,
                quarto: r.Quarto,
                hospede: r.Hospede,
                canal: r.Canal
            }));

            return res.json({ status: 'success', data: normalized });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao listar reservas' });
        }
    }

    // 8. Dashboard
    static async getDashboardStats(req, res) {
        try {
            const agora = new Date();
            const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
            const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59).toISOString();
            const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString();
            const fimDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59).toISOString();

            const hoje = new Date();
            const seteDias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

            const { ano, mes } = req.query;
            const anoCal = parseInt(ano) || agora.getFullYear();
            const mesCal = parseInt(mes) || (agora.getMonth() + 1);
            const inicioCal = new Date(anoCal, mesCal - 1, 1).toISOString();
            const fimCal = new Date(anoCal, mesCal, 0, 23, 59, 59).toISOString();

            // Executar consultas concorrentemente para melhorar performance
            const [
                { data: reservasMes },
                { count: quartosAtivos },
                { data: reservasHoje },
                { data: proximosCheckins },
                { data: proximosCheckouts },
                { data: reservasCalendario },
                { data: bloqueios },
                { data: canais }
            ] = await Promise.all([
                // 1. KPIs do Mês
                supabase.from('Reserva')
                    .select('*')
                    .in('status', ['CONFIRMADA', 'CHECK_IN', 'CHECK_OUT'])
                    .gte('data_check_in', inicioMes)
                    .lte('data_check_in', fimMes),

                // 2. Quartos Ativos
                supabase.from('Quarto')
                    .select('*', { count: 'exact', head: true })
                    .eq('ativo', true),

                // 3. Reservas Hoje (Check-ins ativos)
                supabase.from('Reserva')
                    .select('*, Quarto(*), Hospede(*)')
                    .in('status', ['CONFIRMADA', 'CHECK_IN'])
                    .lte('data_check_in', fimDia)
                    .gte('data_check_out', inicioDia),

                // 4. Próximos Check-ins (7 dias)
                supabase.from('Reserva')
                    .select('*, Quarto(*), Hospede(*)')
                    .eq('status', 'CONFIRMADA')
                    .gte('data_check_in', inicioDia)
                    .lte('data_check_in', seteDias)
                    .order('data_check_in', { ascending: true }),

                // 5. Próximos Check-outs (7 dias)
                supabase.from('Reserva')
                    .select('*, Quarto(*), Hospede(*)')
                    .in('status', ['CHECK_IN', 'CONFIRMADA'])
                    .gte('data_check_out', inicioDia)
                    .lte('data_check_out', seteDias)
                    .order('data_check_out', { ascending: true }),

                // 6. Calendário
                supabase.from('Reserva')
                    .select('*, Quarto(*), Hospede(*)')
                    .neq('status', 'CANCELADA')
                    .or(`data_check_in.gte.${inicioCal},data_check_out.gte.${inicioCal}`),

                // 6.b Bloqueios
                supabase.from('Bloqueio')
                    .select('*, Quarto(*)')
                    .or(`data_inicio.gte.${inicioCal},data_fim.gte.${inicioCal}`),

                // 7. Canais
                supabase.from('Canal').select('*')
            ]);

            const receitaMes = reservasMes?.reduce((sum, r) => sum + Number(r.valor_total || 0), 0) || 0;

            const porCanal = {};
            for (const r of (reservasMes || [])) {
                const canal = canais?.find(c => c.id === r.canal_id);
                const nome = canal?.nome_canal || 'OUTRO';
                porCanal[nome] = (porCanal[nome] || 0) + 1;
            }

            // Normalização para o frontend
            const normRes = (r) => ({ ...r, quarto: r.Quarto, hospede: r.Hospede });
            const normBloq = (b) => ({ ...b, quarto: b.Quarto });

            return res.json({
                status: 'success',
                data: {
                    kpis: {
                        receitaMes: receitaMes,
                        reservasMes: reservasMes?.length || 0,
                        taxaOcupacao: 0,
                        quartosTotalAtivos: quartosAtivos || 0,
                        reservasHoje: reservasHoje?.length || 0
                    },
                    proximosCheckins: (proximosCheckins || []).map(normRes),
                    proximosCheckouts: (proximosCheckouts || []).map(normRes),
                    reservasCalendario: (reservasCalendario || []).map(normRes),
                    bloqueiosCalendario: (bloqueios || []).map(normBloq),
                    porCanal: porCanal,
                    calendarioMes: { ano: anoCal, mes: mesCal }
                }
            });
        } catch (error) {
            console.error('Erro Dashboard:', error.message);
            return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
        }
    }

    static async deletarReserva(req, res) {
        try {
            await supabase.from('Reserva').delete().eq('id', req.params.id);
            return res.json({ status: 'success', message: 'Reserva removida' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Webhooks placeholders
    static async webhookBooking(req, res) { return res.send('OK'); }
    static async webhookAirbnb(req, res) { return res.send('OK'); }

    // Sync methods
    static async syncIcal(req, res) {
        try {
            const IcalService = require('../services/ical.service');
            const { quartoId, url } = req.body;
            const result = await IcalService.syncCalendar(quartoId, url);
            return res.json({ status: 'success', ...result });
        } catch (error) {
            return res.status(500).json({ status: 'error', error: error.message });
        }
    }

    static async syncAll(req, res) {
        try {
            const IcalService = require('../services/ical.service');
            const resultados = await IcalService.syncAllQuartos();
            return res.json({ status: 'success', data: resultados });
        } catch (error) {
            return res.status(500).json({ status: 'error', error: error.message });
        }
    }
}

module.exports = ReservasController;

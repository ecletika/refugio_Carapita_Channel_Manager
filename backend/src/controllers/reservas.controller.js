const supabase = require('../config/supabase');
const EmailService = require('../services/email.service');
const AimaService = require('../services/aima.service');
const crypto = require('crypto');

class ReservasController {

    // 1. Listar Disponibilidade Real
    static async listarDisponibilidade(req, res) {
        try {
            // Gatilho automático de limpeza ao consultar disponibilidade
            // Silencioso para não atrasar a resposta do usuário significativamente
            ReservasController.limparReservasExpiradasInternal().catch(e => console.error("Erro cleanup auto:", e));

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
                .lte('data_check_in', dataFim)
                .gte('data_check_out', dataInicio);

            const { data: bloqueiosConflito } = await supabase.supabaseAdmin
                .from('Bloqueio')
                .select('quarto_id')
                .lte('data_inicio', dataFim)
                .gte('data_fim', dataInicio);

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
            // Limpar antes de tentar criar para garantir que datas expiradas estão livres
            // Removido await para não bloquear o início da criação
            ReservasController.limparReservasExpiradasInternal().catch(e => console.error("Erro cleanup auto:", e));

            console.log('1. INICIANDO CRIAR RESERVA', req.body);
            const { quartoId, hospede, checkIn, checkOut, canalNome, metodoPagamento, requerimentosEspeciais, extrasIds, cupomCodigo } = req.body;
            if (!quartoId || !hospede || !checkIn || !checkOut) return res.status(400).json({ error: 'Dados incompletos' });

            const dataInicio = new Date(`${checkIn}T00:00:00.000Z`).toISOString();
            const dataFim = new Date(`${checkOut}T00:00:00.000Z`).toISOString();

            // Buscar/Criar Hóspede - Mantido sequencial pois é dependência crítica
            let { data: hospedeDB } = await supabase.supabaseAdmin.from('Hospede').select('*').eq('email', hospede.email).single();
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
                const { data: novoH, error: errH } = await supabase.supabaseAdmin
                    .from('Hospede')
                    .insert([{ id: crypto.randomUUID(), email: hospede.email, criado_em: now, ...hospedeData }])
                    .select().single();
                if (errH) { console.error('Hospede Insert Error:', errH); throw errH; }
                hospedeDB = novoH;
            } else {
                const { data: updateH, error: errHUpd } = await supabase.supabaseAdmin
                    .from('Hospede')
                    .update(hospedeData)
                    .eq('id', hospedeDB.id)
                    .select().single();
                if (errHUpd) { console.error('Hospede Update Error:', errHUpd); throw errHUpd; }
                hospedeDB = updateH;
            }

            // --- BUSCAS PARALELAS (OTIMIZAÇÃO) ---
            console.log('4. BUSCANDO DADOS EM PARALELO');
            const [
                { data: canalDB },
                { data: quarto },
                { data: tarifasSazonais },
                { data: extrasPriceData },
                { data: cupomDB }
            ] = await Promise.all([
                // 1. Canal
                supabase.supabaseAdmin.from('Canal').select('*').eq('nome_canal', canalNome || 'SITE').single(),
                // 2. Quarto
                supabase.supabaseAdmin.from('Quarto').select('*').eq('id', quartoId).single(),
                // 3. Tarifas
                supabase.supabaseAdmin.from('TarifaSazonal').select('*').eq('quarto_id', quartoId),
                // 4. Extras
                (extrasIds && extrasIds.length > 0)
                    ? supabase.supabaseAdmin.from('Extra').select('preco').in('id', extrasIds)
                    : Promise.resolve({ data: [] }),
                // 5. Cupom
                cupomCodigo
                    ? supabase.supabaseAdmin.from('Cupom').select('*').eq('codigo', cupomCodigo.toUpperCase()).single()
                    : Promise.resolve({ data: null })
            ]);

            // Se canal não existir, criamos (raro para SITE)
            let finalCanal = canalDB;
            if (!finalCanal) {
                const nowCanal = new Date().toISOString();
                const { data: novoC, error: errC } = await supabase.supabaseAdmin
                    .from('Canal')
                    .insert([{ id: crypto.randomUUID(), nome_canal: canalNome || 'SITE', comissao_percentual: 0, criado_em: nowCanal, atualizado_em: nowCanal }])
                    .select().single();
                if (errC) { console.error('Canal Insert Error:', errC); throw errC; }
                finalCanal = novoC;
            }

            // Calcular Preço
            console.log('5. CALCULANDO PRECO');
            let valorTotal = 0;
            let d = new Date(`${checkIn}T00:00:00.000Z`);
            const dFim = new Date(`${checkOut}T00:00:00.000Z`);
            let limit = 0;
            
            while (d < dFim && limit < 1000) {
                limit++;
                const currentYmd = d.toISOString().split('T')[0];
                const tarifasAplicaveis = tarifasSazonais?.filter(tf => {
                    const tInStr = tf.data_inicio.split('T')[0];
                    const tOutStr = tf.data_fim.split('T')[0];
                    return currentYmd >= tInStr && currentYmd <= tOutStr;
                }) || [];

                let tarifaSazonal = null;
                if (tarifasAplicaveis.length > 0) {
                    tarifaSazonal = tarifasAplicaveis.reduce((prev, curr) => {
                        const duracaoPrev = new Date(prev.data_fim).getTime() - new Date(prev.data_inicio).getTime();
                        const duracaoCurr = new Date(curr.data_fim).getTime() - new Date(curr.data_inicio).getTime();
                        if (duracaoCurr === duracaoPrev) return Number(curr.preco_noite) > Number(prev.preco_noite) ? curr : prev;
                        return duracaoCurr < duracaoPrev ? curr : prev;
                    });
                }

                valorTotal += Number(tarifaSazonal ? tarifaSazonal.preco_noite : quarto.preco_base);
                d.setUTCDate(d.getUTCDate() + 1);
            }

            // Somar Extras
            if (extrasPriceData && extrasPriceData.length > 0) {
                valorTotal += extrasPriceData.reduce((sum, e) => sum + Number(e.preco || 0), 0);
            }

            // Aplicar Cupom
            let cupomValido = null;
            if (cupomDB && cupomDB.ativo) {
                const validadeOk = !cupomDB.data_validade || new Date(cupomDB.data_validade) >= new Date();
                const usosOk = !cupomDB.limite_usos || cupomDB.usos_atuais < cupomDB.limite_usos;
                if (validadeOk && usosOk) {
                    cupomValido = cupomDB;
                    if (cupomValido.tipo_desconto === 'PERCENTUAL') {
                        valorTotal = valorTotal - (valorTotal * (Number(cupomValido.valor_desconto) / 100));
                    } else {
                        valorTotal = valorTotal - Number(cupomValido.valor_desconto);
                    }
                    if (valorTotal < 0) valorTotal = 0;
                }
            }

            // Salvar Reserva
            const nowReserva = new Date().toISOString();
            const { data: novaReserva, error } = await supabase.supabaseAdmin
                .from('Reserva')
                .insert([{
                    id: crypto.randomUUID(),
                    quarto_id: quartoId,
                    hospede_id: hospedeDB.id,
                    canal_id: finalCanal.id,
                    data_check_in: dataInicio,
                    data_check_out: dataFim,
                    status: (canalNome === 'SITE' || !canalNome) ? 'PENDENTE' : 'CONFIRMADA',
                    valor_total: valorTotal,
                    metodo_pagamento: metodoPagamento,
                    requerimentos_especiais: requerimentosEspeciais,
                    extras_ids: extrasIds && extrasIds.length > 0 ? extrasIds : null,
                    cupom_id: cupomValido ? cupomValido.id : null,
                    criado_em: nowReserva,
                    atualizado_em: nowReserva
                }])
                .select('*, Quarto(*), Hospede(*)')
                .single();

            if (error) { console.error('Reserva Insert Error:', error); throw error; }

            // Atualizar usos do cupom em background
            if (cupomValido) {
                supabase.supabaseAdmin.from('Cupom').update({ usos_atuais: cupomValido.usos_atuais + 1 }).eq('id', cupomValido.id).then();
            }

            const normalizedReserva = {
                ...novaReserva,
                quarto: novaReserva.Quarto,
                hospede: novaReserva.Hospede
            };

            // Enviar e-mail em background (Não bloqueia a resposta ao usuário)
            console.log('7. DISPARANDO EMAIL (ASYNC)');
            if (canalNome === 'SITE' || !canalNome) {
                EmailService.enviarEmailConfirmacaoReserva(hospedeDB, normalizedReserva).catch(e => console.error("Erro email async:", e));
            }

            // Retorna imediatamente
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

    // 4. Limpeza de Reservas Expiradas (PENDENTES > 48h)
    static async limparReservasExpiradas(req, res) {
        const result = await ReservasController.limparReservasExpiradasInternal();
        if (result.error) {
            return res.status(500).json({ error: result.error });
        }
        return res.json({ status: 'success', ...result });
    }

    static async limparReservasExpiradasInternal() {
        try {
            const limite = new Date();
            limite.setHours(limite.getHours() - 48);
            const limiteIso = limite.toISOString();

            // Buscar reservas pendentes expiradas
            const { data: expiradas, error: selectErr } = await supabase.supabaseAdmin
                .from('Reserva')
                .select('id')
                .eq('status', 'PENDENTE')
                .lt('criado_em', limiteIso);

            if (selectErr) return { error: selectErr.message };

            if (!expiradas || expiradas.length === 0) {
                return { count: 0 };
            }

            const ids = expiradas.map(r => r.id);
            // Cancelar em massa
            const { error: updateErr } = await supabase.supabaseAdmin
                .from('Reserva')
                .update({ 
                    status: 'CANCELADA', 
                    atualizado_em: new Date().toISOString() 
                })
                .in('id', ids);

            if (updateErr) return { error: updateErr.message };

            return { count: ids.length, ids };
        } catch (error) {
            return { error: error.message };
        }
    }

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
                supabase.supabaseAdmin.from('Reserva')
                    .select('*')
                    .in('status', ['CONFIRMADA', 'CHECK_IN', 'CHECK_OUT'])
                    .gte('data_check_in', inicioMes)
                    .lte('data_check_in', fimMes),

                // 2. Quartos Ativos
                supabase.supabaseAdmin.from('Quarto')
                    .select('*', { count: 'exact', head: true })
                    .eq('ativo', true),

                // 3. Reservas Hoje (Check-ins ativos)
                supabase.supabaseAdmin.from('Reserva')
                    .select('*, Quarto(*), Hospede(*)')
                    .in('status', ['CONFIRMADA', 'CHECK_IN'])
                    .lte('data_check_in', fimDia)
                    .gte('data_check_out', inicioDia),

                // 4. Próximos Check-ins (7 dias)
                supabase.supabaseAdmin.from('Reserva')
                    .select('*, Quarto(*), Hospede(*)')
                    .eq('status', 'CONFIRMADA')
                    .gte('data_check_in', inicioDia)
                    .lte('data_check_in', seteDias)
                    .order('data_check_in', { ascending: true }),

                // 5. Próximos Check-outs (7 dias)
                supabase.supabaseAdmin.from('Reserva')
                    .select('*, Quarto(*), Hospede(*)')
                    .in('status', ['CHECK_IN', 'CONFIRMADA'])
                    .gte('data_check_out', inicioDia)
                    .lte('data_check_out', seteDias)
                    .order('data_check_out', { ascending: true }),

                // 6. Calendário
                supabase.supabaseAdmin.from('Reserva')
                    .select('*, Quarto(*), Hospede(*)')
                    .neq('status', 'CANCELADA')
                    .or(`data_check_in.gte.${inicioCal},data_check_out.gte.${inicioCal}`),

                // 6.b Bloqueios
                supabase.supabaseAdmin.from('Bloqueio')
                    .select('*, Quarto(*)')
                    .or(`data_inicio.gte.${inicioCal},data_fim.gte.${inicioCal}`),

                // 7. Canais
                supabase.supabaseAdmin.from('Canal').select('*')
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
            await supabase.supabaseAdmin.from('Reserva').delete().eq('id', req.params.id);
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

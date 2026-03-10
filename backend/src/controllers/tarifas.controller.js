const supabase = require('../config/supabase');
const crypto = require('crypto');

class TarifasController {
    // 1. Listar Tarifas de um Quarto
    static async listar(req, res) {
        try {
            const { quartoId } = req.query;
            let query = supabase
                .from('TarifaSazonal')
                .select('*, Quarto:quarto_id(nome)')
                .order('data_inicio', { ascending: true });

            if (quartoId) {
                query = query.eq('quarto_id', quartoId);
            }

            const { data: tarifas, error } = await query;

            if (error) throw error;
            return res.json({ status: 'success', data: tarifas });
        } catch (error) {
            console.error('Erro listar tarifas:', error.message);
            return res.status(500).json({ error: 'Erro ao listar tarifas' });
        }
    }

    // 2. Criar ou Atualizar Tarifa
    static async upsert(req, res) {
        try {
            const { id } = req.body;
            const quartoId = req.body.quartoId || req.body.quarto_id;
            const dataInicio = req.body.dataInicio || req.body.data_inicio;
            const dataFim = req.body.dataFim || req.body.data_fim;
            const precoNoite = req.body.precoNoite || req.body.preco_noite;
            const motivo = req.body.motivo || '';
            const politicaCancelamento = req.body.politicaCancelamento || req.body.politica_cancelamento || 'FLEXIVEL';
            const minimaEstadia = req.body.minimaEstadia || req.body.minima_estadia || 2;

            if (!quartoId || !dataInicio || !dataFim || !precoNoite) {
                return res.status(400).json({ error: 'Dados incompletos' });
            }

            const payload = {
                quarto_id: quartoId,
                data_inicio: new Date(dataInicio).toISOString(),
                data_fim: new Date(dataFim).toISOString(),
                preco_noite: Number(precoNoite),
                motivo: motivo || null,
                politica_cancelamento: politicaCancelamento,
                minima_estadia: Number(minimaEstadia)
            };

            let result;
            if (id) {
                // Update
                result = await supabase
                    .from('TarifaSazonal')
                    .update(payload)
                    .eq('id', id)
                    .select()
                    .single();
            } else {
                // Insert
                result = await supabase
                    .from('TarifaSazonal')
                    .insert([{
                        id: crypto.randomUUID(),
                        ...payload
                    }])
                    .select()
                    .single();
            }

            const { data, error } = result;

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }
            return res.status(id ? 200 : 201).json({ status: 'success', data });
        } catch (error) {
            console.error('Erro salvar tarifa:', error.message || error);
            return res.status(500).json({ error: 'Erro ao salvar tarifa' });
        }
    }

    // 3. Deletar Tarifa
    static async deletar(req, res) {
        try {
            const { id } = req.params;
            const { error } = await supabase.from('TarifaSazonal').delete().eq('id', id);
            if (error) throw error;
            return res.json({ status: 'success', message: 'Tarifa removida' });
        } catch (error) {
            console.error('Erro deletar tarifa:', error.message);
            return res.status(500).json({ error: 'Erro ao deletar tarifa' });
        }
    }

    // 4. Obter Calendário de Preços para um Quarto
    static async obterCalendarioPrecos(req, res) {
        try {
            const { quartoId, inicio, fim } = req.query;
            if (!quartoId || !inicio || !fim) {
                return res.status(400).json({ error: 'Parâmetros incompletos' });
            }

            // Normalizar para YYYY-MM-DD para evitar problemas com fuso horário/horas
            const startStr = inicio.includes('T') ? inicio.split('T')[0] : inicio;
            const endStr = fim.includes('T') ? fim.split('T')[0] : fim;

            const queryStart = `${startStr}T00:00:00.000Z`;
            const queryEnd = `${endStr}T23:59:59.999Z`;

            // Buscar Quarto para ter o preco_base
            const { data: quarto, error: errQuarto } = await supabase.supabaseAdmin
                .from('Quarto')
                .select('*')
                .eq('id', quartoId)
                .single();

            if (errQuarto || !quarto) return res.status(404).json({ error: 'Quarto não encontrado' });

            // Buscar Tarifas
            const { data: tarifasSazonais } = await supabase.supabaseAdmin
                .from('TarifaSazonal')
                .select('*')
                .eq('quarto_id', quartoId)
                .lte('data_inicio', queryEnd)
                .gte('data_fim', queryStart);

            const { data: reservasExistentes } = await supabase.supabaseAdmin
                .from('Reserva')
                .select('*')
                .eq('quarto_id', quartoId)
                .not('status', 'in', '("CANCELADA","EXPIRADA")')
                .lte('data_check_in', queryEnd)
                .gte('data_check_out', queryStart);

            const { data: bloqueiosManuais } = await supabase.supabaseAdmin
                .from('Bloqueio')
                .select('*')
                .eq('quarto_id', quartoId)
                .lte('data_inicio', queryEnd)
                .gte('data_fim', queryStart);

            const calendario = [];
            let dataAtual = new Date(`${startStr}T00:00:00.000Z`);
            const dataLimite = new Date(`${endStr}T00:00:00.000Z`);

            const hoje = new Date();
            hoje.setUTCHours(0, 0, 0, 0);

            while (dataAtual <= dataLimite) {
                const isoData = dataAtual.toISOString().split('T')[0];

                // Filtra todas as tarifas que cobrem esta data
                const tarifasAplicáveis = tarifasSazonais?.filter(t => {
                    const tInStr = t.data_inicio.split('T')[0];
                    const tOutStr = t.data_fim.split('T')[0];
                    return isoData >= tInStr && isoData <= tOutStr;
                }) || [];

                // Se houver mais de uma, escolhemos a que tiver o menor período (mais específica)
                let tarifaSazonal = null;
                if (tarifasAplicáveis.length > 0) {
                    tarifaSazonal = tarifasAplicáveis.reduce((prev, curr) => {
                        const duracaoPrev = new Date(prev.data_fim).getTime() - new Date(prev.data_inicio).getTime();
                        const duracaoCurr = new Date(curr.data_fim).getTime() - new Date(curr.data_inicio).getTime();
                        return duracaoCurr < duracaoPrev ? curr : prev;
                    });
                }

                const estaReservada = reservasExistentes?.some(r => {
                    const rInStr = r.data_check_in.split('T')[0];
                    const rOutStr = r.data_check_out.split('T')[0];
                    return isoData >= rInStr && isoData < rOutStr;
                });

                const estaBloqueado = bloqueiosManuais?.some(b => {
                    const bInStr = b.data_inicio.split('T')[0];
                    const bOutStr = b.data_fim.split('T')[0];
                    // Se início == fim, bloqueia o dia. Se início < fim, libera o dia de check-out.
                    if (bInStr === bOutStr) return isoData === bInStr;
                    return isoData >= bInStr && isoData < bOutStr;
                });

                const noPassado = dataAtual < hoje;

                // Regra 1: Bloquear o dia de check-out sempre (não permitir novo check-in se alguém sai)
                // Se o dia atual coincidir com o check-out de alguém, marcamos como bloqueado para check-in
                const eDiaDeCheckOut = reservasExistentes?.some(r => r.data_check_out.split('T')[0] === isoData);

                calendario.push({
                    data: isoData,
                    preco: tarifaSazonal ? Number(tarifaSazonal.preco_noite) : Number(quarto.preco_base),
                    disponivel: !estaReservada && !estaBloqueado && !noPassado && !eDiaDeCheckOut,
                    minimaEstadia: tarifaSazonal ? Number(tarifaSazonal.minima_estadia) : Number(quarto.minima_estadia_padrao || 2),
                    eCheckOut: eDiaDeCheckOut
                });

                dataAtual.setUTCDate(dataAtual.getUTCDate() + 1);
            }

            return res.json({ status: 'success', data: calendario });
        } catch (error) {
            console.error('Erro gerar calendário preços:', error.message);
            return res.status(500).json({ error: 'Erro ao gerar calendário de preços' });
        }
    }
}

module.exports = TarifasController;

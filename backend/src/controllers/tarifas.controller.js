const supabase = require('../config/supabase');

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
            const quartoId = req.body.quartoId || req.body.quarto_id;
            const dataInicio = req.body.dataInicio || req.body.data_inicio;
            const dataFim = req.body.dataFim || req.body.data_fim;
            const precoNoite = req.body.precoNoite || req.body.preco_noite;
            const motivo = req.body.motivo || '';

            if (!quartoId || !dataInicio || !dataFim || !precoNoite) {
                return res.status(400).json({ error: 'Dados incompletos' });
            }

            const { data: novaTarifa, error } = await supabase
                .from('TarifaSazonal')
                .insert([{
                    quarto_id: quartoId,
                    data_inicio: new Date(dataInicio).toISOString(),
                    data_fim: new Date(dataFim).toISOString(),
                    preco_noite: Number(precoNoite),
                    motivo: motivo || null
                }])
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json({ status: 'success', data: novaTarifa });
        } catch (error) {
            console.error('Erro salvar tarifa:', error.message);
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

            const dataInicio = new Date(inicio);
            const dataFim = new Date(fim);

            // Buscar Quarto
            const { data: quarto, error: errQuarto } = await supabase
                .from('Quarto')
                .select('*')
                .eq('id', quartoId)
                .single();

            if (errQuarto || !quarto) return res.status(404).json({ error: 'Quarto não encontrado' });

            // Buscar Tarifas
            const { data: tarifasSazonais } = await supabase
                .from('TarifaSazonal')
                .select('*')
                .eq('quarto_id', quartoId)
                .lte('data_inicio', dataFim.toISOString())
                .gte('data_fim', dataInicio.toISOString());

            // Buscar Reservas
            const { data: reservasExistentes } = await supabase
                .from('Reserva')
                .select('*')
                .eq('quarto_id', quartoId)
                .not('status', 'in', '("CANCELADA","EXPIRADA")')
                .or(`data_check_in.lte.${dataFim.toISOString()},data_check_out.gte.${dataInicio.toISOString()}`);

            // Buscar Bloqueios
            const { data: bloqueiosManuais } = await supabase
                .from('Bloqueio')
                .select('*')
                .eq('quarto_id', quartoId)
                .lte('data_inicio', dataFim.toISOString())
                .gte('data_fim', dataInicio.toISOString());

            const calendario = [];
            let dataAtual = new Date(dataInicio);

            while (dataAtual <= dataFim) {
                const isoData = dataAtual.toISOString().split('T')[0];

                const tarifaSazonal = tarifasSazonais?.find(t =>
                    new Date(t.data_inicio) <= dataAtual && new Date(t.data_fim) >= dataAtual
                );

                const estaReservada = reservasExistentes?.some(r => {
                    const rIn = new Date(r.data_check_in);
                    const rOut = new Date(r.data_check_out);
                    return dataAtual >= rIn && dataAtual < rOut;
                });

                const estaBloqueado = bloqueiosManuais?.some(b => {
                    const bIn = new Date(b.data_inicio);
                    const bOut = new Date(b.data_fim);
                    return dataAtual >= bIn && dataAtual < bOut;
                });

                calendario.push({
                    data: isoData,
                    preco: tarifaSazonal ? Number(tarifaSazonal.preco_noite) : Number(quarto.preco_base),
                    disponivel: !estaReservada && !estaBloqueado
                });

                dataAtual.setDate(dataAtual.getDate() + 1);
            }

            return res.json({ status: 'success', data: calendario });
        } catch (error) {
            console.error('Erro gerar calendário preços:', error.message);
            return res.status(500).json({ error: 'Erro ao gerar calendário de preços' });
        }
    }
}

module.exports = TarifasController;

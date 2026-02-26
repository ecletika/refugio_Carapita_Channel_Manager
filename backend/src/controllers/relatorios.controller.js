const supabase = require('../config/supabase');

class RelatoriosController {
    static async getGeneralStats(req, res) {
        try {
            const { inicio, fim } = req.query; // Datas ISO

            // 1. Receita Total e Reservas no período
            console.log('--- Relatórios [Supabase]: Calculando Receita ---');

            let queryReservas = supabase
                .from('Reserva')
                .select('*, Canal(nome_canal), Quarto(nome)')
                .neq('status', 'CANCELADA');

            if (inicio) queryReservas = queryReservas.gte('data_check_in', inicio);
            if (fim) queryReservas = queryReservas.lte('data_check_out', fim);

            const { data: reservas, error: errRes } = await queryReservas;
            if (errRes) throw errRes;

            const receitaTotal = reservas?.reduce((sum, r) => sum + Number(r.valor_total || 0), 0) || 0;
            console.log(`Receita calculada: ${receitaTotal} para ${reservas?.length || 0} reservas.`);

            // 2. Ocupação por Quarto (Agrupado via script)
            const ocupacaoMap = {};
            reservas?.forEach(r => {
                const nome = r.Quarto?.nome || 'Desconhecido';
                ocupacaoMap[nome] = (ocupacaoMap[nome] || 0) + 1;
            });
            const ocupacaoPorQuarto = Object.entries(ocupacaoMap).map(([nome, total]) => ({ nome, totalReservas: total }));

            // 3. Reservas por Canal (Agrupado via script)
            const canalMap = {};
            reservas?.forEach(r => {
                const canal = r.Canal?.nome_canal || 'SITE';
                canalMap[canal] = (canalMap[canal] || 0) + 1;
            });
            const porCanal = Object.entries(canalMap).map(([canal, count]) => ({ canal, count }));

            return res.json({
                status: 'success',
                data: {
                    receitaTotal,
                    totalReservas: reservas?.length || 0,
                    ocupacaoPorQuarto,
                    porCanal
                }
            });
        } catch (error) {
            console.error('❌ ERRO RELATÓRIOS:', error.message);
            res.status(500).json({ error: 'Erro ao gerar relatórios', details: error.message });
        }
    }
}

module.exports = RelatoriosController;

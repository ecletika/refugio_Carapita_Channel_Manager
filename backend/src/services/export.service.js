const { createEvents } = require('ics');
const supabase = require('../config/supabase');

class ExportService {
    /**
     * Gera o conteúdo iCal (.ics) para um Quarto específico.
     * Inclui tanto as Reservas quanto os Bloqueios Manuais.
     * @param {string} quartoId 
     */
    static async generateIcal(quartoId) {
        try {
            // Buscar Quarto
            const { data: quarto, error: errQuarto } = await supabase
                .from('Quarto')
                .select('*')
                .eq('id', quartoId)
                .single();

            if (errQuarto || !quarto) throw new Error('Quarto não encontrado');

            // Buscar Reservas
            const { data: reservas } = await supabase
                .from('Reserva')
                .select('*')
                .eq('quarto_id', quartoId)
                .neq('status', 'CANCELADA');

            // Buscar Bloqueios
            const { data: bloqueios } = await supabase
                .from('Bloqueio')
                .select('*')
                .eq('quarto_id', quartoId);

            const events = [];

            // Adicionar Reservas
            reservas?.forEach(res => {
                const start = new Date(res.data_check_in);
                const end = new Date(res.data_check_out);

                events.push({
                    start: [start.getFullYear(), start.getMonth() + 1, start.getDate()],
                    end: [end.getFullYear(), end.getMonth() + 1, end.getDate()],
                    title: 'Ocupado (Refúgio Carapita)',
                    description: `Reserva #${res.id.slice(0, 8)}`,
                    status: 'CONFIRMED',
                    busyStatus: 'BUSY'
                });
            });

            // Adicionar Bloqueios Manuais
            bloqueios?.forEach(blq => {
                const start = new Date(blq.data_inicio);
                const end = new Date(blq.data_fim);

                events.push({
                    start: [start.getFullYear(), start.getMonth() + 1, start.getDate()],
                    end: [end.getFullYear(), end.getMonth() + 1, end.getDate()],
                    title: `Manutenção / Bloqueio: ${blq.motivo || 'Indisponível'}`,
                    description: 'Bloqueio manual realizado pelo administrador',
                    status: 'CONFIRMED',
                    busyStatus: 'BUSY'
                });
            });

            const { error, value } = createEvents(events);
            if (error) throw error;

            return value;
        } catch (error) {
            console.error('Erro ao gerar ICS:', error);
            throw error;
        }
    }
}

module.exports = ExportService;

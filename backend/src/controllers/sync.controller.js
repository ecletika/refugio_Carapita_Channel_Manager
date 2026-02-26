const SyncICalService = require('../services/sync_ical.service');

class SyncController {
    static async syncAirbnb(req, res) {
        try {
            const { quartoId } = req.params;
            const count = await SyncICalService.syncQuarto(quartoId);
            return res.json({
                status: 'success',
                message: `Sincronização concluída. ${count} bloqueios atualizados.`,
                count
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: error.message || 'Erro ao sincronizar calendário' });
        }
    }
}

module.exports = SyncController;

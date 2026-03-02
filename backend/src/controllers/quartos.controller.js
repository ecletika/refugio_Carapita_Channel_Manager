const supabase = require('../config/supabase');
const crypto = require('crypto');

class QuartosController {
    // 1. Listar todos os quartos
    static async listar(req, res) {
        try {
            const { ativo } = req.query;
            let query = supabase
                .from('Quarto')
                .select('*')
                .order('criado_em', { ascending: false });

            if (ativo === 'true') {
                query = query.eq('ativo', true);
            }

            const { data: quartos, error } = await query;

            if (error) throw error;
            return res.json({ status: 'success', data: quartos });
        } catch (error) {
            console.error('Erro ao listar quartos:', error.message);
            return res.status(500).json({ error: 'Erro ao listar quartos' });
        }
    }

    // 2. Criar novo quarto
    static async criar(req, res) {
        try {
            const { nome, tipo, descricao, capacidade, precoBase, fotos, icalUrl, icalAirbnb, icalBooking, comodidades, videoUrl, minimaEstadiaPadrao } = req.body;

            if (!nome || !capacidade || !precoBase) {
                return res.status(400).json({ error: 'Nome, capacidade e preço base são obrigatórios' });
            }

            const { data: novoQuarto, error } = await supabase
                .from('Quarto')
                .insert([{
                    id: crypto.randomUUID(),
                    nome,
                    tipo: tipo || 'Quarto',
                    descricao,
                    capacidade: parseInt(capacidade),
                    preco_base: parseFloat(precoBase),
                    fotos: fotos,
                    comodidades: comodidades,
                    ical_url: icalUrl,
                    ical_airbnb: icalAirbnb,
                    ical_booking: icalBooking,
                    video_url: videoUrl,
                    minima_estadia_padrao: minimaEstadiaPadrao ? parseInt(minimaEstadiaPadrao) : 2,
                    ativo: true
                }])
                .select()
                .single();

            if (error) {
                console.error('Quarto Insert Error:', error);
                throw error;
            }
            return res.status(201).json({ status: 'success', data: novoQuarto });
        } catch (error) {
            console.error('Erro criar quarto:', error.message || error);
            return res.status(500).json({ error: 'Erro ao criar quarto' });
        }
    }

    // 3. Atualizar quarto
    static async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { nome, tipo, descricao, capacidade, precoBase, fotos, icalUrl, icalAirbnb, icalBooking, ativo, comodidades, videoUrl, minimaEstadiaPadrao } = req.body;

            const { data: quartoAtualizado, error } = await supabase
                .from('Quarto')
                .update({
                    nome,
                    tipo,
                    descricao,
                    capacidade: capacidade ? parseInt(capacidade) : undefined,
                    preco_base: precoBase ? parseFloat(precoBase) : undefined,
                    fotos: fotos,
                    comodidades: comodidades,
                    ical_url: icalUrl,
                    ical_airbnb: icalAirbnb,
                    ical_booking: icalBooking,
                    video_url: videoUrl,
                    minima_estadia_padrao: minimaEstadiaPadrao ? parseInt(minimaEstadiaPadrao) : undefined,
                    ativo
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return res.json({ status: 'success', data: quartoAtualizado });
        } catch (error) {
            console.error('Erro atualizar quarto:', error.message);
            return res.status(500).json({ error: 'Erro ao atualizar quarto' });
        }
    }

    // 4. Deletar quarto
    static async deletar(req, res) {
        try {
            const { id } = req.params;
            const { error } = await supabase.from('Quarto').delete().eq('id', id);
            if (error) throw error;
            return res.json({ status: 'success', message: 'Quarto removido com sucesso' });
        } catch (error) {
            console.error('Erro deletar quarto:', error.message);
            return res.status(500).json({ error: 'Erro ao remover quarto' });
        }
    }

    // 5. Exportar iCal
    static async exportIcal(req, res) {
        try {
            const { id } = req.params;
            const ExportService = require('../services/export.service');
            const icsContent = await ExportService.generateIcal(id);

            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="quarto-${id}.ics"`);
            return res.send(icsContent);
        } catch (error) {
            console.error('Erro iCal:', error.message);
            return res.status(500).send('Erro ao gerar calendário');
        }
    }
}

module.exports = QuartosController;

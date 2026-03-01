const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middlewares/auth.middleware');

// Configuração do cliente Supabase (Usamos a Service Role Key para permitir uploads no bucket se o RLS estiver ativo)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

// Usar Memory Storage para o Multer (não salvar no disco)
const upload = multer({ storage: multer.memoryStorage() });

// Rota para upload de imagem diretamente para o Supabase Storage
router.post('/', authMiddleware, upload.single('foto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const fileName = `${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;

        // Upload para o bucket 'carapita-images'
        const { data, error } = await supabase.storage
            .from('carapita-images')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) throw error;

        // Obter a URL pública do ficheiro
        const { data: { publicUrl } } = supabase.storage
            .from('carapita-images')
            .getPublicUrl(fileName);

        console.log(`📸 Imagem enviada para o Supabase: ${publicUrl}`);
        return res.json({ status: 'success', url: publicUrl });

    } catch (error) {
        console.error('❌ Erro no upload Supabase:', error.message);
        return res.status(500).json({ error: 'Erro ao processar upload para a nuvem' });
    }
});

module.exports = router;

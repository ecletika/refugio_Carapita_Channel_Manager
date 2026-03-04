const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Webhook Stripe precisa de raw body ANTES do express.json ──────────────────
// (registado aqui para garantir que não é interceptado pelo middleware JSON)
const pagamentosRoutes = require('./routes/pagamentos.routes');
app.post('/api/pagamentos/webhook',
    express.raw({ type: 'application/json' }),
    (req, res, next) => {
        const PagamentosController = require('./controllers/pagamentos.controller');
        return PagamentosController.webhookStripe(req, res, next);
    }
);

// Middlewares Globais
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Permite receber JSON

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Importando rotas
const reservasRoutes = require('./routes/reservas.routes');
const authRoutes = require('./routes/auth.routes');
const hospedeAuthRoutes = require('./routes/hospede_auth.routes');
const tarifasRoutes = require('./routes/tarifas.routes');
const quartosRoutes = require('./routes/quartos.routes');
const syncRoutes = require('./routes/sync.routes');
const bloqueiosRoutes = require('./routes/bloqueios.routes');
const uploadRoutes = require('./routes/upload.routes');

const extraRoutes = require('./routes/extras.routes');
const relatoriosRoutes = require('./routes/relatorios.routes');
const siteRoutes = require('./routes/site.routes');
const comodidadesRoutes = require('./routes/comodidades.routes');

// Montando as rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/hospede', hospedeAuthRoutes);
app.use('/api/tarifas', tarifasRoutes);
app.use('/api/quartos', quartosRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/bloqueios', bloqueiosRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/extras', extraRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/comodidades', comodidadesRoutes);
app.use('/api/pagamentos', pagamentosRoutes);

// Rota de Healthcheck
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API do Refúgio Carapita Channel Manager online.' });
});

app.listen(PORT, () => {
    console.log(`🏨 Servidor rodando na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT}/api/health`);

    // ── Automação: Sincronização iCal (A cada 30 minutos) ──────────────────
    const IcalService = require('./services/ical.service');
    setInterval(async () => {
        try {
            await IcalService.syncAllQuartos();
        } catch (error) {
            console.error('Erro na sincronização automática:', error.message);
        }
    }, 30 * 60 * 1000);

    // ── Automação: Scheduler de Pagamentos e Emails (A cada 15 minutos) ────
    const SchedulerService = require('./services/scheduler.service');
    console.log('⏰ Scheduler de pagamentos iniciado (intervalo: 15 min)');
    setInterval(async () => {
        try {
            await SchedulerService.executar();
        } catch (error) {
            console.error('Erro no scheduler:', error.message);
        }
    }, 15 * 60 * 1000); // 15 min

    // Executar imediatamente na inicialização
    setTimeout(async () => {
        try {
            await SchedulerService.executar();
        } catch (error) {
            console.error('Erro scheduler inicial:', error.message);
        }
    }, 3000);
});


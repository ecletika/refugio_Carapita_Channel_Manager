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

// Timeout global de 55 segundos por pedido
app.use((req, res, next) => {
    res.setTimeout(55000, () => {
        console.error(`⏱ Timeout: ${req.method} ${req.originalUrl}`);
        if (!res.headersSent) {
            res.status(503).json({ error: 'O servidor demorou demasiado a responder. Tente novamente.' });
        }
    });
    next();
});

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
const cuponsRoutes = require('./routes/cupons.routes');

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
app.use('/api/cupons', cuponsRoutes);

// Rota de Healthcheck
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API do Refúgio Carapita Channel Manager online.' });
});

// ── REMOVIDO: rota /api/ical-diag ────────────────────────────────────────────
// Tinha o token de exportação iCal do Booking escrito em claro no código, o que
// dava a quem tivesse acesso ao repositório a leitura do calendário de reservas.
// O diagnóstico do iCal faz-se agora pelo painel (Integrações → estado de cada
// canal) e pela tabela SyncLog, que regista cada sincronização.
//
// NOTA: se esse token alguma vez foi partilhado, gere um link novo na extranet
// do Booking — o antigo continua válido até ser revogado.

app.listen(PORT, () => {
    console.log(`🏨 Servidor rodando na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT}/api/health`);

    // ── Sincronização iCal: DESLIGADA neste backend ────────────────────────
    // Em produção quem sincroniza é a edge function `sync-ical`, chamada pelo
    // cron do Supabase de hora a hora. Este backend corria na máquina local e
    // escrevia nas MESMAS tabelas, num formato diferente (gravava o UID do iCal
    // em codigo_reserva_externo em vez de ical_uid), o que criava reservas que
    // a edge function nem reconhecia nem conseguia manter actualizadas.
    //
    // Duas fontes a escrever reservas sem se conhecerem é como se chega a
    // importações duplicadas e a estados impossíveis de explicar. As reservas
    // de Booking/Airbnb que restavam na base de dados a 19/09/2026 tinham
    // vindo daqui — e pararam a 31/08/2026, quando esta máquina deixou de
    // correr, sem ninguém dar por isso.
    //
    // A sincronização manual continua disponível em /api/sync/:quartoId para
    // uso pontual, mas nada aqui corre sozinho.
    console.log('ℹ️  Sync iCal automático desligado neste backend (corre na edge function sync-ical).');

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


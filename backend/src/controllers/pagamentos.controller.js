const supabase = require('../config/supabase');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key');
const EmailService = require('../services/email.service');

const frontendUrl = process.env.NODE_ENV === 'production'
    ? 'https://refugiocarapita.com'
    : 'http://localhost:3000';

class PagamentosController {

    /**
     * GET /api/pagamentos/reserva/:reservaId
     * Retorna os dados de pagamento duma reserva (para o perfil do cliente)
     */
    static async getDetalhesPagamento(req, res) {
        try {
            const { reservaId } = req.params;
            const hospedeId = req.usuarioId;

            // Verificar que a reserva pertence ao hóspede autenticado
            const { data: reserva, error } = await supabase.supabaseAdmin
                .from('Reserva')
                .select('*, Quarto(*), Hospede(*)')
                .eq('id', reservaId)
                .eq('hospede_id', hospedeId)
                .single();

            if (error || !reserva) {
                return res.status(404).json({ error: 'Reserva não encontrada' });
            }

            const valorTotal = Number(reserva.valor_total);
            const valor50 = valorTotal * 0.5;

            // Determinar o que está pago
            const pagouInicial = !!reserva.pagamento_inicial_em;
            const pagouTotal = !!reserva.pagamento_total_em;

            let valorPago = 0;
            let valorEmAberto = 0;
            let parcelaPendente = null;

            if (pagouTotal) {
                valorPago = valorTotal;
                valorEmAberto = 0;
            } else if (pagouInicial) {
                valorPago = valor50;
                valorEmAberto = valor50;
                parcelaPendente = {
                    tipo: 'pagamento_final',
                    descricao: '2.ª Prestação — 50% Restantes',
                    valor: valor50,
                    prazo: (() => {
                        const checkin = new Date(reserva.data_check_in);
                        checkin.setDate(checkin.getDate() - 10);
                        return checkin.toLocaleDateString('pt-PT');
                    })()
                };
            } else {
                valorPago = 0;
                valorEmAberto = valor50;
                parcelaPendente = {
                    tipo: 'pagamento_inicial',
                    descricao: '1.ª Prestação — 50% Iniciais',
                    valor: valor50,
                    prazo: (() => {
                        const criado = new Date(reserva.criado_em);
                        criado.setHours(criado.getHours() + 48);
                        return criado.toLocaleDateString('pt-PT', { hour: '2-digit', minute: '2-digit' });
                    })()
                };
            }

            return res.json({
                status: 'success',
                data: {
                    reserva: {
                        id: reserva.id,
                        status: reserva.status,
                        data_check_in: reserva.data_check_in,
                        data_check_out: reserva.data_check_out,
                        valor_total: valorTotal,
                        quarto: reserva.Quarto,
                        criado_em: reserva.criado_em,
                        pagamento_inicial_em: reserva.pagamento_inicial_em,
                        pagamento_total_em: reserva.pagamento_total_em,
                    },
                    resumo: {
                        valor_total: valorTotal,
                        valor_pago: valorPago,
                        valor_em_aberto: valorEmAberto,
                        pagou_inicial: pagouInicial,
                        pagou_total: pagouTotal,
                    },
                    parcela_pendente: parcelaPendente,
                }
            });
        } catch (e) {
            console.error('❌ getDetalhesPagamento:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    /**
     * POST /api/pagamentos/checkout
     * Cria sessão Stripe para pagamento (50% inicial ou 50% final)
     */
    static async criarCheckout(req, res) {
        try {
            const { reservaId, tipo } = req.body; // tipo: 'inicial' | 'final'
            const hospedeId = req.usuarioId;

            const { data: reserva, error } = await supabase.supabaseAdmin
                .from('Reserva')
                .select('*, Hospede(*), Quarto(*)')
                .eq('id', reservaId)
                .eq('hospede_id', hospedeId)
                .single();

            if (error || !reserva) {
                return res.status(404).json({ error: 'Reserva não encontrada' });
            }

            if (reserva.status === 'CANCELADA') {
                return res.status(400).json({ error: 'Esta reserva foi cancelada.' });
            }

            const valorTotal = Number(reserva.valor_total);
            const valor50 = valorTotal * 0.5;

            let amountCents, descricao, metadata;

            if (tipo === 'final') {
                if (!reserva.pagamento_inicial_em) {
                    return res.status(400).json({ error: 'É necessário pagar a 1.ª prestação primeiro.' });
                }
                if (reserva.pagamento_total_em) {
                    return res.status(400).json({ error: 'Esta reserva já está totalmente paga.' });
                }
                amountCents = Math.round(valor50 * 100);
                descricao = `Refúgio Carapita — 2.ª Prestação (50% final) | Check-in: ${reserva.data_check_in?.split('T')[0]}`;
                metadata = { reservaId, tipo: 'final', hospedeId };
            } else {
                // Pagamento inicial
                if (reserva.pagamento_inicial_em) {
                    return res.status(400).json({ error: 'O pagamento inicial já foi efetuado.' });
                }
                amountCents = Math.round(valor50 * 100);
                descricao = `Refúgio Carapita — 1.ª Prestação (50% inicial) | Check-in: ${reserva.data_check_in?.split('T')[0]}`;
                metadata = { reservaId, tipo: 'inicial', hospedeId };
            }

            if (!amountCents || amountCents <= 0) {
                return res.status(400).json({ error: 'Valor inválido.' });
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card', 'multibanco', 'mb_way'],
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Refúgio Carapita — ${tipo === 'final' ? '2.ª Prestação' : '1.ª Prestação'}`,
                            description: descricao,
                        },
                        unit_amount: amountCents,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${frontendUrl}/perfil?tab=pagamentos&pagamento=sucesso&reserva=${reservaId}`,
                cancel_url: `${frontendUrl}/perfil?tab=pagamentos&pagamento=cancelado&reserva=${reservaId}`,
                client_reference_id: reservaId,
                metadata,
                customer_email: reserva.Hospede?.email,
            });

            return res.json({ status: 'success', sessionId: session.id, url: session.url });
        } catch (e) {
            console.error('❌ criarCheckout:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    /**
     * POST /api/pagamentos/webhook
     * Webhook do Stripe — confirma pagamentos
     * Usar raw body (express.raw) nesta rota
     */
    static async webhookStripe(req, res) {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;
        try {
            if (endpointSecret) {
                event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
            } else {
                // Desenvolvimento sem secret configurado
                event = req.body;
                if (typeof event === 'string') event = JSON.parse(event);
            }
        } catch (err) {
            console.error('❌ Webhook signature inválida:', err.message);
            return res.status(400).json({ error: `Webhook Error: ${err.message}` });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const metadata = session.metadata || {};
            const { reservaId, tipo } = metadata;

            if (!reservaId) {
                return res.json({ received: true });
            }

            try {
                const agora = new Date().toISOString();

                if (tipo === 'inicial') {
                    // Registar pagamento inicial e confirmar reserva
                    const { data: reserva, error } = await supabase.supabaseAdmin
                        .from('Reserva')
                        .update({
                            pagamento_inicial_em: agora,
                            status: 'CONFIRMADA',
                            atualizado_em: agora,
                        })
                        .eq('id', reservaId)
                        .select('*, Hospede(*), Quarto(*)')
                        .single();

                    if (!error && reserva) {
                        const hospede = reserva.Hospede;
                        // Buscar roteiros
                        const { data: roteiros } = await supabase.supabaseAdmin
                            .from('Passeio').select('*').eq('ativo', true).limit(3);

                        if (hospede) {
                            await EmailService.enviarEmailBoasVindasPagamentoInicial(hospede, reserva, roteiros || []);
                        }
                        console.log(`✅ Pagamento inicial confirmado para reserva ${reservaId}`);
                    }
                } else if (tipo === 'final') {
                    // Registar pagamento final
                    const { data: reserva, error } = await supabase.supabaseAdmin
                        .from('Reserva')
                        .update({
                            pagamento_total_em: agora,
                            atualizado_em: agora,
                        })
                        .eq('id', reservaId)
                        .select('*, Hospede(*), Quarto(*)')
                        .single();

                    if (!error && reserva) {
                        const hospede = reserva.Hospede;
                        const { data: roteiros } = await supabase.supabaseAdmin
                            .from('Passeio').select('*').eq('ativo', true).limit(3);

                        if (hospede) {
                            await EmailService.enviarEmailReservaTotalmentePaga(hospede, reserva, roteiros || []);
                        }
                        console.log(`✅ Pagamento final confirmado para reserva ${reservaId}`);
                    }
                }
            } catch (processingError) {
                console.error('❌ Erro ao processar webhook:', processingError.message);
                // Retornar 200 para o Stripe não retentar
            }
        }

        return res.json({ received: true });
    }

    /**
     * GET /api/pagamentos/fatura/:reservaId
     * Gera dados para fatura/recibo PDF no frontend
     */
    static async getFatura(req, res) {
        try {
            const { reservaId } = req.params;
            const hospedeId = req.usuarioId;

            const { data: reserva, error } = await supabase.supabaseAdmin
                .from('Reserva')
                .select('*, Quarto(*), Hospede(*)')
                .eq('id', reservaId)
                .eq('hospede_id', hospedeId)
                .single();

            if (error || !reserva) {
                return res.status(404).json({ error: 'Reserva não encontrada' });
            }

            const hospede = reserva.Hospede;
            const valorTotal = Number(reserva.valor_total);
            const valor50Inicial = valorTotal * 0.5;

            const fatura = {
                numero: `RC-${reserva.id.substring(0, 8).toUpperCase()}`,
                data_emissao: new Date().toLocaleDateString('pt-PT'),
                // Emitente
                emitente: {
                    nome: 'Refúgio Carapita',
                    nif: 'NIF: 260876640',
                    morada: 'R. Dom Afonso Quarto Conde de Ourém IV 450, 2490-480 Ourém',
                    email: 'reservas@refugiocarapita.com',
                    telefone: '+351 920 003 608',
                },
                // Cliente
                cliente: {
                    nome: `${hospede?.nome || ''} ${hospede?.sobrenome || ''}`.trim(),
                    email: hospede?.email || '',
                    telefone: hospede?.telefone || '',
                    morada: [hospede?.endereco1, hospede?.cidade, hospede?.pais].filter(Boolean).join(', '),
                    nif: hospede?.numero_documento || '',
                },
                // Reserva
                reserva: {
                    id: reserva.id,
                    quarto: reserva.Quarto?.nome || 'Alojamento',
                    check_in: new Date(reserva.data_check_in).toLocaleDateString('pt-PT'),
                    check_out: new Date(reserva.data_check_out).toLocaleDateString('pt-PT'),
                    noites: Math.ceil((new Date(reserva.data_check_out) - new Date(reserva.data_check_in)) / (1000 * 60 * 60 * 24)),
                },
                // Valores
                financeiro: {
                    valor_total: valorTotal,
                    valor_inicial_pago: reserva.pagamento_inicial_em ? valor50Inicial : 0,
                    valor_final_pago: reserva.pagamento_total_em ? valor50Inicial : 0,
                    total_pago: (reserva.pagamento_inicial_em ? valor50Inicial : 0) + (reserva.pagamento_total_em ? valor50Inicial : 0),
                    saldo_devedor: valorTotal - ((reserva.pagamento_inicial_em ? valor50Inicial : 0) + (reserva.pagamento_total_em ? valor50Inicial : 0)),
                    pagamento_inicial_em: reserva.pagamento_inicial_em ? new Date(reserva.pagamento_inicial_em).toLocaleDateString('pt-PT') : null,
                    pagamento_total_em: reserva.pagamento_total_em ? new Date(reserva.pagamento_total_em).toLocaleDateString('pt-PT') : null,
                }
            };

            return res.json({ status: 'success', data: fatura });
        } catch (e) {
            console.error('❌ getFatura:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    /**
     * POST /api/pagamentos/confirmar-manual/:reservaId
     * Admin: confirmar pagamento manualmente (ex: transferência bancária)
     */
    static async confirmarPagamentoManual(req, res) {
        try {
            const { reservaId } = req.params;
            const { tipo } = req.body; // 'inicial' | 'final'

            const agora = new Date().toISOString();
            let updateData = { atualizado_em: agora };

            if (tipo === 'inicial') {
                updateData.pagamento_inicial_em = agora;
                updateData.status = 'CONFIRMADA';
            } else if (tipo === 'final') {
                updateData.pagamento_total_em = agora;
            } else {
                return res.status(400).json({ error: 'Tipo inválido. Use "inicial" ou "final".' });
            }

            const { data: reserva, error } = await supabase.supabaseAdmin
                .from('Reserva')
                .update(updateData)
                .eq('id', reservaId)
                .select('*, Hospede(*), Quarto(*)')
                .single();

            if (error || !reserva) {
                return res.status(404).json({ error: 'Reserva não encontrada: ' + (error?.message || '') });
            }

            const hospede = reserva.Hospede;
            const { data: roteiros } = await supabase.supabaseAdmin
                .from('Passeio').select('*').eq('ativo', true).limit(3);

            if (hospede) {
                if (tipo === 'inicial') {
                    EmailService.enviarEmailBoasVindasPagamentoInicial(hospede, reserva, roteiros || []).catch(e => console.error('Erro email boas-vindas:', e.message));
                } else {
                    EmailService.enviarEmailReservaTotalmentePaga(hospede, reserva, roteiros || []).catch(e => console.error('Erro email 100% pago:', e.message));
                }
            }

            return res.json({ status: 'success', message: `Pagamento ${tipo} confirmado manualmente.`, data: reserva });
        } catch (e) {
            console.error('❌ confirmarPagamentoManual:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }
}

module.exports = PagamentosController;

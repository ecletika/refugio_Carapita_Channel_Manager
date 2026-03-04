/**
 * SchedulerService — Automatização de Emails e Cancelamentos
 *
 * Ciclo: corre a cada 15 minutos para verificar reservas pendentes.
 *
 * Estados da Reserva:
 *   PENDENTE     → Aguarda pagamento inicial (50%)
 *   CONFIRMADA   → Pagamento inicial recebido, aguarda pagamento final (50%)
 *   CANCELADA    → Cancelada automaticamente ou manualmente
 *   CHECK_IN     → Hóspede fez check-in
 *   CHECK_OUT    → Estadia terminada
 *
 * Campos usados em `Reserva`:
 *   criado_em                   → data/hora da criação da reserva
 *   pagamento_inicial_em        → data/hora do pagamento dos 50% iniciais
 *   pagamento_total_em          → data/hora do pagamento dos 100% (pagamento final)
 *   email_lembrete_24h_enviado  → boolean
 *   email_lembrete_36h_enviado  → boolean
 *   email_lembrete_40h_enviado  → boolean
 *   email_lembrete_47h_enviado  → boolean
 *   email_boasvindas_enviado    → boolean
 *   proxima_mensagem_mensal_em  → próxima data para enviar email mensal
 *   emails_pagamento_final_enviados → array JSONB de dias (ex: [30, 20, 15])
 */

const supabase = require('../config/supabase');
const EmailService = require('./email.service');

class SchedulerService {

    static async executar() {
        try {
            await Promise.all([
                this._verificarPagamentosIniciais(),
                this._verificarEmailsMensais(),
                this._verificarPagamentosFinais(),
            ]);
        } catch (e) {
            console.error('❌ SchedulerService erro geral:', e.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BLOCO 1 — Reservas PENDENTES (aguardam 50% inicial)
    // ═══════════════════════════════════════════════════════════════════════════

    static async _verificarPagamentosIniciais() {
        try {
            const { data: reservasPendentes, error } = await supabase.supabaseAdmin
                .from('Reserva')
                .select('*, Hospede(*), Quarto(*)')
                .eq('status', 'PENDENTE')
                .is('pagamento_inicial_em', null);

            if (error || !reservasPendentes?.length) return;

            const agora = new Date();

            for (const reserva of reservasPendentes) {
                const hospede = reserva.Hospede;
                if (!hospede?.email) continue;

                const criadoEm = new Date(reserva.criado_em);
                const horasPassadas = (agora - criadoEm) / (1000 * 60 * 60);

                // 48h+ sem pagamento → CANCELAR
                if (horasPassadas >= 48) {
                    await this._cancelarReservaPorFaltaPagamentoInicial(reserva, hospede);
                    continue;
                }

                // 47h — email urgência máxima
                if (horasPassadas >= 47 && !reserva.email_lembrete_47h_enviado) {
                    await EmailService.enviarLembretePagamento47h(hospede, reserva);
                    await supabase.supabaseAdmin.from('Reserva').update({ email_lembrete_47h_enviado: true }).eq('id', reserva.id);
                    continue;
                }

                // 40h — email urgência
                if (horasPassadas >= 40 && !reserva.email_lembrete_40h_enviado) {
                    await EmailService.enviarLembretePagamento40h(hospede, reserva);
                    await supabase.supabaseAdmin.from('Reserva').update({ email_lembrete_40h_enviado: true }).eq('id', reserva.id);
                    continue;
                }

                // 36h — email moderado urgência
                if (horasPassadas >= 36 && !reserva.email_lembrete_36h_enviado) {
                    await EmailService.enviarLembretePagamento36h(hospede, reserva);
                    await supabase.supabaseAdmin.from('Reserva').update({ email_lembrete_36h_enviado: true }).eq('id', reserva.id);
                    continue;
                }

                // 24h — primeiro lembrete
                if (horasPassadas >= 24 && !reserva.email_lembrete_24h_enviado) {
                    await EmailService.enviarLembretePagamento24h(hospede, reserva);
                    await supabase.supabaseAdmin.from('Reserva').update({ email_lembrete_24h_enviado: true }).eq('id', reserva.id);
                }
            }
        } catch (e) {
            console.error('❌ _verificarPagamentosIniciais:', e.message);
        }
    }

    static async _cancelarReservaPorFaltaPagamentoInicial(reserva, hospede) {
        try {
            const { error } = await supabase.supabaseAdmin
                .from('Reserva')
                .update({ status: 'CANCELADA', atualizado_em: new Date().toISOString() })
                .eq('id', reserva.id);

            if (error) {
                console.error('❌ Erro ao cancelar reserva:', error.message);
                return;
            }

            console.log(`🚫 Reserva ${reserva.id} cancelada por falta de pagamento inicial (48h expiradas)`);
            await EmailService.enviarEmailCancelamentoPagamentoInicial(hospede, reserva);
        } catch (e) {
            console.error('❌ _cancelarReservaPorFaltaPagamentoInicial:', e.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BLOCO 2 — Reservas CONFIRMADAS (50% pago) — Emails mensais
    // ═══════════════════════════════════════════════════════════════════════════

    static async _verificarEmailsMensais() {
        try {
            const agora = new Date();

            // Buscar reservas confirmadas com pagamento inicial registado mas check-in futuro
            const { data: reservas, error } = await supabase.supabaseAdmin
                .from('Reserva')
                .select('*, Hospede(*), Quarto(*)')
                .eq('status', 'CONFIRMADA')
                .not('pagamento_inicial_em', 'is', null)
                .is('pagamento_total_em', null) // ainda não pagou o total
                .gt('data_check_in', agora.toISOString());

            if (error || !reservas?.length) return;

            // Buscar roteiros ativos
            const { data: roteiros } = await supabase.supabaseAdmin
                .from('Passeio')
                .select('*')
                .eq('ativo', true)
                .limit(5);

            for (const reserva of reservas) {
                const hospede = reserva.Hospede;
                if (!hospede?.email) continue;

                // Verificar se deve enviar email mensal
                const proximaMensagem = reserva.proxima_mensagem_mensal_em
                    ? new Date(reserva.proxima_mensagem_mensal_em)
                    : null;

                const deveEnviar = !reserva.email_boasvindas_enviado ||
                    (proximaMensagem && agora >= proximaMensagem);

                if (deveEnviar) {
                    if (!reserva.email_boasvindas_enviado) {
                        await EmailService.enviarEmailBoasVindasPagamentoInicial(hospede, reserva, roteiros || []);
                    } else {
                        await EmailService.enviarEmailMensalAguardando(hospede, reserva, roteiros || []);
                    }

                    // Calcular próxima mensagem (30 dias)
                    const proxima = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);
                    await supabase.supabaseAdmin
                        .from('Reserva')
                        .update({
                            email_boasvindas_enviado: true,
                            proxima_mensagem_mensal_em: proxima.toISOString()
                        })
                        .eq('id', reserva.id);
                }
            }
        } catch (e) {
            console.error('❌ _verificarEmailsMensais:', e.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BLOCO 3 — Pagamento Final (os 50% restantes)
    // ═══════════════════════════════════════════════════════════════════════════

    static async _verificarPagamentosFinais() {
        try {
            const agora = new Date();
            const em35Dias = new Date(agora.getTime() + 35 * 24 * 60 * 60 * 1000);

            // Reservas confirmadas com pagamento inicial mas sem pagamento final, com check-in nos próximos 35 dias
            const { data: reservas, error } = await supabase.supabaseAdmin
                .from('Reserva')
                .select('*, Hospede(*), Quarto(*)')
                .eq('status', 'CONFIRMADA')
                .not('pagamento_inicial_em', 'is', null)
                .is('pagamento_total_em', null)
                .lte('data_check_in', em35Dias.toISOString())
                .gt('data_check_in', agora.toISOString());

            if (error || !reservas?.length) return;

            // Buscar roteiros
            const { data: roteiros } = await supabase.supabaseAdmin
                .from('Passeio')
                .select('*')
                .eq('ativo', true)
                .limit(3);

            for (const reserva of reservas) {
                const hospede = reserva.Hospede;
                if (!hospede?.email) continue;

                const checkIn = new Date(reserva.data_check_in);
                const diasAntes = Math.ceil((checkIn - agora) / (1000 * 60 * 60 * 24));

                // 10 dias ou menos sem pagar → CANCELAR
                if (diasAntes <= 10) {
                    // Enviar email de urgência máxima antes de cancelar (se ainda não enviou o de 10 dias)
                    const emailsEnviados = reserva.emails_pagamento_final_enviados || [];
                    if (!emailsEnviados.includes(10)) {
                        await EmailService.enviarLembretePagamentoFinal(hospede, reserva, 10, roteiros || []);
                        await supabase.supabaseAdmin
                            .from('Reserva')
                            .update({ emails_pagamento_final_enviados: [...emailsEnviados, 10] })
                            .eq('id', reserva.id);

                        // Dar mais algumas horas de graça antes de cancelar definitivamente
                        // Cancela se são 10 dias exatos E já passou 24h desde o email de 10 dias
                        // Para simplificação: cancela logo nos 9 dias e fracção
                    }

                    if (diasAntes < 10) {
                        await this._cancelarReservaPorFaltaPagamentoFinal(reserva, hospede);
                    }
                    continue;
                }

                // Verificar quais emails da sequência precisam ser enviados
                const emailsEnviados = reserva.emails_pagamento_final_enviados || [];
                const sequencia = [30, 20, 15, 14, 13, 12, 11, 10];
                const diasParaEnviar = sequencia.filter(d => diasAntes <= d && !emailsEnviados.includes(d));

                if (diasParaEnviar.length > 0) {
                    const diaTarget = diasParaEnviar[0]; // O mais urgente
                    await EmailService.enviarLembretePagamentoFinal(hospede, reserva, diaTarget, roteiros || []);
                    await supabase.supabaseAdmin
                        .from('Reserva')
                        .update({ emails_pagamento_final_enviados: [...emailsEnviados, diaTarget] })
                        .eq('id', reserva.id);
                }

                // Se são exatamente 30 dias E o total está pago → email de 100% confirmado
                if (diasAntes <= 30 && reserva.pagamento_total_em) {
                    const emailsEnviados = reserva.emails_pagamento_final_enviados || [];
                    if (!emailsEnviados.includes('total_confirmado')) {
                        await EmailService.enviarEmailReservaTotalmentePaga(hospede, reserva, roteiros || []);
                        await supabase.supabaseAdmin
                            .from('Reserva')
                            .update({ emails_pagamento_final_enviados: [...emailsEnviados, 'total_confirmado'] })
                            .eq('id', reserva.id);
                    }
                }
            }

            // Verificar reservas 100% pagas a 1 mês do check-in
            await this._verificarReservas100Pagas();

        } catch (e) {
            console.error('❌ _verificarPagamentosFinais:', e.message);
        }
    }

    static async _verificarReservas100Pagas() {
        try {
            const agora = new Date();
            const em32Dias = new Date(agora.getTime() + 32 * 24 * 60 * 60 * 1000);
            const em28Dias = new Date(agora.getTime() + 28 * 24 * 60 * 60 * 1000);

            const { data: reservas } = await supabase.supabaseAdmin
                .from('Reserva')
                .select('*, Hospede(*), Quarto(*)')
                .eq('status', 'CONFIRMADA')
                .not('pagamento_total_em', 'is', null)
                .gte('data_check_in', em28Dias.toISOString())
                .lte('data_check_in', em32Dias.toISOString());

            if (!reservas?.length) return;

            const { data: roteiros } = await supabase.supabaseAdmin
                .from('Passeio').select('*').eq('ativo', true).limit(3);

            for (const reserva of reservas) {
                const hospede = reserva.Hospede;
                if (!hospede?.email) continue;

                const emailsEnviados = reserva.emails_pagamento_final_enviados || [];
                if (!emailsEnviados.includes('total_confirmado')) {
                    await EmailService.enviarEmailReservaTotalmentePaga(hospede, reserva, roteiros || []);
                    await supabase.supabaseAdmin
                        .from('Reserva')
                        .update({ emails_pagamento_final_enviados: [...emailsEnviados, 'total_confirmado'] })
                        .eq('id', reserva.id);
                }
            }
        } catch (e) {
            console.error('❌ _verificarReservas100Pagas:', e.message);
        }
    }

    static async _cancelarReservaPorFaltaPagamentoFinal(reserva, hospede) {
        try {
            const { error } = await supabase.supabaseAdmin
                .from('Reserva')
                .update({ status: 'CANCELADA', atualizado_em: new Date().toISOString() })
                .eq('id', reserva.id);

            if (error) {
                console.error('❌ Erro ao cancelar reserva (final):', error.message);
                return;
            }

            console.log(`🚫 Reserva ${reserva.id} cancelada por falta de pagamento final (10 dias expirados)`);
            await EmailService.enviarEmailCancelamentoPagamentoFinal(hospede, reserva);
        } catch (e) {
            console.error('❌ _cancelarReservaPorFaltaPagamentoFinal:', e.message);
        }
    }
}

module.exports = SchedulerService;

const nodemailer = require('nodemailer');

class EmailService {
    static transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || "",
            pass: process.env.EMAIL_PASS || ""
        }
    });

    // ─── Helpers ──────────────────────────────────────────────────────────────

    static _baseStyle = `
        font-family: 'Georgia', serif; color: #1E3932;
        max-width: 620px; margin: auto;
        border: 1px solid #D4C5A9; background: #FAF8F4;
    `;

    static _header = (subtitle = '') => `
        <div style="background:#1E3932; padding: 28px 40px; text-align:center;">
            <h1 style="margin:0; color:#C4A484; font-size:22px; letter-spacing:6px; font-weight:400; text-transform:uppercase;">Refúgio Carapita</h1>
            ${subtitle ? `<p style="margin:6px 0 0; color:rgba(255,255,255,0.6); font-size:11px; letter-spacing:3px; text-transform:uppercase;">${subtitle}</p>` : ''}
        </div>
    `;

    static _footer = () => `
        <div style="padding:24px 40px; background:#1E3932; text-align:center; margin-top:0;">
            <p style="margin:0; color:rgba(255,255,255,0.5); font-size:10px; letter-spacing:2px; text-transform:uppercase;">
                ⚠️ O Refúgio Carapita <strong style="color:#C4A484;">não envia dados de pagamento por email</strong> nem por links externos.<br>
                Para pagamentos, aceda à sua área reservada em <a href="https://refugiocarapita.com/perfil" style="color:#C4A484;">refugiocarapita.com/perfil</a>
            </p>
        </div>
    `;

    static _reservaBox = (reserva) => `
        <div style="background:#fff; border:1px solid #E8E0D5; padding:20px 24px; margin:20px 0; border-radius:2px;">
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;">
                <tr><td style="color:#888; width:40%; text-transform:uppercase; letter-spacing:1px; font-size:11px;">Alojamento</td><td style="color:#1E3932; font-weight:bold;">${reserva.Quarto?.nome || reserva.quarto?.nome || 'Alojamento Selecionado'}</td></tr>
                <tr><td style="color:#888; text-transform:uppercase; letter-spacing:1px; font-size:11px;">Check-in</td><td style="color:#1E3932; font-weight:bold;">${new Date(reserva.data_check_in).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                <tr><td style="color:#888; text-transform:uppercase; letter-spacing:1px; font-size:11px;">Check-out</td><td style="color:#1E3932; font-weight:bold;">${new Date(reserva.data_check_out).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                <tr><td style="color:#888; text-transform:uppercase; letter-spacing:1px; font-size:11px;">Valor Total</td><td style="color:#1E3932; font-weight:bold; font-size:16px;">€${Number(reserva.valor_total).toFixed(2)}</td></tr>
                <tr><td style="color:#888; text-transform:uppercase; letter-spacing:1px; font-size:11px;">Código Reserva</td><td style="color:#888; font-size:11px;">${reserva.id?.substring(0, 8).toUpperCase() || ''}</td></tr>
            </table>
        </div>
    `;

    static _ctaButton = (text, url) => `
        <div style="text-align:center; margin:28px 0;">
            <a href="${url}" style="
                display:inline-block; background:#1E3932; color:#C4A484;
                text-decoration:none; padding:14px 40px;
                font-size:11px; letter-spacing:3px; text-transform:uppercase;
                border:1px solid #C4A484; font-family:sans-serif;
            ">${text}</a>
        </div>
    `;

    static _pagamentosUrl = (reservaId) =>
        `https://refugiocarapita.com/perfil?tab=pagamentos&reserva=${reservaId}`;

    // ─── 1. Email de Confirmação de Reserva (após submissão no site) ──────────

    static async enviarEmailConfirmacaoReserva(hospede, reserva) {
        try {
            const valor50 = (Number(reserva.valor_total) * 0.5).toFixed(2);
            const mailOptions = {
                from: '"Refúgio Carapita" <reservas@refugiocarapita.com>',
                to: hospede.email,
                subject: '🎉 A sua reserva foi encaminhada com sucesso! — Refúgio Carapita',
                html: `
                <div style="${this._baseStyle}">
                    ${this._header('Confirmação de Reserva')}
                    <div style="padding:32px 40px;">
                        <p style="font-size:15px; margin-top:0;">Olá, <strong>${hospede.nome}</strong>! 🎉</p>
                        <p style="color:#444; line-height:1.8;">A sua reserva foi encaminhada com sucesso para o <strong>Refúgio Carapita</strong>.</p>
                        ${this._reservaBox(reserva)}
                        <div style="background:#FFFBF0; border-left:3px solid #C4A484; padding:16px 20px; margin:24px 0; font-size:13px; line-height:1.9; color:#444;">
                            <p style="margin:0 0 8px;"><strong>📋 Próximos Passos — Pagamento:</strong></p>
                            <p style="margin:0;">Após a confirmação, será necessário efetuar o pagamento de <strong>50% do valor total (€${valor50})</strong> no prazo de <strong>48 horas</strong>.</p>
                            <p style="margin:8px 0 0;">Os restantes 50% deverão ser pagos até <strong>10 dias antes da data de check-in</strong>.</p>
                        </div>
                        ${this._ctaButton('Aceder à Área de Pagamentos', this._pagamentosUrl(reserva.id))}
                        <p style="font-size:12px; color:#999; text-align:center; margin-top:8px;">
                            ⚠️ O Refúgio Carapita não envia dados de pagamento por email nem por links.<br>
                            Para efetuar o pagamento, aceda à sua área reservada no site, secção <strong>Pagamentos</strong>.
                        </p>
                    </div>
                    ${this._footer()}
                </div>`
            };
            await this.transporter.sendMail(mailOptions);
            console.log(`📧 Email confirmação reserva → ${hospede.email}`);
        } catch (error) {
            console.error('❌ Erro email confirmação reserva:', error.message);
        }
    }

    // Manter compatibilidade com código antigo
    static async enviarEmailProcessamento(hospede, reserva) {
        return this.enviarEmailConfirmacaoReserva(hospede, reserva);
    }

    static async enviarEmailConfirmacao(hospede, reserva) {
        return this.enviarEmailConfirmacaoReserva(hospede, reserva);
    }

    // ─── 2. Sequência de Lembretes de Pagamento Inicial (50%) ────────────────

    static async enviarLembretePagamento24h(hospede, reserva) {
        try {
            const valor50 = (Number(reserva.valor_total) * 0.5).toFixed(2);
            await this.transporter.sendMail({
                from: '"Refúgio Carapita" <reservas@refugiocarapita.com>',
                to: hospede.email,
                subject: '⏰ Garanta a sua reserva! — Refúgio Carapita',
                html: `<div style="${this._baseStyle}">
                    ${this._header('Lembrete de Pagamento')}
                    <div style="padding:32px 40px;">
                        <p style="font-size:15px; margin-top:0;">Olá, <strong>${hospede.nome}</strong>!</p>
                        <p style="color:#444; line-height:1.8;">Lembramos que a sua reserva no <strong>Refúgio Carapita</strong> aguarda o pagamento inicial de <strong>50% (€${valor50})</strong> para ser confirmada.</p>
                        ${this._reservaBox(reserva)}
                        <p style="color:#666; font-size:13px; line-height:1.8;">Ainda tem <strong>24 horas</strong> para efetuar o pagamento. Não perca a sua reserva! ✨</p>
                        ${this._ctaButton('Efetuar Pagamento Agora', this._pagamentosUrl(reserva.id))}
                    </div>
                    ${this._footer()}
                </div>`
            });
            console.log(`📧 Lembrete 24h → ${hospede.email}`);
        } catch (e) { console.error('❌ Erro lembrete 24h:', e.message); }
    }

    static async enviarLembretePagamento36h(hospede, reserva) {
        try {
            const valor50 = (Number(reserva.valor_total) * 0.5).toFixed(2);
            await this.transporter.sendMail({
                from: '"Refúgio Carapita" <reservas@refugiocarapita.com>',
                to: hospede.email,
                subject: '⚡ Falta pouco! Garanta a sua reserva agora mesmo — Refúgio Carapita',
                html: `<div style="${this._baseStyle}">
                    ${this._header('Urgente — Reserva a Expirar')}
                    <div style="padding:32px 40px;">
                        <p style="font-size:15px; margin-top:0;">Olá, <strong>${hospede.nome}</strong>!</p>
                        <p style="color:#444; line-height:1.8;">A sua reserva ainda não foi confirmada. Faltam apenas <strong>12 horas</strong> para o prazo de pagamento inicial (€${valor50}).</p>
                        ${this._reservaBox(reserva)}
                        <div style="background:#FFF3CD; border:1px solid #FFEAA7; padding:14px 18px; margin:16px 0; border-radius:2px; font-size:13px; color:#856404;">
                            ⚠️ Após o prazo de 48 horas sem pagamento, a reserva será cancelada automaticamente.
                        </div>
                        ${this._ctaButton('Confirmar e Pagar Agora', this._pagamentosUrl(reserva.id))}
                    </div>
                    ${this._footer()}
                </div>`
            });
            console.log(`📧 Lembrete 36h → ${hospede.email}`);
        } catch (e) { console.error('❌ Erro lembrete 36h:', e.message); }
    }

    static async enviarLembretePagamento40h(hospede, reserva) {
        try {
            const valor50 = (Number(reserva.valor_total) * 0.5).toFixed(2);
            await this.transporter.sendMail({
                from: '"Refúgio Carapita" <reservas@refugiocarapita.com>',
                to: hospede.email,
                subject: '🚨 A sua reserva está quase a expirar — garanta já! — Refúgio Carapita',
                html: `<div style="${this._baseStyle}">
                    ${this._header('Última Hora — Reserva em Risco')}
                    <div style="padding:32px 40px;">
                        <p style="font-size:15px; margin-top:0;">Olá, <strong>${hospede.nome}</strong>!</p>
                        <p style="color:#c0392b; font-weight:bold; font-size:14px;">A sua reserva está quase a expirar — apenas <strong>8 horas</strong> restantes!</p>
                        <p style="color:#444; line-height:1.8;">Para guardar as suas datas, efetue agora o pagamento de 50% do valor total (€${valor50}).</p>
                        ${this._reservaBox(reserva)}
                        ${this._ctaButton('🔒 Garantir a Minha Reserva', this._pagamentosUrl(reserva.id))}
                    </div>
                    ${this._footer()}
                </div>`
            });
            console.log(`📧 Lembrete 40h → ${hospede.email}`);
        } catch (e) { console.error('❌ Erro lembrete 40h:', e.message); }
    }

    static async enviarLembretePagamento47h(hospede, reserva) {
        try {
            const valor50 = (Number(reserva.valor_total) * 0.5).toFixed(2);
            await this.transporter.sendMail({
                from: '"Refúgio Carapita" <reservas@refugiocarapita.com>',
                to: hospede.email,
                subject: '🔴 Última oportunidade — garanta a sua reserva AGORA — Refúgio Carapita',
                html: `<div style="${this._baseStyle}">
                    ${this._header('⏱ Última Oportunidade')}
                    <div style="padding:32px 40px;">
                        <p style="font-size:15px; margin-top:0;">Olá, <strong>${hospede.nome}</strong>!</p>
                        <p style="color:#c0392b; font-weight:bold; font-size:15px; border:2px solid #c0392b; padding:12px; text-align:center;">
                            ⏱ FALTA APENAS 1 HORA para a sua reserva ser cancelada automaticamente!
                        </p>
                        <p style="color:#444; line-height:1.8; margin-top:16px;">Efetue agora o pagamento de <strong>€${valor50}</strong> para garantir a sua estadia no Refúgio Carapita.</p>
                        ${this._reservaBox(reserva)}
                        ${this._ctaButton('🚀 Pagar Agora — Última Oportunidade', this._pagamentosUrl(reserva.id))}
                    </div>
                    ${this._footer()}
                </div>`
            });
            console.log(`📧 Lembrete 47h → ${hospede.email}`);
        } catch (e) { console.error('❌ Erro lembrete 47h:', e.message); }
    }

    // ─── 3. Cancelamento por falta de pagamento inicial ───────────────────────

    static async enviarEmailCancelamentoPagamentoInicial(hospede, reserva) {
        try {
            await this.transporter.sendMail({
                from: '"Refúgio Carapita" <reservas@refugiocarapita.com>',
                to: hospede.email,
                subject: 'A sua reserva foi cancelada — Refúgio Carapita',
                html: `<div style="${this._baseStyle}">
                    ${this._header('Reserva Cancelada')}
                    <div style="padding:32px 40px;">
                        <p style="font-size:15px; margin-top:0;">Olá, <strong>${hospede.nome}</strong>,</p>
                        <p style="color:#444; line-height:1.8;">Lamentamos informar que <strong>a sua reserva foi cancelada por falta do pagamento inicial</strong> no prazo de 48 horas.</p>
                        ${this._reservaBox(reserva)}
                        <div style="background:#FFF3CD; border:1px solid #FFEAA7; padding:14px 18px; margin:16px 0; font-size:13px; color:#856404;">
                            As datas voltaram a estar disponíveis para reserva. Caso queira voltar a reservar, pode fazê-lo no nosso site.
                        </div>
                        ${this._ctaButton('Fazer Nova Reserva', 'https://refugiocarapita.com')}
                        <p style="font-size:13px; color:#666; line-height:1.8; margin-top:16px;">
                            Se pensa que isto foi um erro ou necessita de apoio, entre em contacto conosco.
                        </p>
                    </div>
                    ${this._footer()}
                </div>`
            });
            console.log(`📧 Email cancelamento pag. inicial → ${hospede.email}`);
        } catch (e) { console.error('❌ Erro email cancelamento inicial:', e.message); }
    }

    // ─── 4. Boas-vindas pós-pagamento inicial (50% pago) ─────────────────────

    static async enviarEmailBoasVindasPagamentoInicial(hospede, reserva, roteiros = []) {
        try {
            const noitesAte = Math.ceil((new Date(reserva.data_check_in) - new Date()) / (1000 * 60 * 60 * 24));
            const roteirosHtml = roteiros.slice(0, 3).map(r => `
                <div style="border:1px solid #E8E0D5; padding:12px 16px; margin-bottom:10px; background:#fff;">
                    <strong style="color:#1E3932; font-size:13px;">📍 ${r.nome}</strong>
                    <p style="margin:4px 0 0; font-size:12px; color:#666;">${r.desc || r.descricao || ''}</p>
                </div>
            `).join('');

            await this.transporter.sendMail({
                from: '"Refúgio Carapita" <reservas@refugiocarapita.com>',
                to: hospede.email,
                subject: '🌿 Obrigado! A sua reserva está confirmada — Refúgio Carapita',
                html: `<div style="${this._baseStyle}">
                    ${this._header('Reserva Confirmada 🎉')}
                    <div style="padding:32px 40px;">
                        <p style="font-size:15px; margin-top:0;">Olá, <strong>${hospede.nome}</strong>! 🌿</p>
                        <p style="color:#444; line-height:1.8;">Obrigado por garantir a sua reserva no <strong>Refúgio Carapita</strong>! O seu pagamento inicial foi recebido com sucesso.</p>
                        ${this._reservaBox(reserva)}
                        ${noitesAte > 0 ? `<p style="color:#1E3932; font-size:15px; text-align:center; font-weight:bold;">🗓 Faltam <span style="color:#C4A484;">${noitesAte} dias</span> para a sua chegada!</p>` : ''}
                        ${roteirosHtml ? `
                        <div style="margin-top:24px;">
                            <h3 style="color:#1E3932; font-size:14px; letter-spacing:2px; text-transform:uppercase; border-bottom:1px solid #E8E0D5; padding-bottom:10px;">
                                🗺 Enquanto espera — Sugestões para a sua estadia em Ourém / Fátima
                            </h3>
                            ${roteirosHtml}
                        </div>` : ''}
                        ${this._ctaButton('Ver Todos os Roteiros', 'https://refugiocarapita.com/perfil?tab=roteiros')}
                    </div>
                    ${this._footer()}
                </div>`
            });
            console.log(`📧 Boas-vindas pós-pagamento → ${hospede.email}`);
        } catch (e) { console.error('❌ Erro email boas-vindas:', e.message); }
    }

    // ─── 5. Email mensal (enquanto aguarda check-in) ──────────────────────────

    static async enviarEmailMensalAguardando(hospede, reserva, roteiros = []) {
        return this.enviarEmailBoasVindasPagamentoInicial(hospede, reserva, roteiros);
    }

    // ─── 6. Serie de emails pagamento final (50% restantes) ──────────────────

    static _emailPagamentoFinal = async (hospede, reserva, diasAntes, roteiros = [], isUrgente = false) => {
        try {
            const valorRestante = (Number(reserva.valor_total) * 0.5).toFixed(2);
            const roteirosHtml = roteiros.slice(0, 2).map(r => `
                <div style="border:1px solid #E8E0D5; padding:10px 14px; margin-bottom:8px; background:#fff; font-size:12px;">
                    <strong style="color:#1E3932;">📍 ${r.nome}</strong>
                    <p style="margin:3px 0 0; color:#666;">${(r.desc || r.descricao || '').substring(0, 100)}...</p>
                </div>
            `).join('');

            let urgencyLine = '';
            if (diasAntes <= 10) {
                urgencyLine = `<p style="color:#c0392b; font-weight:bold; font-size:14px; border:2px solid #c0392b; padding:10px; text-align:center;">
                    🚨 Estamos no limite do prazo — ${diasAntes} dias para o check-in!
                </p>`;
            } else if (diasAntes <= 13) {
                urgencyLine = `<p style="color:#c0392b; font-size:14px;">⚠️ Estamos a aproximar-nos do prazo limite. Faltam <strong>${diasAntes} dias</strong> para o check-in.</p>`;
            } else if (diasAntes <= 20) {
                urgencyLine = `<p style="color:#666; font-size:14px;">⏰ Faltam <strong>${diasAntes} dias</strong> para o check-in. Ainda temos tempo!</p>`;
            } else {
                urgencyLine = `<p style="color:#444; font-size:14px;">📅 Faltam <strong>${diasAntes} dias</strong> para a sua chegada ao Refúgio Carapita.</p>`;
            }

            const subjects = {
                30: '🏡 Não perca a sua reserva — ainda temos tempo! — Refúgio Carapita',
                20: '⏰ Não perca a sua reserva — efetue o pagamento restante — Refúgio Carapita',
                15: '⚠️ Estamos próximos do prazo limite — Refúgio Carapita',
                14: '⚠️ Prazo se aproxima — Efetue o pagamento restante — Refúgio Carapita',
                13: '⚠️ Prazo urgente — Garanta a sua estadia — Refúgio Carapita',
                12: '⚠️ Ainda podemos garantir a sua reserva — Refúgio Carapita',
                11: '⚠️ Urgente — Pagamento final pendente — Refúgio Carapita',
                10: '🔴 Último dia — Garanta já a sua reserva — Refúgio Carapita',
            };

            await EmailService.transporter.sendMail({
                from: '"Refúgio Carapita" <reservas@refugiocarapita.com>',
                to: hospede.email,
                subject: subjects[diasAntes] || `⚠️ Pagamento pendente — ${diasAntes} dias para check-in — Refúgio Carapita`,
                html: `<div style="${EmailService._baseStyle}">
                    ${EmailService._header('Pagamento Final Pendente')}
                    <div style="padding:32px 40px;">
                        <p style="font-size:15px; margin-top:0;">Olá, <strong>${hospede.nome}</strong>!</p>
                        ${urgencyLine}
                        <p style="color:#444; line-height:1.8;">O pagamento restante de <strong>€${valorRestante}</strong> (50% do total) ainda não foi registado. Efetue o pagamento e garanta a sua estadia!</p>
                        ${EmailService._reservaBox(reserva)}
                        ${roteirosHtml ? `
                        <div style="margin-top:16px;">
                            <h4 style="color:#1E3932; font-size:12px; letter-spacing:2px; text-transform:uppercase; margin-bottom:10px;">Enquanto aguarda — Sugestões de Ourém / Fátima</h4>
                            ${roteirosHtml}
                        </div>` : ''}
                        ${EmailService._ctaButton('Efetuar Pagamento Final', EmailService._pagamentosUrl(reserva.id))}
                    </div>
                    ${EmailService._footer()}
                </div>`
            });
            console.log(`📧 Email pagamento final (${diasAntes} dias) → ${hospede.email}`);
        } catch (e) { console.error(`❌ Erro email pag. final ${diasAntes}d:`, e.message); }
    };

    static async enviarLembretePagamentoFinal(hospede, reserva, diasAntes, roteiros = []) {
        return this._emailPagamentoFinal(hospede, reserva, diasAntes, roteiros);
    }

    // ─── 7. Reserva 100% paga (1 mês antes do check-in) ─────────────────────

    static async enviarEmailReservaTotalmentePaga(hospede, reserva, roteiros = []) {
        try {
            const roteirosHtml = roteiros.slice(0, 3).map(r => `
                <div style="border:1px solid #E8E0D5; padding:12px 16px; margin-bottom:10px; background:#fff;">
                    <strong style="color:#1E3932; font-size:13px;">📍 ${r.nome}</strong>
                    <p style="margin:4px 0 0; font-size:12px; color:#666;">${r.desc || r.descricao || ''}</p>
                </div>
            `).join('');

            await this.transporter.sendMail({
                from: '"Refúgio Carapita" <reservas@refugiocarapita.com>',
                to: hospede.email,
                subject: '🎊 A sua reserva está 100% confirmada! — Refúgio Carapita',
                html: `<div style="${this._baseStyle}">
                    ${this._header('Reserva 100% Confirmada 🎊')}
                    <div style="padding:32px 40px;">
                        <p style="font-size:15px; margin-top:0;">Olá, <strong>${hospede.nome}</strong>! 🎊</p>
                        <p style="color:#444; line-height:1.8; font-size:15px; text-align:center;">
                            <strong>A sua reserva está 100% confirmada!</strong><br>Estamos à sua espera no Refúgio Carapita. ✨
                        </p>
                        ${this._reservaBox(reserva)}
                        ${roteirosHtml ? `
                        <div style="margin-top:24px;">
                            <h3 style="color:#1E3932; font-size:14px; letter-spacing:2px; text-transform:uppercase; border-bottom:1px solid #E8E0D5; padding-bottom:10px;">
                                🗺 Conheça a região de Ourém / Fátima
                            </h3>
                            ${roteirosHtml}
                        </div>` : ''}
                        ${this._ctaButton('Ver Roteiros Completos', 'https://refugiocarapita.com/perfil?tab=roteiros')}
                    </div>
                    ${this._footer()}
                </div>`
            });
            console.log(`📧 Reserva 100% confirmada → ${hospede.email}`);
        } catch (e) { console.error('❌ Erro email 100% confirmada:', e.message); }
    }

    // ─── 8. Cancelamento por falta de pagamento final ─────────────────────────

    static async enviarEmailCancelamentoPagamentoFinal(hospede, reserva) {
        try {
            await this.transporter.sendMail({
                from: '"Refúgio Carapita" <reservas@refugiocarapita.com>',
                to: hospede.email,
                subject: 'A sua reserva foi cancelada por falta do pagamento final — Refúgio Carapita',
                html: `<div style="${this._baseStyle}">
                    ${this._header('Reserva Cancelada')}
                    <div style="padding:32px 40px;">
                        <p style="font-size:15px; margin-top:0;">Olá, <strong>${hospede.nome}</strong>,</p>
                        <p style="color:#444; line-height:1.8;">Lamentamos informar que <strong>a sua reserva foi cancelada por falta do pagamento final</strong> até 10 dias antes do check-in.</p>
                        ${this._reservaBox(reserva)}
                        <div style="background:#FFF3CD; border:1px solid #FFEAA7; padding:14px 18px; margin:16px 0; font-size:13px; color:#856404;">
                            As datas voltaram a estar disponíveis para reserva. Caso queira voltar a reservar, pode fazê-lo no nosso site.
                        </div>
                        ${this._ctaButton('Fazer Nova Reserva', 'https://refugiocarapita.com')}
                    </div>
                    ${this._footer()}
                </div>`
            });
            console.log(`📧 Email cancelamento pag. final → ${hospede.email}`);
        } catch (e) { console.error('❌ Erro email cancelamento final:', e.message); }
    }

    // ─── 9. Notificação de Nova Mensagem de Contato ─────────────────────────

    static async enviarEmailContato(emailSite, nome, emailRemetente, assunto, mensagem) {
        try {
            await this.transporter.sendMail({
                from: '"Refúgio Carapita (Site)" <reservas@refugiocarapita.com>',
                to: emailSite,
                replyTo: emailRemetente,
                subject: `Nova Mensagem: ${assunto} — Refúgio Carapita`,
                html: `<div style="${this._baseStyle}">
                    ${this._header('Novo Contato do Site')}
                    <div style="padding:32px 40px;">
                        <p style="font-size:15px; margin-top:0;">Recebeu uma nova mensagem do formulário de contato do site!</p>
                        <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px; margin:20px 0; border:1px solid #E8E0D5;">
                            <tr><td style="color:#888; width:30%; text-transform:uppercase; font-size:11px;">Nome</td><td style="color:#1E3932; font-weight:bold;">${nome}</td></tr>
                            <tr><td style="color:#888; text-transform:uppercase; font-size:11px;">Email</td><td style="color:#1E3932; font-weight:bold;"><a href="mailto:${emailRemetente}" style="color:#C4A484;">${emailRemetente}</a></td></tr>
                            <tr><td style="color:#888; text-transform:uppercase; font-size:11px;">Assunto</td><td style="color:#1E3932; font-weight:bold;">${assunto}</td></tr>
                        </table>
                        <h4 style="color:#1E3932; font-size:12px; letter-spacing:2px; text-transform:uppercase; margin-bottom:10px; border-bottom:1px solid #E8E0D5; padding-bottom:10px;">Mensagem</h4>
                        <p style="color:#444; line-height:1.6; white-space: pre-wrap;">${mensagem}</p>
                    </div>
                    ${this._footer()}
                </div>`
            });
            console.log(`📧 Email de contato notificado para admin → ${emailSite}`);
        } catch (e) { console.error('❌ Erro email contato info:', e.message); }
    }
}

module.exports = EmailService;

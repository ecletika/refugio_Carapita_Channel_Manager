const nodemailer = require('nodemailer');

class EmailService {
    static transporter = nodemailer.createTransport({
        // Configuração de teste / Mailtrap / Gmail
        // Para produção, o usuário deve configurar estas variáveis no .env
        host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
        port: process.env.EMAIL_PORT || 2525,
        auth: {
            user: process.env.EMAIL_USER || "000000000000",
            pass: process.env.EMAIL_PASS || "000000000000"
        }
    });

    /**
     * E-mail 1: Recebido pedido de reserva (PENDENTE)
     */
    static async enviarEmailProcessamento(hospede, reserva) {
        try {
            const mailOptions = {
                from: '"Refúgio Carapita" <no-reply@refugiocarapita.com>',
                to: hospede.email,
                subject: 'Estamos a processar o seu pedido de reserva - Refúgio Carapita',
                html: `
                    <div style="font-family: serif; color: #1E3932; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E5E7EB;">
                        <h1 style="border-bottom: 2px solid #C4A484; padding-bottom: 10px;">Olá, ${hospede.nome}!</h1>
                        <p>Agradecemos o seu interesse no <strong>Refúgio Carapita</strong>.</p>
                        <p>Recebemos o seu pedido de reserva para o período de:</p>
                        <div style="background-color: #F9F8F6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Check-in:</strong> ${new Date(reserva.data_check_in).toLocaleDateString('pt-PT')}</p>
                            <p><strong>Check-out:</strong> ${new Date(reserva.data_check_out).toLocaleDateString('pt-PT')}</p>
                            <p><strong>Valor Total:</strong> €${Number(reserva.valor_total).toFixed(2)}</p>
                            <p><strong>Método de Pagamento:</strong> ${reserva.metodo_pagamento || 'A definir'}</p>
                        </div>
                        <p>Neste momento, o nosso pessoal está a validar a sua solicitação. Receberá um novo e-mail assim que a reserva for confirmada.</p>
                        <p style="font-size: 12px; color: #6B7280; margin-top: 30px;">Refúgio Carapita - Aldeia Histórica</p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`📧 E-mail de processamento enviado para: ${hospede.email}`);
        } catch (error) {
            console.error('❌ Erro ao enviar e-mail de processamento:', error);
        }
    }

    /**
     * E-mail 2: Reserva confirmada (APROVADO)
     */
    static async enviarEmailConfirmacao(hospede, reserva) {
        try {
            const mailOptions = {
                from: '"Refúgio Carapita" <reservas@refugiocarapita.com>',
                to: hospede.email,
                subject: 'Boa notícia! A sua reserva foi aprovada com sucesso - Refúgio Carapita',
                html: `
                    <div style="font-family: serif; color: #1E3932; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #C4A484;">
                        <h1 style="color: #1E3932;">Reserva Confirmada!</h1>
                        <p>Olá, ${hospede.nome}. Temos o prazer de informar que a sua estadia no <strong>Refúgio Carapita</strong> foi aprovada e confirmada.</p>
                        <div style="background-color: #1E3932; color: white; padding: 20px; margin: 20px 0;">
                            <h2 style="margin-top: 0; color: #C4A484;">Detalhes da Reserva</h2>
                            <p><strong>Habitação:</strong> ${reserva.quarto?.nome || 'Alojamento Selecionado'}</p>
                            <p><strong>Check-in:</strong> ${new Date(reserva.data_check_in).toLocaleDateString('pt-PT')}</p>
                            <p><strong>Check-out:</strong> ${new Date(reserva.data_check_out).toLocaleDateString('pt-PT')}</p>
                        </div>
                        <p>Se escolheu Transferência Bancária, por favor envie o comprovativo para este e-mail se ainda não o fez.</p>
                        <p>Estamos ansiosos por recebê-lo!</p>
                        <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
                        <p style="font-size: 12px; font-style: italic;">"Onde a tranquilidade encontra a história."</p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`📧 E-mail de confirmação enviado para: ${hospede.email}`);
        } catch (error) {
            console.error('❌ Erro ao enviar e-mail de confirmação:', error);
        }
    }
}

module.exports = EmailService;

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
// Importante para não quebrar caso não exista
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key');

router.post('/checkout', async (req, res) => {
    try {
        const { reservaData } = req.body;
        let amount = Math.round(Number(reservaData.valor_total) * 100);
        if(!amount || amount <= 0) amount = 1000; 

        // Definindo a URL do frontend baseada ou em LOCAL ou PRODUCAO
        const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://refugiocarapita.com' : 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // 'paypal', 'mb_way' removidos por precisarem de setup especifico no dashboard da stripe para EUR
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Reserva Refúgio Carapita',
                            description: `Check-in: ${reservaData.data_check_in?.split('T')[0]} | Check-out: ${reservaData.data_check_out?.split('T')[0]}`,
                        },
                        unit_amount: amount, 
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${frontendUrl}?pagamento=sucesso&reserva_id=${reservaData.id}`,
            cancel_url: `${frontendUrl}?pagamento=cancelado&reserva_id=${reservaData.id}`,
            client_reference_id: reservaData.id,
        });

        res.json({ status: 'success', sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Erro Stripe Checkout:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

module.exports = router;

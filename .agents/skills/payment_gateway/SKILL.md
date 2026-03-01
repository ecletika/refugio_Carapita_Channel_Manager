---
name: payment_gateway
description: Financial transaction flows and payment gateway integrations
---

# Payment Integration Guide

## Checkout Flow
1. User confirms dates/room -> System creates a "Pending" booking.
2. Calculate total amount (Nights * Rate + Fees).
3. Generate a payment intent securely on the backend.
4. Direct user to checkout UI.

## Webhooks
- Only mark a booking as "Confirmed" via a verified backend webhook from the payment provider (e.g., Mercado Pago, Stripe).
- Never trust client-side confirmation for final reservation status.
- Implement idempotency to avoid processing the same payment webhook twice.

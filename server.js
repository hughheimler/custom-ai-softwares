const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount, clientName, projectTitle, paymentType } = req.body;

    // Convert CAD dollars to cents for Stripe
    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountInCents) || amountInCents < 100) {
      return res.status(400).json({ error: 'Minimum amount is CA$1.00' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Custom AI Software - ${paymentType || 'Deposit'}`,
              description: `Project: ${projectTitle || 'Custom Scope'} | Client: ${clientName || 'Valued Client'}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/?payment=success`,
      cancel_url: `${req.headers.origin}/?payment=cancelled`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
import Stripe from 'stripe';
import express from 'express';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const HOST = process.env.HOST;
const PORT = process.env.PORT;
const URL = process.env.URL;

const BUY_HTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
      input[type="submit"] {
        height: 40px;
        width: 200px;
        border: none;
        border-radius: 5px;
        background-color: #0070f3;
        color: #fff;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <form action="${URL}/session" method="POST">
      <input type="submit" value="Buy WittCepter $10" />
    </form>
  </body>
  </html>`;

const stripe = new Stripe(STRIPE_SECRET_KEY);
const app = express();

app.get('/', (req, res) => {
  res.send(BUY_HTML);
});

app.post('/session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{price: STRIPE_PRICE_ID, quantity: 1}],
      success_url: `${URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${URL}/cancel`
    });
    console.log('Session created!', session);
    return res.redirect(303, session.url);
  } catch (err) {
    console.error('Error generating session', err);
  }
});

app.post('/my-webhook', express.raw({type: 'application/json'}), (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      console.log('Checkout session completed!', event);
      // Use data in event to store customer data in database, send receipt email, etc.
      // For example, set the customer as "true" for paid customer, etc.
    } else {
      console.log('Unhandled event', event);
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error('Error handling webhook event.', err);
    return res.sendStatus(400);
  }
});

app.get('/success', async (req, res) => {
  try {
    console.log('Success', req.query.session_id);
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    console.log('Session retrieved', session);
    return res.send(`<html><body><h1>Thanks for your order, ${session.customer_details.name}!</h1></body></html>`);
  } catch (err) {
    console.error('Error handling success', err);
  }
});

app.get('/cancel', (req, res) => {
  res.send('<h1>Cancelled</h1>');
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

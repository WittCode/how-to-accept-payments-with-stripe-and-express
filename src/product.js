import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(STRIPE_SECRET_KEY);

const product = await stripe.products.create({
  name: 'WittCepter',
  description: 'Chrome extension that gives you control over your browser network traffic.',
});

const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 1000,
  currency: 'usd',
});

console.log(price);
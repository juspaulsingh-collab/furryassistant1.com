// Seed script to create subscription products in Stripe for Furry Assistant 1
// Run with: npx tsx scripts/seed-stripe-products.ts

import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Checking for existing Furry Assistant 1 Premium product...');
  
  const existingProducts = await stripe.products.search({ 
    query: "name:'Furry Assistant 1 Premium'" 
  });

  if (existingProducts.data.length > 0) {
    console.log('Furry Assistant 1 Premium product already exists:', existingProducts.data[0].id);
    
    const prices = await stripe.prices.list({ 
      product: existingProducts.data[0].id, 
      active: true 
    });
    console.log('Existing prices:');
    prices.data.forEach(p => {
      const interval = p.recurring?.interval || 'one-time';
      console.log(`  - ${p.id}: $${(p.unit_amount || 0) / 100}/${interval}`);
    });
    return;
  }

  console.log('Creating Furry Assistant 1 Premium subscription product...');

  const product = await stripe.products.create({
    name: 'Furry Assistant 1 Premium',
    description: 'Unlock advanced pet care features including AI-powered nutrition plans, unlimited GPS tracking, priority vet support, and exclusive community features.',
    metadata: {
      app: 'furry-assistant',
      type: 'subscription',
    },
  });

  console.log('Created product:', product.id);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 400,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      plan: 'monthly',
    },
  });

  console.log('Created monthly price:', monthlyPrice.id, '($4.00/month)');

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 3999,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: {
      plan: 'yearly',
    },
  });

  console.log('Created yearly price:', yearlyPrice.id, '($39.99/year)');

  console.log('\nDone! Products created successfully.');
  console.log('\nProduct ID:', product.id);
  console.log('Monthly Price ID:', monthlyPrice.id);
  console.log('Yearly Price ID:', yearlyPrice.id);
}

createProducts().catch(console.error);

import { getUncachableStripeClient } from '../server/stripeClient';

async function createPromoCode() {
  try {
    const stripe = await getUncachableStripeClient();
    
    const coupon = await stripe.coupons.create({
      percent_off: 50,
      duration: 'forever',
      name: '50% Off Premium',
    });
    
    console.log('Coupon created:', coupon.id);
    
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: 'FURRY50',
      max_redemptions: 100,
    });
    
    console.log('\n=== PROMO CODE CREATED ===');
    console.log('Code:', promoCode.code);
    console.log('Discount: 50% off forever');
    console.log('Max uses: 100');
    console.log('Promo ID:', promoCode.id);
    console.log('==========================\n');
    
  } catch (error) {
    console.error('Error creating promo code:', error);
    process.exit(1);
  }
}

createPromoCode();

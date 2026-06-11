// One-time price update: switch to $4/month and $39.99/year.
// Stripe prices are immutable, so we create new ones and archive the old.
// Run with: npx tsx scripts/update-stripe-prices.ts

import { getUncachableStripeClient } from "../server/stripeClient";

async function run() {
  const stripe = await getUncachableStripeClient();

  const found = await stripe.products.search({
    query: "name:'Furry Assistant 1 Premium'",
  });

  if (found.data.length === 0) {
    console.log("Product not found. Run seed-stripe-products.ts first.");
    return;
  }

  const product = found.data[0];
  console.log("Product:", product.id);

  const existing = await stripe.prices.list({ product: product.id, active: true, limit: 100 });

  const NEW_MONTHLY_CENTS = 400;
  const NEW_YEARLY_CENTS = 3999;

  const monthlyExists = existing.data.find(
    (p) => p.recurring?.interval === "month" && p.unit_amount === NEW_MONTHLY_CENTS,
  );
  const yearlyExists = existing.data.find(
    (p) => p.recurring?.interval === "year" && p.unit_amount === NEW_YEARLY_CENTS,
  );

  let newMonthly = monthlyExists;
  if (!newMonthly) {
    newMonthly = await stripe.prices.create({
      product: product.id,
      unit_amount: NEW_MONTHLY_CENTS,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan: "monthly" },
    });
    console.log("Created monthly price:", newMonthly.id, "($4.00/mo)");
  } else {
    console.log("Monthly price already exists:", newMonthly.id);
  }

  let newYearly = yearlyExists;
  if (!newYearly) {
    newYearly = await stripe.prices.create({
      product: product.id,
      unit_amount: NEW_YEARLY_CENTS,
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { plan: "yearly" },
    });
    console.log("Created yearly price:", newYearly.id, "($39.99/yr)");
  } else {
    console.log("Yearly price already exists:", newYearly.id);
  }

  for (const price of existing.data) {
    if (price.id === newMonthly.id || price.id === newYearly.id) continue;
    if (
      (price.recurring?.interval === "month" && price.unit_amount !== NEW_MONTHLY_CENTS) ||
      (price.recurring?.interval === "year" && price.unit_amount !== NEW_YEARLY_CENTS)
    ) {
      await stripe.prices.update(price.id, { active: false });
      console.log("Archived old price:", price.id, `($${(price.unit_amount || 0) / 100})`);
    }
  }

  console.log("\nDone. New pricing is live.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

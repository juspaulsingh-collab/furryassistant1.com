// Stripe webhook handlers for Furry Assistant
import { getStripeSync } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    // The sync verifies the signature and persists Stripe data. If verification
    // fails it throws — so anything we do after this point is on a trusted event.
    await sync.processWebhook(payload, signature, uuid);

    // Best-effort fulfillment for our one-time "Remove Ads" purchase.
    // Idempotent: setting adFree=true a second time is a no-op.
    try {
      const event = JSON.parse(payload.toString('utf8'));
      if (event?.type === 'checkout.session.completed') {
        const session = event.data?.object;
        const meta = session?.metadata || {};
        if (
          meta.purpose === 'remove_ads' &&
          meta.userId &&
          session.mode === 'payment' &&
          session.payment_status === 'paid' &&
          session.amount_total === 199 &&
          session.currency === 'usd'
        ) {
          await storage.setUserAdFree(meta.userId, true);
          console.log(`[remove_ads] adFree granted via webhook for user ${meta.userId}`);
        }
      }
    } catch (err) {
      console.error('[remove_ads] webhook fulfillment hook error:', err);
    }
  }
}

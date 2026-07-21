import { and, desc, lt, gte, isNull } from 'drizzle-orm';
import { BrevoClient } from '@getbrevo/brevo';
import { smsService } from '../services/sms-service';

import { db } from '../db/client';
import { saved_carts, customers } from '../db/schema';
import { eq } from 'drizzle-orm';

function isDirectJobRun() {
  return (process.argv[1] || '').replace(/\\/g, '/').includes('/abandonedCartEmailJob');
}

export async function sendAbandonedCartEmails() {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey || brevoApiKey.includes('your_brevo_api_key')) {
    console.log('[AbandonedCartJob] Skipping: BREVO_API_KEY not configured.');
    return;
  }

  const client = new BrevoClient({ credentials: { apiKey: brevoApiKey } });

  const now = Date.now();
  
  // Cutoffs
  const oneHourCutoff = new Date(now - 1 * 60 * 60 * 1000);
  const twentyFourHourCutoff = new Date(now - 24 * 60 * 60 * 1000);
  const seventyTwoHourCutoff = new Date(now - 72 * 60 * 60 * 1000);
  
  // Max cutoff - don't send emails for carts older than 7 days
  const maxCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Template IDs (configured in env)
  const templateStage1 = Number(process.env.BREVO_TEMPLATE_AC_1 || 1);
  const templateStage2 = Number(process.env.BREVO_TEMPLATE_AC_2 || 2);
  const templateStage3 = Number(process.env.BREVO_TEMPLATE_AC_3 || 3);

  // Fetch all potential abandoned carts
  const carts = await db
    .select({
      id: saved_carts.id,
      customer_id: saved_carts.customer_id,
      session_id: saved_carts.session_id,
      updated_at: saved_carts.updated_at,
      recovery_sent: saved_carts.recovery_sent,
      recovery_sent_at: saved_carts.recovery_sent_at,
      metadata: (saved_carts as any).metadata, // using any because we will add it to schema
      email: customers.email,
      firstName: customers.first_name,
      phone: customers.phone,
    })
    .from(saved_carts)
    .leftJoin(customers, eq(saved_carts.customer_id, customers.id))
    .where(
      and(
        lt(saved_carts.updated_at, oneHourCutoff),
        gte(saved_carts.updated_at, maxCutoff)
      )
    )
    .orderBy(desc(saved_carts.updated_at));

  for (const cart of carts) {
    // Only send to known customers with email
    if (!cart.email) continue;
    
    // Determine the current stage based on time
    let targetStage = 0;
    const updatedAt = cart.updated_at?.getTime() || 0;

    if (updatedAt <= seventyTwoHourCutoff.getTime()) {
      targetStage = 3;
    } else if (updatedAt <= twentyFourHourCutoff.getTime()) {
      targetStage = 2;
    } else if (updatedAt <= oneHourCutoff.getTime()) {
      targetStage = 1;
    }

    const currentMetadata = (cart.metadata as Record<string, any>) || {};
    const currentStage = currentMetadata.recovery_stage || (cart.recovery_sent ? 1 : 0);

    if (targetStage > currentStage) {
      let templateId = templateStage1;
      if (targetStage === 2) templateId = templateStage2;
      if (targetStage === 3) templateId = templateStage3;

      const storefrontUrl = process.env.STOREFRONT_URL || 'https://odhvica.com';
      const cartUrl = `${storefrontUrl}/cart`;

      try {
        await client.transactionalEmails.sendTransacEmail({
          templateId: templateId,
          to: [{ email: cart.email, name: cart.firstName || 'Customer' }],
          params: {
            CART_URL: cartUrl,
            FIRST_NAME: cart.firstName || 'there',
          }
        });
        console.log(`[AbandonedCartJob] Sent stage ${targetStage} email to ${cart.email}`);
        
        // SMS Fallback/Addition if opted in
        if (cart.phone && currentMetadata.sms_opt_in === true) {
          let smsBody = '';
          if (targetStage === 1) smsBody = `Hi ${cart.firstName || 'there'}, you left items in your cart! Complete your purchase: ${cartUrl}`;
          if (targetStage === 2) smsBody = `Hi ${cart.firstName || 'there'}, your cart is waiting for you with a 10% discount! Checkout now: ${cartUrl}`;
          if (targetStage === 3) smsBody = `Last chance! Your cart expires soon: ${cartUrl}`;

          if (smsBody) {
            await smsService.sendTwilioSms(cart.phone, smsBody);
          }

          // Dynamic WhatsApp Template Notification
          try {
            const whatsappTemplate = process.env.WHATSAPP_TEMPLATE_AC || 'abandoned_cart';
            await smsService.sendWhatsAppTemplate(
              cart.phone,
              whatsappTemplate,
              [cart.firstName || 'there', cartUrl]
            );
          } catch (whatsappErr) {
            console.error('[AbandonedCartJob] WhatsApp trigger failed:', whatsappErr);
          }
        }
        
        currentMetadata.recovery_stage = targetStage;

        // Update DB
        await db.update(saved_carts)
          .set({ 
            recovery_sent: true,
            recovery_sent_at: new Date(),
            metadata: currentMetadata
          } as any)
          .where(eq(saved_carts.id, cart.id));
          
      } catch (err: any) {
        console.error(`[AbandonedCartJob] Error sending email to ${cart.email}:`, err?.response?.body || err.message);
      }
    }
  }
}

if (isDirectJobRun()) {
  sendAbandonedCartEmails()
    .then(() => {
      console.log('Abandoned cart job completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Abandoned cart job failed', err);
      process.exit(1);
    });
}

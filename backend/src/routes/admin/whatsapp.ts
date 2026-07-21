import { Hono } from 'hono';
import { db } from '../../db/client';
import { whatsapp_settings } from '../../db/schema';
import { verifyAdmin } from '../../middleware/auth';
import { eq } from 'drizzle-orm';
import { createNotification } from './notifications';

const whatsappRouter = new Hono();

// Get WhatsApp settings
whatsappRouter.get('/settings', verifyAdmin, async (c) => {
  try {
    const config = await db.select().from(whatsapp_settings).limit(1);

    if (config.length === 0) {
      return c.json({
        is_active: false,
        notify_on_order: true,
        notify_on_new_customer: false,
        admin_phone: '',
      });
    }

    const { access_token, ...safeConfig } = config[0];
    return c.json(safeConfig);
  } catch (error: unknown) {
    console.error('Error fetching WhatsApp settings:', error);
    return c.json({ error: 'Failed to fetch WhatsApp settings' }, 500);
  }
});

// Save WhatsApp settings
whatsappRouter.post('/settings', verifyAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const {
      phone_number_id,
      access_token,
      business_account_id,
      admin_phone,
      notify_on_order,
      notify_on_new_customer,
      is_active,
    } = body;

    if (!phone_number_id || !access_token || !admin_phone) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const existing = await db.select().from(whatsapp_settings).limit(1);

    if (existing.length > 0) {
      await db
        .update(whatsapp_settings)
        .set({
          phone_number_id,
          access_token,
          business_account_id,
          admin_phone,
          notify_on_order: notify_on_order ?? true,
          notify_on_new_customer: notify_on_new_customer ?? false,
          is_active: is_active ?? false,
          updated_at: new Date(),
        })
        .where(eq(whatsapp_settings.id, existing[0].id));
    } else {
      await db.insert(whatsapp_settings).values({
        phone_number_id,
        access_token,
        business_account_id,
        admin_phone,
        notify_on_order: notify_on_order ?? true,
        notify_on_new_customer: notify_on_new_customer ?? false,
        is_active: is_active ?? false,
      });
    }

    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error saving WhatsApp settings:', error);
    return c.json({ error: 'Failed to save WhatsApp settings' }, 500);
  }
});

// Test WhatsApp connection
whatsappRouter.post('/test', verifyAdmin, async (c) => {
  try {
    const config = await db
      .select()
      .from(whatsapp_settings)
      .where(eq(whatsapp_settings.is_active, true))
      .limit(1);

    if (config.length === 0) {
      return c.json(
        { error: 'WhatsApp is not configured or is inactive' },
        400
      );
    }

    const { access_token, phone_number_id, admin_phone } = config[0];

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: admin_phone,
          type: 'text',
          text: {
            body: 'Test notification from Odhvica Admin!',
          },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      return c.json(
        { error: data.error?.message || 'Failed to send test message' },
        400
      );
    }

    return c.json({
      success: true,
      message: 'Test message sent successfully!',
    });
  } catch (error: unknown) {
    console.error('Error testing WhatsApp:', error);
    return c.json({ error: 'Failed to test WhatsApp connection' }, 500);
  }
});

// Send WhatsApp notification (exported for use in checkout)
export const sendWhatsAppNotification = async (
  type: 'order' | 'customer',
  data: any
) => {
  try {
    const config = await db
      .select()
      .from(whatsapp_settings)
      .where(eq(whatsapp_settings.is_active, true))
      .limit(1);

    if (config.length === 0) {
      console.log('WhatsApp not configured, skipping notification');
      return null;
    }

    const {
      access_token,
      phone_number_id,
      admin_phone,
      notify_on_order,
      notify_on_new_customer,
    } = config[0];

    if (type === 'order' && !notify_on_order) return null;
    if (type === 'customer' && !notify_on_new_customer) return null;

    let message = '';

    if (type === 'order') {
      const orderNumber = data.display_id || data.id;
      const total = (data.total / 100).toFixed(2);
      const customerName = data.customer?.first_name || 'Guest';
      const itemCount = data.items?.length || 0;

      message = `New Order Received\n\nOrder #${orderNumber}\nCustomer: ${customerName}\nItems: ${itemCount}\nTotal: Rs${total}`;
    } else if (type === 'customer') {
      message = `New Customer Registration\n\nName: ${data.first_name} ${data.last_name || ''}\nEmail: ${data.email}`;
    }

    if (!message) return null;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: admin_phone,
          type: 'text',
          text: { body: message },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('WhatsApp notification failed:', result);
      return null;
    }

    // Create in-app notification
    if (type === 'order') {
      await createNotification(
        'order',
        'New Order Received',
        `Order #${data.display_id} - Rs${(data.total / 100).toFixed(2)}`,
        { order_id: data.id }
      );
    } else if (type === 'customer') {
      await createNotification(
        'customer',
        'New Customer',
        `${data.first_name} ${data.last_name} registered`,
        { customer_id: data.id }
      );
    }

    return result;
  } catch (error: unknown) {
    console.error('Error sending WhatsApp notification:', error);
    return null;
  }
};

export default whatsappRouter;

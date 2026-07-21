import twilio from 'twilio';
import { eq } from 'drizzle-orm';

export class SMSService {
  private get msg91AuthKey() {
    return process.env.MSG91_AUTH_KEY;
  }

  private get msg91TemplateId() {
    return process.env.MSG91_OTP_TEMPLATE_ID; // Can be configured later
  }

  private get msg91SenderId() {
    return process.env.MSG91_SENDER_ID || 'ODHVCA';
  }

  /**
   * Send an OTP via MSG91.
   * If MSG91_AUTH_KEY is not set, it silently logs in dev mode and skips in production.
   */
  async sendOtp(phone: string, otp: string) {
    if (!this.msg91AuthKey) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n📱 SMS OTP (DEV MODE)');
        console.log('   To Phone:', phone);
        console.log('   OTP:', otp);
        console.log('   Note: MSG91_AUTH_KEY not set. SMS not actually sent.\n');
      }
      return;
    }

    try {
      // Normalize phone number - MSG91 expects country code, default to 91 for India if missing and 10 digits
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = `91${formattedPhone}`;
      }

      // If we have a specific template ID for MSG91 DLT:
      const payload = this.msg91TemplateId
        ? {
            template_id: this.msg91TemplateId,
            mobile: formattedPhone,
            authkey: this.msg91AuthKey,
            otp: otp,
          }
        : {
            mobile: formattedPhone,
            authkey: this.msg91AuthKey,
            otp: otp,
            message: `Your Odhvica verification code is ${otp}. It will expire in 10 minutes.`,
            sender: this.msg91SenderId,
          };

      const searchParams = new URLSearchParams(payload as any).toString();
      
      const response = await fetch(`https://control.msg91.com/api/v5/otp?${searchParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data: unknown = await response.json();

      if (
        typeof data === 'object' &&
        data !== null &&
        'type' in data &&
        data.type === 'error'
      ) {
        const message =
          'message' in data && typeof data.message === 'string'
            ? data.message
            : 'Unknown MSG91 error';
        console.error('MSG91 Error:', message);
      }
    } catch (error) {
      console.error('Failed to send SMS via MSG91:', error);
    }
  }

  /**
   * Send SMS via Twilio (e.g. for abandoned checkout)
   */
  async sendTwilioSms(to: string, body: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n📱 SMS (Twilio DEV MODE)');
        console.log('   To Phone:', to);
        console.log('   Body:', body);
        console.log('   Note: Twilio credentials not set. SMS not actually sent.\n');
      }
      return;
    }

    try {
      const client = twilio(accountSid, authToken);
      let formattedPhone = to.replace(/\D/g, '');
      // If it doesn't have a country code, prepend it (e.g. US +1 or India +91 depending on store focus, assuming India +91 for Odhvica if length is 10)
      if (formattedPhone.length === 10) {
        formattedPhone = `+91${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      await client.messages.create({
        body,
        from,
        to: formattedPhone
      });
      console.log(`[Twilio] Sent SMS to ${formattedPhone}`);
    } catch (error) {
      console.error('[Twilio] Failed to send SMS:', error);
    }
  }

  /**
   * Send WhatsApp Template Message using Meta Cloud API
   */
  async sendWhatsAppTemplate(to: string, templateName: string, params: string[]) {
    try {
      const { db } = await import('../db/client');
      const { whatsapp_settings } = await import('../db/schema');

      const configRows = await db
        .select()
        .from(whatsapp_settings)
        .where(eq(whatsapp_settings.is_active, true))
        .limit(1);

      const config = configRows[0];

      if (!config || !config.access_token || !config.phone_number_id) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[WhatsApp DEV] Skipped template ${templateName} to ${to} - Config inactive.`);
        }
        return;
      }

      let formattedPhone = to.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = `91${formattedPhone}`;
      }

      const url = `https://graph.facebook.com/v19.0/${config.phone_number_id}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'en',
            },
            components: [
              {
                type: 'body',
                parameters: params.map((p) => ({
                  type: 'text',
                  text: p,
                })),
              },
            ],
          },
        }),
      });

      const data: any = await response.json();
      if (data.error) {
        console.error('[WhatsApp Error] Meta API returned:', data.error);
      } else {
        console.log(`[WhatsApp] Sent template ${templateName} to ${formattedPhone}`);
      }
    } catch (error) {
      console.error('[WhatsApp Error] Failed to send WhatsApp message:', error);
    }
  }
}

export const smsService = new SMSService();

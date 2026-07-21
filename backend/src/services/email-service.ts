import nodemailer from 'nodemailer';

// PHASE-2 FIX: HTML escape utility to prevent XSS in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to safely escape strings for HTML with fallback
function safeString(str: string | undefined | null, fallback = ''): string {
  return escapeHtml(str || fallback);
}

// Helper to safely format currency (handles cents vs major units)
function formatCurrency(total: number, currency: string): string {
  // Assume cents if > 1000, otherwise assume major units already
  const amount = total > 1000 ? total / 100 : total;
  return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
}

// Email validation helper
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendWithRetry(
  transporter: nodemailer.Transporter,
  mailOptions: nodemailer.SendMailOptions,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.warn(`[Email] Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}
interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Type definitions for email data
interface OrderEmailData {
  order_number: string | number;
  total: number;
  currency_code: string;
  status?: string;
}

interface InquiryEmailData {
  contact_name: string;
  company_name?: string;
  email: string;
}

class EmailService {
  private transporter!: nodemailer.Transporter;
  private readonly ready!: Promise<void>;

  private constructor(ready: Promise<void>) {
    this.ready = ready;
  }

  private getStorefrontUrl(): string {
    return (
      process.env.STOREFRONT_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000'
    );
  }

  private getWholesaleUrl(): string {
    return `${this.getStorefrontUrl()}/wholesale`;
  }

  /** Factory: initialize transporter async, then return instance */
  static async create(): Promise<EmailService> {
    const instance = new EmailService(
      // Assign a placeholder — `ready` will be resolved by initTransporter
      Promise.resolve()
    );
    if (process.env.NODE_ENV === 'production' && !process.env.SMTP_HOST) {
      console.error('❌ FATAL: SMTP_HOST is not set in production — emails will not be sent');
    }

    if (process.env.SMTP_HOST) {
      instance.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });
    } else {
      await instance.initTransporter();
    }
    return instance;
  }

  /** Initialize transporter asynchronously (development Ethereal setup) */
  private initTransporter(): Promise<void> {
    return new Promise<void>((resolve) => {
      nodemailer.createTestAccount((err, account) => {
        if (err) {
          console.error('Failed to create Ethereal account:', err);
          this.transporter = nodemailer.createTransport({ jsonTransport: true });
          resolve();
          return;
        }
        this.transporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: { user: account.user, pass: account.pass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
        });
        console.log('📧 Email Service ready (Ethereal Dev Mode)');
        console.log('📧 Preview URL: https://ethereal.email/messages');
        resolve();
      });
    });
  }

  /** Ensure transporter is ready before any operation */
  private async ensureReady(): Promise<void> {
    await this.ready;
  }

  async sendEmail(options: EmailOptions) {
    try {
      await this.ensureReady(); // OPT-001: Wait for transporter initialization
      const info = await sendWithRetry(this.transporter, {
        from: process.env.SMTP_FROM || '"Odhvica Support" <noreply@odhvica.com>', // sender address
        to: options.to, // list of receivers
        subject: options.subject, // Subject line
        text: options.text, // plain text body
        html: options.html, // html body
      });

      console.log(`Message sent: ${info.messageId}`);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return info;
    } catch (error: unknown) {
      console.error('Error sending email:', error);
      // In production, you might want to throw or log to a monitoring service
      // For now, we log and return false to indicate failure without crashing
      return false;
    }
  }

  async sendOrderConfirmation(order: OrderEmailData, customerEmail: string) {
    const subject = `Order Confirmation #${order.order_number}`;
    // Use safe formatting - handles cents conversion and escaping
    const formattedTotal = formatCurrency(order.total, order.currency_code);
    const safeStatus = order.status || 'Processing';
    
    const text = `Thank you for your order! Your order #${order.order_number} has been placed successfully. Total: ${formattedTotal}.`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Thank you for your order!</h1>
                <p>Hi there,</p>
                <p>Your order <strong>#${safeString(String(order.order_number))}</strong> has been placed successfully.</p>

                <h2>Order Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">Order Number</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${safeString(String(order.order_number))}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${formattedTotal}</strong></td>
                    </tr>
                     <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">Status</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${safeString(safeStatus)}</td>
                    </tr>
                </table>

                <p style="margin-top: 20px;">
                    We will notify you once your items have been shipped.
                </p>

                <p>Best regards,<br>Odhvica Team</p>
            </div>
        `;

    return this.sendEmail({ to: customerEmail, subject, text, html });
  }

  async sendOrderStatusUpdate(order: OrderEmailData, customerEmail: string) {
    const subject = `Order Update #${order.order_number}`;
    const statusDisplay = order.status ? order.status.toUpperCase() : 'Unknown';
    const text = `Your order #${order.order_number} status has been updated to: ${statusDisplay}.`;
    const html = `
             <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Order Update</h1>
                <p>Your order <strong>#${order.order_number}</strong> has been updated.</p>
                <p>New Status: <strong>${escapeHtml(statusDisplay)}</strong></p>
                <p>Best regards,<br>Odhvica Team</p>
            </div>
        `;

    return this.sendEmail({ to: customerEmail, subject, text, html });
  }

  async sendInquiryReceived(data: { email: string; contact_name: string }) {
    const subject = 'Wholesale Inquiry Received';
    const text = `Hi ${data.contact_name},\n\nThank you for your wholesale inquiry. We have received your request and will review it shortly.\n\nBest regards,\nOdhvica Team`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Thank you for your inquiry!</h1>
                <p>Hi ${safeString(data.contact_name)},</p>
                <p>We have received your wholesale inquiry and will review it shortly.</p>
                <p>Best regards,<br>Odhvica Team</p>
            </div>
        `;
    return this.sendEmail({ to: data.email, subject, text, html });
  }

  async sendNewInquiryAlert(inquiry: InquiryEmailData) {
    const subject = 'New Wholesale Inquiry Received';
    const text = `A new wholesale inquiry has been submitted by ${inquiry.contact_name} from ${inquiry.company_name || 'N/A'}.\n\nPlease review it in the admin dashboard.`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>New Wholesale Inquiry</h1>
                <p>A new inquiry has been submitted:</p>
                <ul>
                    <li><strong>Company:</strong> ${safeString(inquiry.company_name, 'N/A')}</li>
                    <li><strong>Contact:</strong> ${safeString(inquiry.contact_name)}</li>
                    <li><strong>Email:</strong> ${safeString(inquiry.email)}</li>
                </ul>
                <p>Please review it in the admin dashboard.</p>
            </div>
        `;
    // Send to admin email
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@odhvica.com';
    return this.sendEmail({ to: adminEmail, subject, text, html });
  }

  async sendInquiryApproved(data: {
    email: string;
    contact_name: string;
    company_name: string;
    discount_tier: string;
  }) {
    const subject = 'Wholesale Inquiry Approved!';
    const text = `Hi ${data.contact_name},\n\nGreat news! Your wholesale inquiry for ${data.company_name} has been approved.\n\nYou have been assigned discount tier: ${data.discount_tier}\n\nBest regards,\nOdhvica Team`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Congratulations!</h1>
                <p>Hi ${safeString(data.contact_name)},</p>
                <p>Your wholesale inquiry for <strong>${safeString(data.company_name)}</strong> has been approved!</p>
                <p>Your discount tier: <strong>${safeString(data.discount_tier)}</strong></p>
                <p>Best regards,<br>Odhvica Team</p>
            </div>
        `;
    return this.sendEmail({ to: data.email, subject, text, html });
  }

  async sendWholesaleWelcome(data: {
    email: string;
    contact_name: string;
    company_name: string;
    discount_tier: string;
    token: string;
  }) {
    const setupUrl = `${this.getWholesaleUrl()}/set-password?token=${encodeURIComponent(data.token)}`;
    // Handle empty discount_tier safely
    const tierDisplay = data.discount_tier
      ? data.discount_tier.charAt(0).toUpperCase() + data.discount_tier.slice(1)
      : 'Standard';
    const subject = 'Welcome to Odhvica Wholesale - Set Up Your Account';
    const text = `Hi ${data.contact_name},\n\nWelcome to Odhvica Wholesale! Your application for ${data.company_name} has been approved.\n\nYour discount tier: ${tierDisplay}\n\nPlease set up your password by clicking the link below:\n\n${setupUrl}\n\nThis link will expire in 7 days.\n\nBest regards,\nOdhvica Team`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <h1>Welcome to Odhvica Wholesale!</h1>
                <p>Hi ${safeString(data.contact_name)},</p>
                <p>Congratulations! Your wholesale application for <strong>${safeString(data.company_name)}</strong> has been approved.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Your Discount Tier:</strong> ${safeString(tierDisplay)}</p>
                </div>
                <p>Please set up your password to access your wholesale account:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${setupUrl}" style="background-color: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                        Set Up Password
                    </a>
                </p>
                <p>Or copy this link to your browser:<br>
                <small>${setupUrl}</small></p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 7 days. If you didn't expect this email, please ignore it.</p>
                <p>Best regards,<br>Odhvica Team</p>
            </div>
        `;

    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 WHOLESALE WELCOME EMAIL (DEV MODE)');
      console.log('   To:', data.email);
      console.log('   Setup URL:', setupUrl);
      console.log('');
    }

    return this.sendEmail({ to: data.email, subject, text, html });
  }

  async sendInquiryRejected(data: {
    email: string;
    contact_name: string;
    company_name: string;
    admin_notes?: string;
  }) {
    const subject = 'Wholesale Inquiry Update';
    const adminNotesLine = data.admin_notes ? `Notes: ${data.admin_notes}\n\n` : '';
    const text = `Hi ${data.contact_name},\n\nThank you for your interest in Odhvica wholesale program. After careful review, we are unable to approve your inquiry for ${data.company_name} at this time.\n\n${adminNotesLine}Best regards,\nOdhvica Team`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Inquiry Update</h1>
                <p>Hi ${safeString(data.contact_name)},</p>
                <p>Thank you for your interest in our wholesale program. After careful review, we are unable to approve your inquiry for <strong>${safeString(data.company_name)}</strong> at this time.</p>
                ${data.admin_notes ? `<p><strong>Notes:</strong> ${safeString(data.admin_notes)}</p>` : ''}
                <p>Best regards,<br>Odhvica Team</p>
            </div>
        `;
    return this.sendEmail({ to: data.email, subject, text, html });
  }

  // 🔒 FIX-011: Email verification email
  async sendVerificationEmail(data: {
    email: string;
    first_name: string;
    token: string;
  }) {
    const subject = 'Your Odhvica Verification Code';
    const text = `Hi ${data.first_name},\n\nWelcome to Odhvica! Your verification code is: ${data.token}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nOdhvica Team`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; text-align: center;">
                <h1>Welcome to Odhvica!</h1>
                <p>Hi ${safeString(data.first_name)},</p>
                <p>Thank you for creating an account with us. Please use the following 4-digit code to verify your email address:</p>
                <div style="background-color: #f4f4f4; border-radius: 8px; padding: 20px; margin: 30px auto; width: fit-content;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1c1917;">${data.token}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you didn't create an account with Odhvica, please ignore this email.</p>
                <p>Best regards,<br>Odhvica Team</p>
            </div>
        `;

    // DEV MODE: Log verification URL directly for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 EMAIL VERIFICATION (DEV MODE)');
      console.log('   To:', data.email);
      console.log('   OTP Code:', data.token);
      console.log('');
    }

    return this.sendEmail({ to: data.email, subject, text, html });
  }

  // 🔒 Password Reset Email
  async sendPasswordResetEmail(data: {
    email: string;
    first_name: string;
    token: string;
  }) {
    const resetUrl = `${this.getStorefrontUrl()}/reset-password?token=${encodeURIComponent(data.token)}`;
    const subject = 'Reset Your Password - Odhvica';
    const text = `Hi ${data.first_name},\n\nYou requested to reset your password.\n\nClick the link below to create a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nOdhvica Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h1>Reset Your Password</h1>
        <p>Hi ${safeString(data.first_name)},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #1c1917; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </p>
        <p>Or copy this link:<br><small>${resetUrl}</small></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Odhvica Team</p>
      </div>
    `;

    // DEV MODE: Log reset URL directly for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 PASSWORD RESET (DEV MODE)');
      console.log('   To:', data.email);
      console.log('   Reset URL:', resetUrl);
      console.log('');
    }

    return this.sendEmail({ to: data.email, subject, text, html });
  }

  // 📦 Shipping Notification Email
  async sendShippingNotification(data: {
    email: string;
    order_number: string | number;
    tracking_number: string;
    shipping_carrier?: string;
    tracking_link?: string;
  }) {
    const subject = `Your Odhvica order #${data.order_number} has shipped!`;
    const storeUrl = this.getStorefrontUrl();
    const trackingLine = data.tracking_link
      ? `<a href="${data.tracking_link}" style="color:#007bff;">${safeString(data.tracking_number)}</a>`
      : safeString(data.tracking_number);
    const carrierLine = data.shipping_carrier
      ? `<p><strong>Carrier:</strong> ${safeString(data.shipping_carrier)}</p>`
      : '';

    const text = `Your order #${data.order_number} has been shipped!\n\nTracking Number: ${data.tracking_number}${data.shipping_carrier ? `\nCarrier: ${data.shipping_carrier}` : ''}${data.tracking_link ? `\nTrack your order: ${data.tracking_link}` : ''}\n\nBest regards,\nOdhvica Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1614; padding: 24px; text-align: center;">
          <h2 style="color: #f5c842; margin: 0; font-size: 22px; letter-spacing: 2px;">ODHVICA</h2>
        </div>
        <div style="padding: 32px 24px;">
          <h1 style="font-size: 24px; color: #1a1614;">Your order is on its way!</h1>
          <p>Great news! Your order <strong>#${safeString(String(data.order_number))}</strong> has been shipped and is heading to you.</p>
          <div style="background: #f9f7f5; border-left: 4px solid #f5c842; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0;"><strong>Tracking Number:</strong> ${trackingLine}</p>
            ${carrierLine}
          </div>
          ${data.tracking_link ? `
          <p style="text-align: center; margin: 32px 0;">
            <a href="${data.tracking_link}" style="background-color: #1a1614; color: white; padding: 14px 32px; text-decoration: none; border-radius: 2px; display: inline-block; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; font-size: 13px;">
              Track Your Order
            </a>
          </p>` : ''}
          <p style="margin-top: 24px;">You can also view your order status anytime at <a href="${storeUrl}/account" style="color: #007bff;">${storeUrl}/account</a></p>
          <p>Best regards,<br>Odhvica Team</p>
        </div>
      </div>
    `;

    return this.sendEmail({ to: data.email, subject, text, html });
  }

  async sendBuyerOrderUpdate(data: {
    email: string;
    order_number: string | number;
    subject: string;
    message: string;
    tracking_number?: string | null;
    shipping_carrier?: string | null;
    tracking_link?: string | null;
  }) {
    const trackingText = data.tracking_number
      ? `\n\nTracking: ${data.tracking_number}${data.shipping_carrier ? `\nCarrier: ${data.shipping_carrier}` : ''}${data.tracking_link ? `\nTrack here: ${data.tracking_link}` : ''}`
      : '';
    const text = `${data.message}${trackingText}\n\nBest regards,\nOdhvica Team`;
    const trackingHtml = data.tracking_number
      ? `
        <div style="background: #f9f7f5; border-left: 4px solid #1a1614; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Tracking:</strong> ${safeString(data.tracking_number)}</p>
          ${data.shipping_carrier ? `<p style="margin: 0 0 8px 0;"><strong>Carrier:</strong> ${safeString(data.shipping_carrier)}</p>` : ''}
          ${data.tracking_link ? `<p style="margin: 0;"><a href="${safeString(data.tracking_link)}" style="color:#007bff;">Track your order</a></p>` : ''}
        </div>`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <div style="background: #1a1614; padding: 24px; text-align: center;">
          <h2 style="color: #f5c842; margin: 0; font-size: 22px; letter-spacing: 2px;">ODHVICA</h2>
        </div>
        <div style="padding: 32px 24px;">
          <p style="color:#777; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Order #${safeString(String(data.order_number))}</p>
          <div>${safeString(data.message).replace(/\n/g, '<br>')}</div>
          ${trackingHtml}
          <p style="margin-top: 24px;">Best regards,<br>Odhvica Team</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: data.email,
      subject: data.subject,
      text,
      html,
    });
  }

  // 🔔 Back-in-Stock Notification Email
  async sendBackInStockNotification(data: {
    email: string;
    product_title: string;
    product_url: string;
  }) {
    const subject = `"${data.product_title}" is back in stock! 🎉`;
    const safeTitle = safeString(data.product_title);
    const storeUrl = this.getStorefrontUrl();
    const productUrl = data.product_url.startsWith('http')
      ? data.product_url
      : `${storeUrl}${data.product_url}`;

    const text = `Great news! "${data.product_title}" is back in stock. Shop now before it sells out: ${productUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1614; padding: 24px; text-align: center;">
          <h2 style="color: #f5c842; margin: 0; font-size: 22px; letter-spacing: 2px;">ODHVICA</h2>
        </div>
        <div style="padding: 32px 24px;">
          <h1 style="font-size: 24px; color: #1a1614;">It's back! 🎉</h1>
          <p>An item on your wishlist is now back in stock.</p>
          <div style="background: #f9f7f5; border-left: 4px solid #f5c842; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; font-size: 18px;">${safeTitle}</p>
          </div>
          <p>Hurry — popular items often sell out quickly!</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${productUrl}"
               style="background-color: #1a1614; color: white; padding: 14px 32px; text-decoration: none; border-radius: 2px; display: inline-block; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; font-size: 13px;">
              Shop Now
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 16px;">
            You subscribed to restock alerts for this product. If you no longer wish to receive these emails, simply ignore future ones.
          </p>
        </div>
      </div>
    `;

    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 BACK-IN-STOCK NOTIFICATION (DEV MODE)');
      console.log('   To:', data.email);
      console.log('   Product:', data.product_title);
      console.log('   URL:', productUrl);
      console.log('');
    }

    return this.sendEmail({ to: data.email, subject, text, html });
  }

  // 💌 Bulk Marketing Blast Email
  async sendStudioReplyNotification(data: {
    email: string;
    customer_name?: string | null;
    product_title: string;
    message: string;
    conversation_url: string;
  }) {
    const subject = `Odhvica Studio replied about ${data.product_title}`;
    const safeName = safeString(data.customer_name || 'there');
    const safeProduct = safeString(data.product_title);
    const safeMessage = safeString(data.message);
    const safeUrl = safeString(data.conversation_url);
    const text = `Hi ${data.customer_name || 'there'},\n\nOdhvica Studio replied to your message about ${data.product_title}:\n\n${data.message}\n\nOpen your conversation here:\n${data.conversation_url}\n\nBest regards,\nOdhvica Studio`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <div style="background: #1a1614; padding: 24px; text-align: center;">
          <h2 style="color: #f5c842; margin: 0; font-size: 22px; letter-spacing: 2px;">ODHVICA</h2>
        </div>
        <div style="padding: 32px 24px;">
          <h1 style="font-size: 24px; color: #1a1614;">Odhvica Studio replied</h1>
          <p>Hi ${safeName},</p>
          <p>We replied to your message about <strong>${safeProduct}</strong>.</p>
          <div style="background: #f9f7f5; border-left: 4px solid #1a1614; padding: 16px; margin: 24px 0;">
            ${safeMessage.replace(/\n/g, '<br>')}
          </div>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${safeUrl}"
               style="background-color: #1a1614; color: white; padding: 14px 32px; text-decoration: none; display: inline-block; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; font-size: 13px;">
              Open Conversation
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 16px;">
            This secure link opens your product conversation. Please do not forward it.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({ to: data.email, subject, text, html });
  }

  async sendMarketingBlast(data: {
    to: string[];
    campaign_name: string;
    subject: string;
    headline: string;
    body_text: string;
    cta_text: string;
    cta_url: string;
  }): Promise<{ sent: number; failed: number }> {
    const storeUrl = this.getStorefrontUrl();
    const ctaUrl = data.cta_url.startsWith('http')
      ? data.cta_url
      : `${storeUrl}${data.cta_url}`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1614; padding: 24px; text-align: center;">
          <h2 style="color: #f5c842; margin: 0; font-size: 22px; letter-spacing: 2px;">ODHVICA</h2>
        </div>
        <div style="padding: 40px 32px;">
          <h1 style="font-size: 28px; color: #1a1614; margin-bottom: 16px;">${safeString(data.headline)}</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">${safeString(data.body_text)}</p>
          <p style="text-align: center; margin: 36px 0;">
            <a href="${ctaUrl}"
               style="background-color: #1a1614; color: white; padding: 16px 40px; text-decoration: none;
                      border-radius: 2px; display: inline-block; font-weight: bold;
                      letter-spacing: 2px; text-transform: uppercase; font-size: 13px;">
              ${safeString(data.cta_text)}
            </a>
          </p>
        </div>
        <div style="background: #f5f5f5; padding: 16px; text-align: center;">
          <p style="color: #999; font-size: 11px; margin: 0;">
            You are receiving this because you subscribed to Odhvica updates.<br>
            &copy; ${new Date().getFullYear()} Odhvica. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const text = `${data.headline}\n\n${data.body_text}\n\n${data.cta_text}: ${ctaUrl}`;

    // Send in chunks of 50 to avoid SMTP blocking
    const CHUNK_SIZE = 50;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < data.to.length; i += CHUNK_SIZE) {
      const chunk = data.to.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map((email) =>
          this.sendEmail({ to: email, subject: safeString(data.subject), text, html })
        )
      );
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value !== false) sent++;
        else failed++;
      }
      // Small delay between chunks
      if (i + CHUNK_SIZE < data.to.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n💌 MARKETING BLAST (DEV MODE): Sent ${sent}, Failed ${failed}`);
    }
    return { sent, failed };
  }
}


// Lazy singleton: initialized once on first use
let _emailServiceInstance: EmailService | null = null;
let _emailServiceInit: Promise<EmailService> | null = null;

function getEmailService(): Promise<EmailService> {
  if (_emailServiceInstance) return Promise.resolve(_emailServiceInstance);
  _emailServiceInit ??= EmailService.create().then((svc) => {
    _emailServiceInstance = svc;
    return svc;
  });
  return _emailServiceInit;
}

// Proxy object that forwards all async method calls to the lazily initialized instance
export const emailService = new Proxy({} as EmailService, {
  get(_target, prop) {
    return async (...args: unknown[]) => {
      const svc = await getEmailService();
      return (svc as unknown as Record<string, (...a: unknown[]) => unknown>)[prop as string](...args);
    };
  },
});

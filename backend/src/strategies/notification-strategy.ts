/**
 * Notification Strategy - Phase 4 Q19: Strategy Pattern
 *
 * Implements interchangeable notification delivery methods.
 */

import { z } from 'zod';

/**
 * Notification input schema
 */
export const NotificationInputSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  htmlBody: z.string().optional(),
});

export type NotificationInput = z.infer<typeof NotificationInputSchema>;

/**
 * Notification output schema
 */
export const NotificationOutputSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  error: z.string().optional(),
  deliveredAt: z.date().optional(),
});

export type NotificationOutput = z.infer<typeof NotificationOutputSchema>;

/**
 * Base notification strategy interface
 */
export interface NotificationStrategy {
  name: string;
  description: string;
  send(input: NotificationInput): Promise<NotificationOutput>;
  validate(input: NotificationInput): { valid: boolean; error?: string };
}

/**
 * Email notification strategy
 */
export const emailNotificationStrategy: NotificationStrategy = {
  name: 'email',
  description: 'Send notification via email',

  async send(input: NotificationInput): Promise<NotificationOutput> {
    try {
      // Mock email delivery - in production, integrate with SendGrid/AWS SES
      console.log(`[EMAIL] To: ${input.to}, Subject: ${input.subject}`);
      return {
        success: true,
        messageId: `email-${Date.now()}`,
        deliveredAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  validate(input: NotificationInput): { valid: boolean; error?: string } {
    if (!input.to.includes('@')) {
      return { valid: false, error: 'Invalid email address' };
    }
    if (input.subject.length > 200) {
      return { valid: false, error: 'Subject too long (max 200 chars)' };
    }
    return { valid: true };
  },
};

/**
 * SMS notification strategy
 */
export const smsNotificationStrategy: NotificationStrategy = {
  name: 'sms',
  description: 'Send notification via SMS',

  async send(input: NotificationInput): Promise<NotificationOutput> {
    console.log(
      `[SMS] To: ${input.to}, Message: ${input.body.substring(0, 160)}`
    );
    return {
      success: true,
      messageId: `sms-${Date.now()}`,
      deliveredAt: new Date(),
    };
  },

  validate(input: NotificationInput): { valid: boolean; error?: string } {
    if (input.body.length > 160) {
      return { valid: false, error: 'SMS message too long (max 160 chars)' };
    }
    return { valid: true };
  },
};

/**
 * Push notification strategy
 */
export const pushNotificationStrategy: NotificationStrategy = {
  name: 'push',
  description: 'Send push notification',

  async send(input: NotificationInput): Promise<NotificationOutput> {
    console.log(
      `[PUSH] Title: ${input.subject}, Body: ${input.body.substring(0, 100)}`
    );
    return {
      success: true,
      messageId: `push-${Date.now()}`,
      deliveredAt: new Date(),
    };
  },

  validate(input: NotificationInput): { valid: boolean; error?: string } {
    if (input.body.length > 200) {
      return {
        valid: false,
        error: 'Push notification too long (max 200 chars)',
      };
    }
    return { valid: true };
  },
};

/**
 * In-app notification strategy
 */
export const inAppNotificationStrategy: NotificationStrategy = {
  name: 'in_app',
  description: 'Show in-app notification',

  async send(input: NotificationInput): Promise<NotificationOutput> {
    console.log(`[IN_APP] Title: ${input.subject}, Body: ${input.body}`);
    return {
      success: true,
      messageId: `inapp-${Date.now()}`,
      deliveredAt: new Date(),
    };
  },

  validate(): { valid: boolean } {
    return { valid: true };
  },
};

/**
 * Strategy registry
 */
export const notificationStrategies = {
  email: emailNotificationStrategy,
  sms: smsNotificationStrategy,
  push: pushNotificationStrategy,
  in_app: inAppNotificationStrategy,
};

/**
 * Get notification strategy by name
 */
export function getNotificationStrategy(
  name: string
): NotificationStrategy | undefined {
  return notificationStrategies[name as keyof typeof notificationStrategies];
}

/**
 * Send notification using specified strategy
 */
export async function sendNotification(
  input: NotificationInput,
  strategyName: keyof typeof notificationStrategies = 'email'
): Promise<NotificationOutput> {
  const strategy = getNotificationStrategy(strategyName);
  if (!strategy) {
    return {
      success: false,
      error: `Unknown notification strategy: ${strategyName}`,
    };
  }

  const validation = strategy.validate(input);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  return strategy.send(input);
}

export default NotificationStrategy;

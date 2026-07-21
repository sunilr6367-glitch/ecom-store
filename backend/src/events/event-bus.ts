/**
 * Event System - Phase 4 Q20: Event System
 *
 * Provides decoupled event-based communication for the application.
 * Supports synchronous and asynchronous event handling with filtering.
 *
 * Usage:
 *   import { eventBus, Events } from './events';
 *
 *   // Subscribe to events
 *   eventBus.on(Events.ORDER_CREATED, (order) => {
 *     console.log('Order created:', order.id);
 *   });
 *
 *   // Emit events
 *   eventBus.emit(Events.ORDER_CREATED, { id: '123', total: 99.99 });
 */

import { z } from 'zod';

/**
 * Event names enum
 */
export enum Events {
  // Order events
  ORDER_CREATED = 'order:created',
  ORDER_UPDATED = 'order:updated',
  ORDER_CANCELLED = 'order:cancelled',
  ORDER_SHIPPED = 'order:shipped',
  ORDER_DELIVERED = 'order:delivered',

  // Product events
  PRODUCT_CREATED = 'product:created',
  PRODUCT_UPDATED = 'product:updated',
  PRODUCT_DELETED = 'product:deleted',
  LOW_STOCK = 'product:low_stock',

  // Customer events
  CUSTOMER_REGISTERED = 'customer:registered',
  CUSTOMER_LOGGED_IN = 'customer:logged_in',
  CUSTOMER_UPDATED = 'customer:updated',

  // Cart events
  CART_UPDATED = 'cart:updated',
  CART_CHECKOUT = 'cart:checkout',

  // Payment events
  PAYMENT_RECEIVED = 'payment:received',
  PAYMENT_FAILED = 'payment:failed',
  REFUND_PROCESSED = 'refund:processed',

  // System events
  USER_LOGGED_IN = 'user:logged_in',
  USER_LOGGED_OUT = 'user:logged_out',
  EMAIL_SENT = 'email:sent',
}

/**
 * Event payload schemas for validation
 */
export const EventSchemas = {
  [Events.ORDER_CREATED]: z.object({
    id: z.string().uuid(),
    customerId: z.string().uuid(),
    total: z.number().positive(),
    items: z.array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().positive(),
      })
    ),
  }),

  [Events.ORDER_CANCELLED]: z.object({
    id: z.string().uuid(),
    reason: z.string().optional(),
    refundAmount: z.number().optional(),
  }),

  [Events.LOW_STOCK]: z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    currentStock: z.number().nonnegative(),
    threshold: z.number().positive(),
  }),

  [Events.CUSTOMER_REGISTERED]: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().optional(),
  }),

  [Events.PAYMENT_RECEIVED]: z.object({
    orderId: z.string().uuid(),
    amount: z.number().positive(),
    method: z.string(),
    transactionId: z.string().optional(),
  }),
};

/**
 * Type for any event payload
 */
export type EventPayload = Record<string, unknown>;

/**
 * Event handler function type
 */
export type EventHandler<T = EventPayload> = (
  payload: T
) => void | Promise<void>;

/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
  /** Filter events by predicate */
  filter?: (payload: EventPayload) => boolean;
  /** Maximum number of times to handle this event (0 = unlimited) */
  maxCalls?: number;
  /** Priority (higher = executed first) */
  priority?: number;
}

/**
 * Event subscription
 */
interface EventSubscription {
  handler: EventHandler;
  options: EventSubscriptionOptions;
  callCount: number;
}

/**
 * Event Bus - Central event management system
 */
export class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private wildcardSubscriptions: EventSubscription[] = [];
  private eventHistory: Array<{
    event: string;
    payload: EventPayload;
    timestamp: Date;
  }> = [];
  private maxHistorySize: number;

  constructor(options: { maxHistorySize?: number } = {}) {
    this.maxHistorySize = options.maxHistorySize || 1000;
  }

  /**
   * Subscribe to an event
   */
  on<T = EventPayload>(
    event: string,
    handler: EventHandler<T>,
    options: EventSubscriptionOptions = {}
  ): () => void {
    const subscription: EventSubscription = {
      handler: handler as EventHandler,
      options: {
        maxCalls: 0,
        priority: 0,
        ...options,
      },
      callCount: 0,
    };

    // Wildcard event
    if (event === '*') {
      this.wildcardSubscriptions.push(subscription);
    } else {
      const existing = this.subscriptions.get(event) || [];
      existing.push(subscription);
      // Sort by priority (descending)
      existing.sort((a, b) => b.options.priority! - a.options.priority!);
      this.subscriptions.set(event, existing);
    }

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to multiple events
   */
  onMany(
    events: string[],
    handler: EventHandler,
    options?: EventSubscriptionOptions
  ): () => void {
    const unsubscribers = events.map((event) =>
      this.on(event, handler, options)
    );
    return () => unsubscribers.forEach((unsub) => unsub());
  }

  /**
   * Subscribe once (only fires once)
   */
  once<T = EventPayload>(event: string, handler: EventHandler<T>): () => void {
    const wrapper = ((payload: T) => {
      handler(payload);
      this.off(event, wrapper);
    }) as EventHandler;
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   */
  off<T = EventPayload>(event: string, handler?: EventHandler<T>): void {
    if (event === '*') {
      this.wildcardSubscriptions = [];
      return;
    }

    const subscriptions = this.subscriptions.get(event);
    if (subscriptions) {
      if (handler) {
        this.subscriptions.set(
          event,
          subscriptions.filter((sub) => sub.handler !== handler)
        );
      } else {
        this.subscriptions.delete(event);
      }
    }
  }

  /**
   * Emit an event synchronously
   */
  async emit<T = EventPayload>(event: string, payload: T): Promise<void> {
    const subscriptions = this.subscriptions.get(event) || [];

    // Validate payload if schema exists
    const schema = EventSchemas[event as keyof typeof EventSchemas];
    if (schema) {
      const result = schema.safeParse(payload);
      if (!result.success) {
        console.warn(
          `[EVENT] Invalid payload for event ${event}:`,
          result.error
        );
      }
    }

    // Store in history
    this.addToHistory(event, payload as EventPayload);

    // Execute handlers
    const promises = subscriptions.map(async (sub) => {
      // Check max calls
      if (sub.options.maxCalls! > 0 && sub.callCount >= sub.options.maxCalls!) {
        return;
      }
      sub.callCount++;

      // Apply filter
      if (sub.options.filter && !sub.options.filter(payload as EventPayload)) {
        return;
      }

      try {
        await (sub.handler as EventHandler<EventPayload>)(
          payload as EventPayload
        );
      } catch (error) {
        console.error(`[EVENT] Handler error for ${event}:`, error);
      }
    });

    // Execute wildcard handlers
    const wildcardPromises = this.wildcardSubscriptions.map(async (sub) => {
      try {
        await sub.handler({ event, ...(payload as object) });
      } catch (error) {
        console.error(`[EVENT] Wildcard handler error:`, error);
      }
    });

    await Promise.all([...promises, ...wildcardPromises]);
  }

  /**
   * Emit event and wait for all handlers (alias for emit)
   */
  async publish<T = EventPayload>(event: string, payload: T): Promise<void> {
    return this.emit(event, payload);
  }

  /**
   * Emit event asynchronously (fire and forget)
   */
  emitAsync<T = EventPayload>(event: string, payload: T): void {
    this.emit(event, payload).catch((error) => {
      console.error(`[EVENT] Async emit error for ${event}:`, error);
    });
  }

  /**
   * Get event history
   */
  getHistory(
    event?: string
  ): Array<{ event: string; payload: EventPayload; timestamp: Date }> {
    if (event) {
      return this.eventHistory.filter((h) => h.event === event);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get subscription count for an event
   */
  getSubscriptionCount(event: string): number {
    return (this.subscriptions.get(event) || []).length;
  }

  /**
   * Add event to history
   */
  private addToHistory(event: string, payload: EventPayload): void {
    this.eventHistory.push({
      event,
      payload,
      timestamp: new Date(),
    });

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Remove all subscriptions
   */
  reset(): void {
    this.subscriptions.clear();
    this.wildcardSubscriptions = [];
    this.eventHistory = [];
  }
}

// Export singleton instance
export const eventBus = new EventBus();

// Helper functions for common operations
export function subscribe<T = EventPayload>(
  event: string,
  handler: EventHandler<T>,
  options?: EventSubscriptionOptions
): () => void {
  return eventBus.on(event, handler, options);
}

export function publish<T = EventPayload>(
  event: string,
  payload: T
): Promise<void> {
  return eventBus.emit(event, payload);
}

export function unsubscribe(event: string): void {
  eventBus.off(event);
}

export default EventBus;

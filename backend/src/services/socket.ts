import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { verify } from 'hono/jwt';
import { and, eq } from 'drizzle-orm';
import { config } from '../config';
import { db } from '../db/client';
import { customers, studio_inquiries } from '../db/schema';

export let io: SocketServer | null = null;

type StudioMessagePayload = {
  id: string;
  sender_type: string;
  sender_name: string | null;
  sender_email?: string | null;
  message: string;
  created_at: Date | string | null;
};

type StudioInquiryPayload = {
  id: string;
  product_title?: string | null;
  product_handle?: string | null;
  inquiry_type?: string | null;
  status?: string | null;
  customer_name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  last_message_at?: Date | string | null;
  unread_by_admin?: boolean | null;
  unread_by_customer?: boolean | null;
  created_at?: Date | string | null;
};

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce<Record<string, string>>((cookies, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) return cookies;
    cookies[rawKey] = decodeURIComponent(rawValue.join('=') || '');
    return cookies;
  }, {});
}

async function isAdminSocket(cookieHeader?: string): Promise<boolean> {
  const token = parseCookies(cookieHeader).admin_token;
  if (!token) return false;

  try {
    const payload = await verify(token, config.jwt.secret, 'HS256') as { role?: string };
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

async function getCustomerSocketEmail(cookieHeader?: string): Promise<string | null> {
  const token = parseCookies(cookieHeader).auth_token;
  if (!token) return null;

  try {
    const payload = await verify(token, config.jwt.secret, 'HS256') as { role?: string; sub?: string };
    if (payload.role !== 'customer' || !payload.sub) return null;
    const [customer] = await db
      .select({ email: customers.email })
      .from(customers)
      .where(eq(customers.id, payload.sub))
      .limit(1);
    return customer?.email ? customer.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

async function canJoinCustomerStudioRoom(inquiryId: string, token: string): Promise<boolean> {
  if (!inquiryId || !token || inquiryId.length > 100 || token.length > 100) return false;

  const [inquiry] = await db
    .select({ conversation_token: studio_inquiries.conversation_token })
    .from(studio_inquiries)
    .where(eq(studio_inquiries.id, inquiryId))
    .limit(1);

  return inquiry?.conversation_token === token;
}

async function canJoinCustomerAccountStudioRoom(inquiryId: string, email: string): Promise<boolean> {
  if (!inquiryId || inquiryId.length > 100) return false;

  const [inquiry] = await db
    .select({ id: studio_inquiries.id })
    .from(studio_inquiries)
    .where(and(eq(studio_inquiries.id, inquiryId), eq(studio_inquiries.email, email)))
    .limit(1);

  return Boolean(inquiry);
}

export function initSocketServer(
  httpServer: HttpServer,
  allowedOrigins: string[]
): SocketServer {
  io = new SocketServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('error', (err) => {
      console.error(`[Socket.io] Socket error (${socket.id}):`, err.message);
    });

    socket.on('subscribe:inventory', ({ variantId }: { variantId: string }) => {
      if (typeof variantId === 'string' && variantId.length < 100) {
        socket.join(`inventory:${variantId}`);
      }
    });

    socket.on('unsubscribe:inventory', ({ variantId }: { variantId: string }) => {
      socket.leave(`inventory:${variantId}`);
    });

    socket.on(
      'subscribe:studio:customer',
      async ({ inquiryId, token }: { inquiryId: string; token: string }) => {
        try {
          const allowed = await canJoinCustomerStudioRoom(inquiryId, token);
          if (!allowed) {
            socket.emit('studio:error', { message: 'Unable to join studio chat' });
            return;
          }
          socket.join(`studio:inquiry:${inquiryId}`);
          socket.emit('studio:subscribed', { inquiryId, role: 'customer' });
        } catch (error) {
          console.error('[Socket.io] Studio customer subscribe error:', error);
          socket.emit('studio:error', { message: 'Unable to join studio chat' });
        }
      }
    );

    socket.on(
      'subscribe:studio:customer-account',
      async ({ inquiryId }: { inquiryId: string }) => {
        try {
          const email = await getCustomerSocketEmail(socket.handshake.headers.cookie);
          const allowed = email ? await canJoinCustomerAccountStudioRoom(inquiryId, email) : false;
          if (!allowed) {
            socket.emit('studio:error', { message: 'Unable to join studio chat' });
            return;
          }
          socket.join(`studio:inquiry:${inquiryId}`);
          socket.emit('studio:subscribed', { inquiryId, role: 'customer' });
        } catch (error) {
          console.error('[Socket.io] Studio account subscribe error:', error);
          socket.emit('studio:error', { message: 'Unable to join studio chat' });
        }
      }
    );

    socket.on('subscribe:studio:customer-inbox', async () => {
      const email = await getCustomerSocketEmail(socket.handshake.headers.cookie);
      if (!email) {
        socket.emit('studio:error', { message: 'Unable to join studio inbox' });
        return;
      }
      socket.join(`studio:customer:${email}`);
      socket.emit('studio:subscribed', { role: 'customer-inbox' });
    });

    socket.on(
      'subscribe:studio:admin',
      async ({ inquiryId }: { inquiryId?: string } = {}) => {
        const admin = await isAdminSocket(socket.handshake.headers.cookie);
        if (!admin) {
          socket.emit('studio:error', { message: 'Admin chat access required' });
          return;
        }

        socket.join('studio:admin');
        if (inquiryId && inquiryId.length < 100) {
          socket.join(`studio:inquiry:${inquiryId}`);
        }
        socket.emit('studio:subscribed', { inquiryId: inquiryId || null, role: 'admin' });
      }
    );

    socket.on('unsubscribe:studio', ({ inquiryId }: { inquiryId?: string } = {}) => {
      if (inquiryId) socket.leave(`studio:inquiry:${inquiryId}`);
      socket.leave('studio:admin');
    });

    socket.on(
      'studio:typing',
      ({ inquiryId, senderType, isTyping }: { inquiryId: string; senderType: 'customer' | 'admin'; isTyping: boolean }) => {
        if (typeof inquiryId !== 'string' || inquiryId.length > 100) return;
        socket.to(`studio:inquiry:${inquiryId}`).emit('studio:typing', {
          inquiryId,
          senderType,
          isTyping: Boolean(isTyping),
          timestamp: new Date().toISOString(),
        });
      }
    );

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  io.on('error', (err) => {
    console.error('[Socket.io] Server error:', err.message);
  });

  console.log('[Socket.io] Server initialized');
  return io;
}

/**
 * Broadcast a real-time inventory update to all clients subscribed to a variant.
 * Call this whenever inventory_quantity changes (e.g. after an order is placed).
 */
export function broadcastInventoryUpdate(
  variantId: string,
  productId: string,
  quantity: number
): void {
  io?.to(`inventory:${variantId}`).emit('inventory:update', {
    variantId,
    productId,
    quantity,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastStudioMessage(
  inquiryId: string,
  message: StudioMessagePayload,
  inquiry?: StudioInquiryPayload
): void {
  const payload = {
    inquiryId,
    message: {
      ...message,
      created_at: message.created_at instanceof Date ? message.created_at.toISOString() : message.created_at,
    },
    inquiry: inquiry
      ? {
          ...inquiry,
          last_message_at:
            inquiry.last_message_at instanceof Date
              ? inquiry.last_message_at.toISOString()
              : inquiry.last_message_at,
          created_at:
            inquiry.created_at instanceof Date
              ? inquiry.created_at.toISOString()
              : inquiry.created_at,
        }
      : undefined,
  };

  io?.to(`studio:inquiry:${inquiryId}`).emit('studio:message', payload);
  io?.to('studio:admin').emit('studio:inquiry-updated', payload);
  if (inquiry?.email) {
    io?.to(`studio:customer:${inquiry.email.toLowerCase()}`).emit('studio:inquiry-updated', payload);
  }
}

export function broadcastStudioInquiryCreated(inquiry: StudioInquiryPayload): void {
  io?.to('studio:admin').emit('studio:inquiry-created', {
    inquiry: {
      ...inquiry,
      last_message_at:
        inquiry.last_message_at instanceof Date
          ? inquiry.last_message_at.toISOString()
          : inquiry.last_message_at,
      created_at:
        inquiry.created_at instanceof Date ? inquiry.created_at.toISOString() : inquiry.created_at,
    },
  });
}

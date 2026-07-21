import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { wholesale_inquiries, customers } from '../db/schema';
import { eq, desc, and, or, like, sql } from 'drizzle-orm';
import { verifyAdmin } from '../middleware/auth';
import { emailService } from '../services/email-service';
import { sanitizeSearchInput } from '../utils/validation';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const app = new Hono();

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

// Validation schema for creating wholesale inquiry
const createInquirySchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  contact_name: z.string().min(2, 'Contact name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number must be at least 5 characters'),
  country: z.string().min(2, 'Country is required'),
  business_type: z.enum([
    'boutique',
    'online',
    'distributor',
    'chain',
    'other',
  ]),
  estimated_order_volume: z
    .enum(['50-100', '100-200', '200-500', '500+'])
    .optional(),
  message: z.string().optional(),
});

// Validation schema for updating inquiry status
const updateInquirySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  discount_tier: z.enum(['starter', 'growth', 'enterprise']).optional(),
  admin_notes: z.string().optional(),
});

// PUBLIC: Submit wholesale inquiry (no auth required)
app.post('/', zValidator('json', createInquirySchema), async (c) => {
  try {
    const data = c.req.valid('json');

    const [inquiry] = await db
      .insert(wholesale_inquiries)
      .values({
        ...data,
        status: 'pending',
      })
      .returning();

    // Send email notifications - await to ensure delivery
    try {
      await Promise.all([
        emailService.sendInquiryReceived({
          email: inquiry.email,
          contact_name: inquiry.contact_name,
        }),
        emailService.sendNewInquiryAlert(inquiry),
      ]);
    } catch (emailError) {
      // Log but don't fail the request - inquiry was saved successfully
      console.error('Error sending inquiry notification emails:', emailError);
    }

    return c.json(
      {
        success: true,
        inquiry: {
          id: inquiry.id,
          status: inquiry.status,
          created_at: inquiry.created_at,
        },
      },
      201
    );
  } catch (error: any) {
    console.error('Error creating wholesale inquiry:', error);
    return c.json({ error: 'Failed to submit inquiry' }, 500);
  }
});

// ADMIN: Get all wholesale inquiries
app.get('/', verifyAdmin, async (c) => {
  try {
    const { status, search, page = '1', limit = '20' } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    // Build conditions
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(wholesale_inquiries.status, status as any));
    }

    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      if (sanitizedSearch) {
        const pattern = `%${sanitizedSearch}%`;
        conditions.push(
          or(
            like(wholesale_inquiries.company_name, pattern),
            like(wholesale_inquiries.email, pattern),
            like(wholesale_inquiries.contact_name, pattern)
          )
        );
      }
    }

    // BUG-017 FIX: Build where clause first, then apply to both queries
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const inquiries = await db
      .select()
      .from(wholesale_inquiries)
      .where(whereClause)
      .orderBy(desc(wholesale_inquiries.created_at))
      .limit(limitNum)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(wholesale_inquiries)
      .where(whereClause);
    const count = Number(countResult?.count) || 0;
    const totalPages = Math.ceil(count / limitNum);

    return c.json({
      inquiries: inquiries || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching wholesale inquiries:', error);
    return c.json(
      {
        error: 'Failed to fetch inquiries',
        details: error.message,
      },
      500
    );
  }
});

// ADMIN: Get wholesale stats
app.get('/stats/overview', verifyAdmin, async (c) => {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where status = 'pending')`,
        approved: sql<number>`count(*) filter (where status = 'approved')`,
        rejected: sql<number>`count(*) filter (where status = 'rejected')`,
      })
      .from(wholesale_inquiries);

    return c.json({
      total: Number(stats.total),
      pending: Number(stats.pending),
      approved: Number(stats.approved),
      rejected: Number(stats.rejected),
    });
  } catch (error: any) {
    console.error('Error fetching wholesale stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// ADMIN: Get single wholesale inquiry
app.get('/:id', verifyAdmin, async (c) => {
  try {
    const { id } = c.req.param();

    const [inquiry] = await db
      .select()
      .from(wholesale_inquiries)
      .where(eq(wholesale_inquiries.id, id));

    if (!inquiry) {
      return c.json({ error: 'Inquiry not found' }, 404);
    }

    return c.json({ inquiry });
  } catch (error: any) {
    console.error('Error fetching wholesale inquiry:', error);
    return c.json({ error: 'Failed to fetch inquiry' }, 500);
  }
});

// ADMIN: Update wholesale inquiry
app.patch(
  '/:id',
  verifyAdmin,
  zValidator('json', updateInquirySchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const data = c.req.valid('json');

      const updateData: any = {
        ...data,
        updated_at: new Date(),
      };

      // If status is being updated, record review time
      if (data.status && data.status !== 'pending') {
        updateData.reviewed_at = new Date();
        // In a real app, we'd add reviewed_by from c.get('user')
      }

      const [updated] = await db
        .update(wholesale_inquiries)
        .set(updateData)
        .where(eq(wholesale_inquiries.id, id))
        .returning();

      if (!updated) {
        return c.json({ error: 'Inquiry not found' }, 404);
      }

      // Handle Status Change Emails
      if (data.status) {
        if (data.status === 'approved') {
          // Check if customer already exists
          const existingCustomer = await db
            .select()
            .from(customers)
            .where(eq(customers.email, updated.email.toLowerCase()))
            .limit(1);

          let customerAccountCreated = false;

          if (existingCustomer.length === 0) {
            // Create new customer account for wholesale
            const verificationToken = generateVerificationToken();
            const verificationExpires = getVerificationExpiry();

            await db.insert(customers).values({
              email: updated.email.toLowerCase(),
              first_name: updated.contact_name,
              last_name: '', // Will be updated by customer
              phone: updated.phone,
              has_account: true,
              password_hash: '', // Will be set by customer via token
              verification_token: verificationToken,
              verification_expires_at: verificationExpires,
              email_verified: true, // Auto-verify since inquiry was approved
              metadata: {
                wholesale_customer: true,
                company_name: updated.company_name,
                discount_tier: updated.discount_tier,
                wholesale_inquiry_id: updated.id,
              },
            });

            customerAccountCreated = true;

            // Send welcome email with password setup link
            emailService
              .sendWholesaleWelcome({
                email: updated.email,
                contact_name: updated.contact_name,
                company_name: updated.company_name,
                discount_tier: updated.discount_tier || 'starter',
                token: verificationToken,
              })
              .catch((e: Error) =>
                console.error('Failed to send welcome email:', e)
              );
          } else {
            // Update existing customer with wholesale info
            await db
              .update(customers)
              .set({
                has_account: true,
                metadata: {
                  ...((existingCustomer[0].metadata as Record<string, any>) ||
                    {}),
                  wholesale_customer: true,
                  company_name: updated.company_name,
                  discount_tier: updated.discount_tier,
                  wholesale_inquiry_id: updated.id,
                },
              })
              .where(eq(customers.id, existingCustomer[0].id));

            // Send email about wholesale account activation
            emailService
              .sendInquiryApproved({
                email: updated.email,
                contact_name: updated.contact_name,
                company_name: updated.company_name,
                discount_tier: updated.discount_tier || 'starter',
              })
              .catch((e: Error) => console.error(e));
          }

          // Send the approval email
          emailService
            .sendInquiryApproved({
              email: updated.email,
              contact_name: updated.contact_name,
              company_name: updated.company_name,
              discount_tier: updated.discount_tier || 'starter',
            })
            .catch((e: Error) => console.error(e));

          return c.json({
            inquiry: updated,
            customerAccountCreated,
            message: customerAccountCreated
              ? 'Customer account created and welcome email sent'
              : 'Wholesale access granted to existing account',
          });
        } else if (data.status === 'rejected') {
          emailService
            .sendInquiryRejected({
              email: updated.email,
              contact_name: updated.contact_name,
              company_name: updated.company_name,
              admin_notes: updated.admin_notes || undefined,
            })
            .catch((e: Error) => console.error(e));
        }
      }

      return c.json({ inquiry: updated });
    } catch (error: any) {
      console.error('Error updating wholesale inquiry:', error);
      return c.json({ error: 'Failed to update inquiry' }, 500);
    }
  }
);

// ADMIN: Delete wholesale inquiry
app.delete('/:id', verifyAdmin, async (c) => {
  try {
    const { id } = c.req.param();

    const [deleted] = await db
      .delete(wholesale_inquiries)
      .where(eq(wholesale_inquiries.id, id))
      .returning();

    if (!deleted) {
      return c.json({ error: 'Inquiry not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting wholesale inquiry:', error);
    return c.json({ error: 'Failed to delete inquiry' }, 500);
  }
});

export default app;

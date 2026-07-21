import { db } from '../db/client';
import { customers, orders, addresses } from '../db/schema';
import { eq, desc, ilike, or, sql, and, inArray } from 'drizzle-orm';
import { z } from 'zod';

function sanitizeCustomerSearchInput(input: string, maxLen = 100): string {
  return String(input)
    .replace(/[%_\\]/g, '')
    .replace(/[;]/g, '')
    .trim()
    .substring(0, maxLen);
}

export const UpdateCustomerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
});

const CUSTOMER_SORT_MAP: Record<
  string,
  (typeof customers)[keyof typeof customers]
> = {
  created_at: customers.created_at,
  updated_at: customers.updated_at,
  email: customers.email,
  first_name: customers.first_name,
  last_name: customers.last_name,
  phone: customers.phone,
};

// Types
export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  has_account?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

class CustomerService {
  async list(filters: CustomerFilters) {
    const {
      page = 1,
      limit = 20,
      search = '',
      has_account = '',
      sort_by = 'created_at',
      sort_order = 'desc',
    } = filters;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (search) {
      const sanitizedSearch = sanitizeCustomerSearchInput(search);
      if (sanitizedSearch) {
        const pattern = `%${sanitizedSearch}%`;
        conditions.push(
          or(
            ilike(customers.email, pattern),
            ilike(customers.first_name, pattern),
            ilike(customers.last_name, pattern),
            ilike(customers.phone, pattern)
          )
        );
      }
    }

    if (has_account === 'true')
      conditions.push(eq(customers.has_account, true));
    else if (has_account === 'false')
      conditions.push(eq(customers.has_account, false));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereClause);

    // Get customers
    const customersList = await db
      .select({
        id: customers.id,
        email: customers.email,
        first_name: customers.first_name,
        last_name: customers.last_name,
        phone: customers.phone,
        has_account: customers.has_account,
        created_at: customers.created_at,
        updated_at: customers.updated_at,
      })
      .from(customers)
      .where(whereClause)
      .orderBy(
        (() => {
          const col = CUSTOMER_SORT_MAP[sort_by] ?? customers.created_at;
          return sort_order === 'asc' ? sql`${col} asc` : sql`${col} desc`;
        })()
      )
      .limit(limit)
      .offset(offset);

    // Get order counts for each customer
    const customerIds = customersList.map((c) => c.id);
    const orderCounts =
      customerIds.length > 0
        ? await db
            .select({
              customer_id: orders.customer_id,
              order_count: sql<number>`count(*)`,
              total_spent: sql<number>`sum(${orders.total})`,
            })
            .from(orders)
            .where(sql`${inArray(orders.customer_id, customerIds)} AND ${orders.status} IN ('completed', 'delivered')`)
            .groupBy(orders.customer_id)
        : [];

    // Merge order data with customers
    const customersWithStats = customersList.map((customer) => {
      const stats = orderCounts.find((oc) => oc.customer_id === customer.id);
      return {
        ...customer,
        order_count: stats?.order_count || 0,
        total_spent: stats?.total_spent || 0,
      };
    });

    return {
      customers: customersWithStats,
      pagination: {
        page: page,
        limit: limit,
        total: Number(count),
        total_pages: Math.ceil(Number(count) / limit),
      },
    };
  }

  async getById(id: string) {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    if (!customer) return null;

    const customerAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.customer_id, id));
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customer_id, id))
      .orderBy(desc(orders.created_at));

    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders
      .filter(o => ['completed', 'delivered'].includes(o.status))
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    return {
      customer,
      addresses: customerAddresses,
      orders: customerOrders,
      stats: {
        total_orders: totalOrders,
        total_spent: totalSpent,
        average_order_value: averageOrderValue,
        last_order_date: customerOrders[0]?.created_at || null,
      },
    };
  }

  async getOrders(id: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customer_id, id))
      .orderBy(desc(orders.created_at))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.customer_id, id));

    return {
      orders: customerOrders,
      pagination: {
        page,
        limit,
        total: Number(count),
        total_pages: Math.ceil(Number(count) / limit),
      },
    };
  }

  async update(
    id: string,
    data: Partial<{
      first_name: string;
      last_name: string;
      phone: string;
      email: string;
    }>
  ) {
    const [updated] = await db
      .update(customers)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    return updated;
  }

  async delete(id: string) {
    // Validation check for orders
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customer_id, id));
    if (customerOrders.length > 0) {
      throw new Error(
        'Cannot delete customer with existing orders. Consider deactivating instead.'
      );
    }

    // Delete dependencies
    await db.delete(addresses).where(eq(addresses.customer_id, id));
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }

  async getStats() {
    const [{ total_customers }] = await db
      .select({ total_customers: sql<number>`count(*)` })
      .from(customers);
    const [{ customers_with_accounts }] = await db
      .select({ customers_with_accounts: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.has_account, true));

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const [{ new_this_month }] = await db
      .select({ new_this_month: sql<number>`count(*)` })
      .from(customers)
      .where(sql`${customers.created_at} >= ${firstDayOfMonth.toISOString()}`);
    const [{ customers_with_orders }] = await db
      .select({
        customers_with_orders: sql<number>`count(distinct ${orders.customer_id})`,
      })
      .from(orders);

    return {
      total_customers: Number(total_customers),
      customers_with_accounts: Number(customers_with_accounts),
      guest_customers:
        Number(total_customers) - Number(customers_with_accounts),
      new_this_month: Number(new_this_month),
      customers_with_orders: Number(customers_with_orders),
    };
  }
}

export const customerService = new CustomerService();

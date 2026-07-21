import { Hono } from 'hono';
import { analyticsService } from '../services/analytics-service';
import { verifyAdminOrMcpService } from '../middleware/auth'; // BUG-014 FIX: was verifyAuth

const analyticsRouter = new Hono();

// GET /analytics/overview
analyticsRouter.get('/overview', verifyAdminOrMcpService, async (c) => {
  try {
    const overview = await analyticsService.getOverview();
    return c.json(overview);
  } catch (error: unknown) {
    console.error('Error fetching analytics overview:', error);
    return c.json({ error: 'Failed to fetch overview' }, 500);
  }
});

// GET /analytics/sales-trend
analyticsRouter.get('/sales-trend', verifyAdminOrMcpService, async (c) => {
  // OPT-005: Validate and clamp days parameter
  const rawDays = c.req.query('days') ? parseInt(c.req.query('days')!) : 30;
  const days = Math.max(1, Math.min(365, isNaN(rawDays) ? 30 : rawDays));
  try {
    const trend = await analyticsService.getSalesTrend(days);
    return c.json(trend);
  } catch (error: unknown) {
    console.error('Error fetching sales trend:', error);
    return c.json({ error: 'Failed to fetch sales trend' }, 500);
  }
});

// GET /analytics/orders-by-status
analyticsRouter.get('/orders-by-status', verifyAdminOrMcpService, async (c) => {
  try {
    const statusData = await analyticsService.getOrdersByStatus();
    return c.json(statusData);
  } catch (error: unknown) {
    console.error('Error fetching orders by status:', error);
    return c.json({ error: 'Failed to fetch orders by status' }, 500);
  }
});

export default analyticsRouter;

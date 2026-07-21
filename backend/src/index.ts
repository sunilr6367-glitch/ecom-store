import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { csrf } from 'hono/csrf';
import {
  adminAuthLimiter,
  contactLimiter,
  customerAuthLimiter,
  checkoutLimiter,
  newsletterLimiter,
  generalLimiter,
  restockLimiter,
  studioInquiryLimiter,
  trackingLimiter,
  verificationLookupLimiter,
} from './middleware/rate-limiter';
import {
  defaultTimeout,
  uploadTimeout,
  webhookTimeout,
} from './middleware/timeout';
import 'dotenv/config';

// Import db and test connection
import { healthCheck } from './db/client';

// Import error handler
import { errorHandler } from './middleware/error-handler';
import { successResponse, errorResponse } from './utils/api-response';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import regionRoutes from './routes/regions';
import uploadRoutes from './routes/upload';
import customersRouter from './routes/customers';
import settingsRoutes from './routes/settings';
import marketingRoutes from './routes/marketing';
import bannerRoutes from './routes/banners';
import homepageBannersRoutes from './routes/homepage-banners';
import postRoutes from './routes/posts';
import pageRoutes from './routes/pages';
import categoriesRoutes from './routes/categories';
import tagsRoutes from './routes/tags';
import collectionsRoutes from './routes/collections';
import redirectsRoutes from './routes/redirects';
import testimonialsRoutes from './routes/testimonials';
import seoRoutes from './routes/seo';
import searchRoutes from './routes/search';
import merchantRoutes from './routes/merchant';
import artisansRoutes from './routes/artisans';

import analyticsRoutes from './routes/analytics';
import auth2faRoutes from './routes/auth-2fa';
import storeAuthRoutes from './routes/store/auth';
import { checkoutAuthRouter } from './routes/store/checkout-auth';
import storeCustomersRouter from './routes/store/customers';
import storeOrdersRouter from './routes/store/orders';
import checkoutRoutes from './routes/store/checkout';
import paymentRoutes from './routes/store/payments';
import razorpayRoutes from './routes/store/payments-razorpay';
import paypalRoutes from './routes/store/payments-paypal';
import wholesaleRoutes from './routes/wholesale';
import wholesaleCustomersRoutes from './routes/wholesale-customers';
import wholesalePricingRoutes from './routes/store/wholesale-pricing';
import wholesaleOrdersRoutes from './routes/store/wholesale-orders';
import storeSettingsRoutes from './routes/store/settings';
import adminWholesaleOrdersRoutes from './routes/admin/wholesale-orders';
import adminTiersRoutes from './routes/admin/tiers';
import adminNotificationsRoutes from './routes/admin/notifications';
import whatsappRoutes from './routes/admin/whatsapp';
import reviewsRoutes from './routes/reviews';
import contactRoutes from './routes/contact';
import newsletterRoutes from './routes/newsletter';
import cartRoutes from './routes/store/cart';
import backInStockRoutes from './routes/store/back-in-stock';
import storeStudioInquiriesRoutes from './routes/store/studio-inquiries';
import wishlistRoutes from './routes/store/wishlist';
import adminBisRoutes from './routes/admin/back-in-stock';
import adminStudioInquiriesRoutes from './routes/admin/studio-inquiries';
import adminReturnsRoutes from './routes/admin/returns';
import storeReturnsRoutes from './routes/store/returns';
import abandonedCartsRoutes from './routes/admin/abandoned-carts';
import bulkDiscountsRoutes from './routes/admin/bulk-discounts';
import adminContactsRoutes from './routes/admin/contacts';
import adminSecurityEventsRoutes from './routes/admin/security-events';
import adminHeroBannersRoutes from './routes/admin/hero-banners';
import heroBannersRoutes from './routes/hero-banners';
import adminTrendingReelsRoutes from './routes/admin/trending-reels';
import trendingReelsRoutes from './routes/trending-reels';
import adminReelCollectionsRoutes from './routes/admin/reel-collections';
import reelCollectionsRoutes from './routes/reel-collections';
import adminHomepageCategoriesRoutes from './routes/admin/homepage-categories';
import homepageCategoriesRoutes from './routes/homepage-categories';
import adminHomepageBannersRoutes from './routes/admin/homepage-banners';
import adminCategoryCirclesRoutes from './routes/admin/category-circles';
import adminFeaturedProductsRoutes from './routes/admin/featured-products';
import adminTrustItemsRoutes from './routes/admin/trust-items';
import categoryCirclesRoutes from './routes/category-circles';
import featuredProductsRoutes from './routes/featured-products';
import trustItemsRoutes from './routes/trust-items';
import homepageMerchandisingRoutes from './routes/homepage-merchandising';
import homepageRoutes from './routes/homepage';
import adminHomepageSocialPostsRoutes from './routes/admin/homepage-social-posts';

import docsApp from './docs';
import { initSocketServer, io } from './services/socket';
import { startSeoCronScheduler, stopSeoCronScheduler } from './cron';

const app = new Hono();

// 🕵️‍♂️ TRACER: Log every request to confirm frontend-backend communication (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use('*', async (c, next) => {
    const method = c.req.method;
    const path = c.req.path.split('?')[0]; // Mask query params
    const traceId = c.req.header('x-debug-trace') || 'NONE';

    console.log(
      `[TRACER] ${method} ${path} | Trace-ID: ${traceId} | Time: ${new Date().toISOString()}`
    );

    if (traceId !== 'NONE') {
      console.log(
        `[TRACER] ✅ MATCH! Request received from frontend with ID: ${traceId}`
      );
    }

    await next();
  });
}

// Serve uploaded files as static assets (no auth required)
app.use('/uploads/*', serveStatic({ root: '/app' }));

// Security & Logging Middleware
app.use('*', secureHeaders());
app.use('*', logger());

// OPT-004: Request timeout for all routes (30s default)
app.use('*', defaultTimeout);
// Extended timeout for file uploads and webhooks
app.use('/upload/*', uploadTimeout);
app.use('/store/payments/webhook', webhookTimeout);
app.use('/store/payments/razorpay/webhook', webhookTimeout);
app.use('/store/payments/paypal/webhook', webhookTimeout);

// CORS Configuration
// In production set ALLOWED_ORIGINS in backend/.env.production, e.g.:
//   ALLOWED_ORIGINS=https://odhvica.com,https://www.odhvica.com,https://admin.odhvica.com
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins =
  process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean) ||
  (isProd
    ? ['https://odhvica.com', 'https://www.odhvica.com', 'https://admin.odhvica.com']
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:4000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:4000',
      ]);
app.use(
  '*',
  cors({
    origin: allowedOrigins,
    credentials: true, // Required for httpOnly cookies
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'x-debug-trace',
    ],
    exposeHeaders: ['Set-Cookie'], // Allow frontend to receive cookies
  })
);

// 🔒 FIX-004 & FIX-002: CSRF Protection for state-changing operations
// CSRF middleware validates Origin header against allowed origins
// This prevents cross-site request forgery attacks
const csrfProtection = csrf({
  origin: allowedOrigins,
});

// Helper to apply CSRF only to state-changing HTTP methods
const csrfForStateChanging = (routes: string[]) => {
  for (const route of routes) {
    // Apply CSRF middleware to the route - it will check all methods
    // but the browser only sends Origin header for cross-origin requests
    app.use(route, csrfProtection);
  }
};

// Store Routes - Customer checkout and payments (state-changing only)
// Note: Webhooks are EXCLUDED — they are server-to-server with signature verification
csrfForStateChanging([
  '/store/checkout/*',
  '/store/payments/create-intent',
  '/store/payments/status/*',
  '/store/payments/razorpay/create-order',
  '/store/payments/razorpay/verify',
  '/store/payments/paypal/create-order',
  '/store/payments/paypal/capture',
]);

// 🔒 FIX-002: CSRF Protection for Admin Routes
// Protect all admin state-changing operations
// Note: Webhooks (/store/payments/webhook) are EXCLUDED - protected by Stripe signatures
csrfForStateChanging([
  '/products/*',
  '/orders/*',
  '/customers/*',
  '/settings/*',
  '/marketing/*',
  '/banners/*',
  '/posts/*',
  '/pages/*',
  '/categories/*',
  '/tags/*',
  '/collections/*',
  '/seo/*',
  '/search/*',
  '/merchant/*',
  '/artisans/*',
  '/wholesale/*',
  '/reviews/*',
  '/testimonials/*',
  '/upload/*',
  '/auth/2fa/*',
  '/admin/abandoned-carts/*',
  '/admin/bulk-discounts/*',
  '/admin/hero-banners',
  '/admin/hero-banners/*',
  '/admin/trending-reels',
  '/admin/trending-reels/*',
  '/admin/reel-collections',
  '/admin/reel-collections/*',
  '/admin/homepage-categories',
  '/admin/homepage-categories/*',
  '/admin/homepage-banners',
  '/admin/homepage-banners/*',
  '/admin/category-circles',
  '/admin/category-circles/*',
  '/admin/featured-products',
  '/admin/featured-products/*',
  '/admin/studio-inquiries',
  '/admin/studio-inquiries/*',
]);

// Health Check Endpoint
app.get('/health', async (c) => {
  const dbHealthy = await healthCheck(1, 0);
  const status = dbHealthy ? 200 : 503;

  return successResponse(
    c,
    {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      database: dbHealthy ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      gitSha: process.env.APP_GIT_SHA || 'unknown',
      timestamp: new Date().toISOString(), // OPT-008: Add timestamp for monitoring
    },
    dbHealthy ? 'Service is healthy' : 'Service is experiencing issues',
    status
  );
});

// API Info Endpoint
app.get('/', (c) => {
  return successResponse(
    c,
    {
      name: 'Odhvica API',
      version: '1.0.0',
      description: 'E-commerce platform API',
      documentation: '/api/docs',
      endpoints: {
        auth: '/auth',
        products: '/products',
        orders: '/orders',
        customers: '/customers',
        store: '/store',
      },
    },
    'Welcome to Odhvica API'
  );
});

// Rate Limiting Configuration (Tiered)
// 1. Admin auth limits
// Keep strict limits on credential/2FA attempts, but do not apply them to
// /auth/me. The admin shell checks /auth/me on every protected page load, and
// rate-limiting that session check can bounce active admins back to login.
app.use('/auth/login', adminAuthLimiter);
app.use('/auth/register', adminAuthLimiter);
app.use('/auth/2fa/*', adminAuthLimiter);

// 2. Customer auth and verification limits
app.use('/store/auth/login', customerAuthLimiter);
app.use('/store/auth/register', customerAuthLimiter);
app.use('/store/auth/setup-password', customerAuthLimiter);
app.use('/store/auth/verify-email', customerAuthLimiter);
app.use('/store/auth/resend-verification', customerAuthLimiter);
app.use('/store/auth/social/*', customerAuthLimiter);
app.use('/store/auth/verification-status', verificationLookupLimiter);

// 3. Checkout & Payment Limits
app.use('/store/checkout/*', checkoutLimiter);
app.use('/store/payments/*', checkoutLimiter);

// 4. Public form and lookup limits
app.use('/contact', contactLimiter);
app.use('/contact/*', contactLimiter);
app.use('/newsletter', newsletterLimiter);
app.use('/newsletter/*', newsletterLimiter);
app.use('/store/studio-inquiries', studioInquiryLimiter);
app.use('/store/studio-inquiries/*', studioInquiryLimiter);
app.use('/store/back-in-stock', restockLimiter);
app.use('/store/back-in-stock/*', restockLimiter);
app.use('/store/orders/track', trackingLimiter);
app.use('/store/orders/track/*', trackingLimiter);

// 5. General API Limits
const generalApiRoutes = [
  '/products/*',
  '/orders/*',
  '/customers/*',
  '/regions/*',
  '/upload/*',
  '/settings/*',
  '/marketing/*',
  '/banners/*',
  '/posts/*',
  '/pages/*',
  '/categories/*',
  '/tags/*',
  '/collections/*',
  '/seo/*',
  '/search/*',
  '/merchant/*',
  '/artisans/*',
  '/analytics/*',
  '/wholesale/*',
  '/reviews/*',
  '/testimonials/*',
  '/store/orders',
  '/store/orders/*',
  '/store/cart',
  '/store/cart/*',
  '/store/back-in-stock',
  '/store/back-in-stock/*',
  '/store/settings',
  '/store/settings/*',
  '/store/wishlist',
  '/store/wishlist/*',
  '/store/customers/*', // OPT-007: Added missing store customer route
  '/admin/abandoned-carts/*',
  '/admin/bulk-discounts/*',
  '/admin/hero-banners',
  '/admin/hero-banners/*',
  '/hero-banners',
  '/hero-banners/*',
  '/admin/trending-reels',
  '/admin/trending-reels/*',
  '/trending-reels',
  '/trending-reels/*',
  '/reel-collections',
  '/reel-collections/*',
  '/admin/reel-collections',
  '/admin/reel-collections/*',
  '/admin/homepage-categories',
  '/admin/homepage-categories/*',
  '/homepage-categories',
  '/homepage-categories/*',
  '/homepage-banners',
  '/homepage-banners/*',
  '/category-circles',
  '/category-circles/*',
  '/featured-products',
  '/featured-products/*',
  '/homepage-merchandising',
  '/homepage-merchandising/*',
  '/homepage',
  '/admin/homepage-social-posts',
  '/admin/homepage-social-posts/*',
  '/admin/homepage-banners',
  '/admin/homepage-banners/*',
  '/admin/category-circles',
  '/admin/category-circles/*',
  '/admin/featured-products',
  '/admin/featured-products/*',
  '/admin/studio-inquiries',
  '/admin/studio-inquiries/*',
  '/admin/contacts',
  '/admin/contacts/*',
  '/admin/security-events',
  '/admin/security-events/*',
];

for (const route of generalApiRoutes) {
  app.use(route, generalLimiter);
}

// API Routes
app.route('/auth', authRoutes);
app.route('/products', productRoutes);
app.route('/orders', orderRoutes);
app.route('/regions', regionRoutes);
app.route('/upload', uploadRoutes);
app.route('/customers', customersRouter);
app.route('/settings', settingsRoutes);
app.route('/marketing', marketingRoutes);
app.route('/banners', bannerRoutes);
app.route('/homepage-banners', homepageBannersRoutes);
app.route('/posts', postRoutes);
app.route('/pages', pageRoutes);
app.route('/categories', categoriesRoutes);
app.route('/tags', tagsRoutes);
app.route('/collections', collectionsRoutes);
app.route('/seo', seoRoutes);
app.route('/search', searchRoutes);
app.route('/merchant', merchantRoutes);
app.route('/artisans', artisansRoutes);
app.route('/redirects', redirectsRoutes);
app.route('/testimonials', testimonialsRoutes);

app.route('/analytics', analyticsRoutes);
app.route('/auth/2fa', auth2faRoutes);

// Wholesale Routes
app.route('/wholesale', wholesaleRoutes);
app.route('/wholesale-customers', wholesaleCustomersRoutes);
app.route('/admin/wholesale', adminWholesaleOrdersRoutes);
app.route('/admin/wholesale-orders', adminWholesaleOrdersRoutes);
app.route('/admin/tiers', adminTiersRoutes);
app.route('/admin/notifications', adminNotificationsRoutes);
app.route('/admin/whatsapp', whatsappRoutes);

// Contact Form Route
app.route('/contact', contactRoutes);
app.route('/admin/contacts', adminContactsRoutes);
app.route('/admin/security-events', adminSecurityEventsRoutes);

// Newsletter Route
app.route('/newsletter', newsletterRoutes);

// Store Routes (Customer-facing)
app.route('/store/auth', storeAuthRoutes);
app.route('/store/checkout/auth', checkoutAuthRouter);
app.route('/store/customers', storeCustomersRouter);
app.route('/store/orders', storeOrdersRouter);
app.route('/store/checkout', checkoutRoutes);
app.route('/store/payments', paymentRoutes);
app.route('/store/payments/razorpay', razorpayRoutes);
app.route('/store/payments/paypal', paypalRoutes);
app.route('/store/wholesale', wholesalePricingRoutes);
app.route('/store/wholesale', wholesaleOrdersRoutes);
app.route('/store/settings', storeSettingsRoutes);
app.route('/store/cart', cartRoutes);
app.route('/store/back-in-stock', backInStockRoutes);
app.route('/store/studio-inquiries', storeStudioInquiriesRoutes);
app.route('/store/wishlist', wishlistRoutes);
app.route('/admin/back-in-stock', adminBisRoutes);
app.route('/admin/studio-inquiries', adminStudioInquiriesRoutes);
app.route('/admin/returns', adminReturnsRoutes);
app.route('/store/returns', storeReturnsRoutes);
app.route('/admin/abandoned-carts', abandonedCartsRoutes);
app.route('/admin/bulk-discounts', bulkDiscountsRoutes);
app.route('/admin/hero-banners', adminHeroBannersRoutes);
app.route('/hero-banners', heroBannersRoutes);
app.route('/admin/trending-reels', adminTrendingReelsRoutes);
app.route('/trending-reels', trendingReelsRoutes);
app.route('/admin/reel-collections', adminReelCollectionsRoutes);
app.route('/reel-collections', reelCollectionsRoutes);
app.route('/admin/homepage-categories', adminHomepageCategoriesRoutes);
app.route('/homepage-categories', homepageCategoriesRoutes);
app.route('/admin/homepage-banners', adminHomepageBannersRoutes);
app.route('/admin/category-circles', adminCategoryCirclesRoutes);
app.route('/admin/featured-products', adminFeaturedProductsRoutes);
app.route('/admin/trust-items', adminTrustItemsRoutes);
app.route('/category-circles', categoryCirclesRoutes);
app.route('/featured-products', featuredProductsRoutes);
app.route('/trust-items', trustItemsRoutes);
app.route('/homepage-merchandising', homepageMerchandisingRoutes);
app.route('/homepage', homepageRoutes);
app.route('/admin/homepage-social-posts', adminHomepageSocialPostsRoutes);
app.route('/reviews', reviewsRoutes);

// Documentation Routes
app.route('/docs', docsApp);

// 404 Handler
app.notFound((c) => {
  return errorResponse(c, 'Route not found', null, 404);
});

// Global Error Handler
app.onError(errorHandler);

const port = Number(process.env.PORT) || 4000;

console.log(`Server starting on port ${port}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
if (process.env.NODE_ENV !== 'production') {
  console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
}

const server = serve({
  fetch: app.fetch,
  port,
});

// Attach Socket.io for real-time inventory updates
initSocketServer(server as import('node:http').Server, allowedOrigins);
startSeoCronScheduler();

// OPT-003: Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  stopSeoCronScheduler();
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  // Close Socket.IO first so clients reconnect cleanly
  if (io) io.close();
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds if connections are hanging
  const shutdownTimer = setTimeout(() => {
    console.error('⚠️ Forced shutdown after 10s timeout');
    process.exit(1);
  }, 10000);
  shutdownTimer.unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

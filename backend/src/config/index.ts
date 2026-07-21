// Validate critical environment variables
function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`FATAL: ${name} environment variable is required`);
  }
  return value || '';
}

function getEnvVarWithDefault(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// JWT Secret - CRITICAL: Must be set in production
const JWT_SECRET = getEnvVar(
  'JWT_SECRET',
  process.env.NODE_ENV === 'production'
);
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET must be set in production environment');
}

if (!JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is required. ' +
      'Set it in .env file or environment variables.'
  );
}

export const config = {
  jwt: {
    secret: JWT_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256' as const,
  },
  bcrypt: {
    saltRounds: 10,
  },
  server: {
    port: Number(getEnvVarWithDefault('PORT', '4000')),
    env: getEnvVarWithDefault('NODE_ENV', 'development'),
  },
  cors: {
    origins: getEnvVarWithDefault(
      'ALLOWED_ORIGINS',
      'http://localhost:3001,http://localhost:3002'
    ).split(','),
  },
  rateLimit: {
    max: Number(getEnvVarWithDefault('RATE_LIMIT_MAX', '100')),
    windowMs: Number(getEnvVarWithDefault('RATE_LIMIT_WINDOW_MS', '900000')),
  },
  tax: {
    defaultRate: Number(getEnvVarWithDefault('DEFAULT_TAX_RATE', '18')),
  },
  storefront: {
    url: getEnvVar('STOREFRONT_URL', false),
    revalidateSecret: getEnvVar('STOREFRONT_REVALIDATE_SECRET', false),
  },
  database: {
    url: getEnvVar('DATABASE_URL', process.env.NODE_ENV === 'production'),
  },
  // Stripe is OPTIONAL — only validate if STRIPE_SECRET_KEY is set.
  stripe: {
    secretKey: getEnvVar('STRIPE_SECRET_KEY', false),
    webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET', false),
    publishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY', false),
  },
  // Razorpay is OPTIONAL — used for INR / India payments.
  razorpay: {
    keyId: getEnvVar('RAZORPAY_ID', false),
    keySecret: getEnvVar('RAZORPAY_SECRET', false),
    webhookSecret: getEnvVar('RAZORPAY_WEBHOOK_SECRET', false),
  },
  // PayPal is OPTIONAL — used for international payments.
  paypal: {
    clientId: getEnvVar('PAYPAL_CLIENT_ID', false),
    clientSecret: getEnvVar('PAYPAL_CLIENT_SECRET', false),
    webhookId: getEnvVar('PAYPAL_WEBHOOK_ID', false),
    sandbox: process.env.PAYPAL_SANDBOX === 'true',
  },
  // Brevo API for transactional emails
  brevo: {
    apiKey: getEnvVar('BREVO_API_KEY', false),
  },
  // Meilisearch for search and filtering
  meilisearch: {
    host: getEnvVar('MEILISEARCH_HOST', false),
    apiKey: getEnvVar('MEILISEARCH_API_KEY', false),
  },
  // Twilio for SMS
  twilio: {
    accountSid: getEnvVar('TWILIO_ACCOUNT_SID', false),
    authToken: getEnvVar('TWILIO_AUTH_TOKEN', false),
    phoneNumber: getEnvVar('TWILIO_PHONE_NUMBER', false),
  },
};

// Validate configuration on load
if (process.env.NODE_ENV === 'production') {
  console.log('[CONFIG] Running in PRODUCTION mode');
  console.log('[CONFIG] Validating critical configuration...');

  if (
    !config.jwt.secret ||
    config.jwt.secret === 'development-secret-do-not-use-in-production'
  ) {
    throw new Error('FATAL: JWT_SECRET not properly configured for production');
  }

  if (!config.database.url) {
    throw new Error('FATAL: DATABASE_URL not configured');
  }

  if (config.storefront.url && !config.storefront.revalidateSecret) {
    console.log(
      '[CONFIG] WARNING: STOREFRONT_URL is set but STOREFRONT_REVALIDATE_SECRET is missing. ' +
        'Storefront cache revalidation after product changes will be skipped.'
    );
  }

  // Stripe is optional — warn only
  if (!config.stripe.secretKey) {
    console.log(
      '[CONFIG] ℹ️  STRIPE_SECRET_KEY not set — Stripe payment routes will be disabled. ' +
        'This is expected if you are using RogerPay / PayPal.'
    );
  }

  // Cloudinary is required for file uploads
  const missingCloudinary = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    .filter((k) => !process.env[k]);
  if (missingCloudinary.length > 0) {
    throw new Error(`FATAL: Missing Cloudinary env vars: ${missingCloudinary.join(', ')}`);
  }

  console.log('[CONFIG] All critical configuration validated ✓');
} else {
  console.log('[CONFIG] Running in DEVELOPMENT mode');
  console.log(
    '[CONFIG] WARNING: Using development defaults - NOT FOR PRODUCTION'
  );
}

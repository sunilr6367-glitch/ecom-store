import type { HeadingRole, PageWidth, SurfaceRole } from './primitives';

export type ChromeMode = 'store' | 'checkout' | 'wholesale';
export type PageKind = 'home' | 'discovery' | 'collection' | 'product' | 'commerce' | 'auth' | 'account' | 'editorial' | 'help' | 'reels' | 'wholesale' | 'redirect' | 'lab';
export type VisualState = 'populated' | 'empty' | 'loading' | 'error' | 'authenticated' | 'unauthenticated' | 'missing-media' | 'long-copy' | 'sale-price' | 'wholesale-price' | 'multi-currency';

export interface RouteContract {
  pattern: string;
  pageKind: PageKind;
  chromeMode: ChromeMode;
  width: PageWidth;
  surface: SurfaceRole;
  headingRole: HeadingRole;
  allowedComponents: readonly string[];
  requiredVisualStates: readonly VisualState[];
  approvedExceptions: readonly string[];
  testFixture: string;
}

const publicComponents = ['PageShell', 'PageContainer', 'PageHeader', 'Heading', 'Text', 'Section', 'SectionHeader', 'Stack', 'Cluster', 'ScrollRail', 'Button', 'ButtonLink', 'IconButton', 'Card', 'Input', 'Select', 'Textarea', 'Modal', 'Drawer', 'EmptyState', 'StatusBanner'] as const;
const defaultStates = ['populated', 'empty', 'loading', 'error', 'missing-media', 'long-copy'] as const;

function defineRoute(pattern: string, pageKind: PageKind, overrides: Partial<Omit<RouteContract, 'pattern' | 'pageKind'>> = {}): RouteContract {
  const fixture = pattern
    .replace('[handle]', 'kantha-jacket')
    .replace('[slug]', 'fixture-slug')
    .replace('[id]', 'fixture-id');
  return {
    pattern,
    pageKind,
    chromeMode: pattern.startsWith('/wholesale') ? 'wholesale' : pattern.startsWith('/checkout') ? 'checkout' : 'store',
    width: pageKind === 'home' ? 'home' : pageKind === 'auth' || pageKind === 'help' || pageKind === 'editorial' ? 'narrow' : 'standard',
    surface: 'page',
    headingRole: pageKind === 'home' ? 'hero' : 'page',
    allowedComponents: publicComponents,
    requiredVisualStates: defaultStates,
    approvedExceptions: [],
    testFixture: fixture || '/',
    ...overrides,
  };
}

export const routeContracts = [
  defineRoute('/', 'home'),
  defineRoute('/__design-system', 'lab', { requiredVisualStates: ['populated'], testFixture: '/__design-system' }),
  defineRoute('/about', 'editorial'), defineRoute('/about/block-printing', 'editorial'), defineRoute('/about/kantha', 'editorial'), defineRoute('/about/our-craft', 'editorial'),
  defineRoute('/account', 'account'), defineRoute('/account/addresses', 'account'), defineRoute('/account/messages', 'account'), defineRoute('/account/messages/[id]', 'account', { testFixture: '/account/messages/demo-thread' }), defineRoute('/account/notifications', 'account'), defineRoute('/account/orders', 'account'), defineRoute('/account/orders/[id]', 'account', { testFixture: '/account/orders/demo-order' }), defineRoute('/account/profile', 'account'), defineRoute('/account/wholesale', 'account'),
  defineRoute('/artisans', 'editorial'), defineRoute('/artisans/[slug]', 'editorial', { testFixture: '/artisans/jaipur-atelier' }),
  defineRoute('/bestsellers', 'discovery'), defineRoute('/cart', 'commerce'),
  defineRoute('/categories', 'redirect'), defineRoute('/categories/[slug]', 'redirect', { testFixture: '/categories/kantha-jackets' }),
  defineRoute('/checkout', 'commerce'), defineRoute('/checkout/success', 'commerce'),
  defineRoute('/collections', 'collection'), defineRoute('/collections/[handle]', 'collection', { testFixture: '/collections/travel-edit' }),
  defineRoute('/contact', 'help'), defineRoute('/cookie-settings', 'help'), defineRoute('/edits', 'discovery'), defineRoute('/faq', 'help'),
  defineRoute('/forgot-password', 'auth'), defineRoute('/gift-cards', 'commerce'), defineRoute('/help', 'help'),
  defineRoute('/journal', 'editorial'), defineRoute('/journal/[slug]', 'editorial', { testFixture: '/journal/craft-journal-fixture' }), defineRoute('/login', 'auth'),
  defineRoute('/pages/[slug]', 'editorial', { testFixture: '/pages/editorial-policy-fixture' }), defineRoute('/pages/privacy-policy', 'editorial'), defineRoute('/pages/refund-policy', 'editorial'), defineRoute('/pages/shipping-policy', 'editorial'), defineRoute('/pages/shipping-returns', 'editorial'), defineRoute('/pages/terms-of-service', 'editorial'),
  defineRoute('/payment-help', 'help'), defineRoute('/products', 'discovery'), defineRoute('/products/[handle]', 'product', { testFixture: '/products/kantha-jacket' }),
  defineRoute('/reels', 'reels', { width: 'flush', approvedExceptions: ['immersive-reels-surface'] }),
  defineRoute('/register', 'auth'), defineRoute('/reset-password', 'auth'), defineRoute('/returns', 'help'), defineRoute('/sale', 'discovery'), defineRoute('/search', 'discovery'), defineRoute('/shipping', 'help'), defineRoute('/size-guide', 'help'), defineRoute('/stores', 'help'), defineRoute('/track', 'help'), defineRoute('/trending-now', 'discovery'), defineRoute('/verify-email', 'auth'), defineRoute('/verify-otp', 'auth'), defineRoute('/wishlist', 'commerce'),
  defineRoute('/wholesale', 'wholesale'), defineRoute('/wholesale/checkout', 'wholesale'), defineRoute('/wholesale/login', 'wholesale'), defineRoute('/wholesale/set-password', 'wholesale'),
] as const satisfies readonly RouteContract[];

export const routeContractByPattern = new Map(routeContracts.map((contract) => [contract.pattern, contract]));

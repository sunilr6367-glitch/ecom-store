import { createServer } from 'node:http';

const port = Number.parseInt(process.env.MOCK_API_PORT || '4000', 10);

function svgDataUri(label, width = 1200, height = 1500, background = '#e5e5e5', foreground = '#111111') {
  const markup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${background}" />
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Cardo, serif"
        font-size="${Math.max(28, Math.floor(width / 16))}"
        fill="${foreground}"
      >${label}</text>
    </svg>
  `.replace(/\s+/g, ' ').trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

function withVariant(url, variant) {
  if (url.startsWith('data:')) {
    return svgDataUri(variant);
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}mock=${encodeURIComponent(variant)}`;
}

const image = svgDataUri('odhvica-fixture');

function json(response, payload, statusCode = 200) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function product(id, title, imageVariant = id, overrides = {}) {
  const handle = overrides.handle || id;
  return {
    id,
    title,
    handle,
    description:
      overrides.description ||
      `${title} is part of the Odhvica local certification fixture catalog.`,
    status: 'published',
    subtitle: overrides.subtitle || 'Handmade textile edit',
    thumbnail: withVariant(image, `${imageVariant}-thumbnail`),
    images: [
      {
        id: `${id}-image-1`,
        url: withVariant(image, `${imageVariant}-gallery-1`),
        alt_text: `${title} primary image`,
        position: 0,
        is_thumbnail: true,
        metadata: { media_type: 'image' },
      },
      {
        id: `${id}-image-2`,
        url: withVariant(image, `${imageVariant}-gallery-2`),
        alt_text: `${title} detail image`,
        position: 1,
        metadata: { media_type: 'image' },
      },
    ],
    options: [
      {
        id: `${id}-option-color`,
        title: 'Color',
        values: [{ id: `${id}-option-color-indigo`, value: 'Indigo' }],
      },
      {
        id: `${id}-option-size`,
        title: 'Size',
        values: [
          { id: `${id}-option-size-s`, value: 'S' },
          { id: `${id}-option-size-m`, value: 'M' },
        ],
      },
    ],
    variants: [
      {
        id: `${id}-variant`,
        product_id: id,
        title: `${title} / Indigo / M`,
        sku: `${id}-sku`,
        inventory_quantity: 12,
        manage_inventory: true,
        prices: [{ id: `${id}-price`, amount: 599900, currency_code: 'inr' }],
      },
    ],
    material: 'Handwoven cotton',
    origin_country: 'India',
    artisan: {
      id: 'artisan-jaipur-atelier',
      name: 'Jaipur Atelier',
      slug: 'jaipur-atelier',
      craft_specialty: 'Hand block printing',
      location: 'Jaipur, Rajasthan',
    },
    collection: {
      id: 'collection-travel-edit',
      title: 'Travel Edit',
      handle: 'travel-edit',
    },
    categories: [
      {
        id: 'category-kantha-jackets',
        name: 'Kantha Jackets',
        handle: 'kantha-jackets',
        slug: 'kantha-jackets',
      },
    ],
    avg_rating: 4.8,
    review_count: 12,
    created_at: '2026-06-21T00:00:00.000Z',
    semantic_related_products: [],
    ...overrides,
  };
}

const products = [
  product('kantha-jacket', 'Indigo Kantha Jacket'),
  product('block-print-dress', 'Hand Block Printed Dress'),
  product('quilted-cotton-tote', 'Quilted Cotton Tote'),
  product('artisan-coat', 'Reversible Artisan Coat'),
  product('summer-stole', 'Summer Stole'),
  product('travel-set', 'Travel Set'),
];

for (const item of products) {
  item.semantic_related_products = products
    .filter((candidate) => candidate.id !== item.id)
    .slice(0, 4)
    .map((candidate) => ({
      ...candidate,
      semantic_related_products: [],
    }));
}

const collections = [
  {
    id: 'collection-travel-edit',
    title: 'Travel Edit',
    handle: 'travel-edit',
    description: 'Effortless layers and artisanal pieces for the journey ahead.',
    image: withVariant(image, 'collection-travel-edit'),
    cover_image_url: withVariant(image, 'collection-travel-edit-cover'),
    product_count: 4,
    status: 'active',
    type: 'manual',
    metadata: { description: 'A versatile capsule rooted in Odhvica craft.' },
    seo_title: 'Travel Edit',
    seo_desc: 'Travel-ready artisanal layers from Odhvica.',
  },
  {
    id: 'collection-jaipur-stories',
    title: 'Jaipur Stories',
    handle: 'jaipur-stories',
    description: 'Color, craft, and layered silhouettes from Jaipur.',
    image: withVariant(image, 'collection-jaipur-stories'),
    cover_image_url: withVariant(image, 'collection-jaipur-stories-cover'),
    product_count: 3,
    status: 'active',
    type: 'manual',
    metadata: { description: 'Editorial storytelling through crafted apparel.' },
    seo_title: 'Jaipur Stories',
    seo_desc: 'Explore Jaipur Stories by Odhvica.',
  },
];

const categories = [
  {
    id: 'category-kantha-jackets',
    name: 'Kantha Jackets',
    slug: 'kantha-jackets',
    handle: 'kantha-jackets',
    description: 'Layering staples with hand quilting and vintage texture.',
    image: withVariant(image, 'category-kantha-jackets'),
    header_image_url: withVariant(image, 'category-kantha-jackets-header'),
    is_active: true,
    children: [],
  },
  {
    id: 'category-dresses',
    name: 'Dresses',
    slug: 'dresses',
    handle: 'dresses',
    description: 'Dresses in breathable cotton and block print.',
    image: withVariant(image, 'category-dresses'),
    header_image_url: withVariant(image, 'category-dresses-header'),
    is_active: true,
    children: [],
  },
  {
    id: 'category-bags',
    name: 'Bags',
    slug: 'bags',
    handle: 'bags',
    description: 'Textile bags made from small-batch artisan fabrics.',
    image: withVariant(image, 'category-bags'),
    header_image_url: withVariant(image, 'category-bags-header'),
    is_active: true,
    children: [],
  },
];

const artisan = {
  id: 'artisan-jaipur-atelier',
  name: 'Jaipur Atelier',
  slug: 'jaipur-atelier',
  bio: 'A collective of textile artisans preserving hand block printing and kantha techniques.',
  craft_specialty: 'Hand block printing',
  location: 'Jaipur, Rajasthan',
  image_url: withVariant(image, 'artisan-jaipur-atelier'),
};

const post = {
  id: 'journal-craft-journal-fixture',
  slug: 'craft-journal-fixture',
  title: 'Craft Journal Fixture',
  excerpt: 'A fixture article for architecture certification route evidence.',
  cover_image: withVariant(image, 'journal-craft-fixture'),
  content:
    'This fixture article keeps editorial layout, hierarchy, and typography stable during V4 certification.',
  seo_title: 'Craft Journal Fixture',
  seo_description: 'Fixture article for Odhvica Journal route coverage.',
  seo_keywords: 'craft, odhvica, journal',
  published_at: '2026-06-21T00:00:00.000Z',
  updated_at: '2026-06-21T00:00:00.000Z',
};

const dynamicPage = {
  id: 'page-editorial-policy-fixture',
  slug: 'editorial-policy-fixture',
  title: 'Editorial Policy Fixture',
  seo_title: 'Editorial Policy Fixture',
  seo_description: 'Fixture page for dynamic page route coverage.',
  content:
    '<p>This fixture page preserves the content-page system contract during V4 evidence runs.</p>',
};

const homepage = {
  generated_at: '2026-06-21T00:00:00.000Z',
  status: Object.fromEntries(
    [
      'categoryCircles',
      'hero',
      'featuredCategories',
      'bestSellers',
      'newArrivals',
      'collectionSlider',
      'collections',
      'watchShop',
      'brandStory',
      'social',
      'newsletter',
    ].map((key) => [key, { status: 'ready', count: 4 }])
  ),
  category_circles: Array.from({ length: 6 }, (_, index) => ({
    id: `circle-${index + 1}`,
    label: ['Jackets', 'Dresses', 'Bags', 'Quilts', 'Sarees', 'Gifts'][index],
    image_url: withVariant(image, `circle-${index + 1}`),
    link_url: `/categories/${index === 0 ? 'kantha-jackets' : `category-${index + 1}`}`,
    is_active: true,
    sort_order: index,
  })),
  hero: Array.from({ length: 4 }, (_, index) => ({
    id: `hero-${index + 1}`,
    image_url: withVariant(image, `hero-desktop-${index + 1}`),
    mobile_image_url: withVariant(image, `hero-mobile-${index + 1}`),
    title: [
      'Made slowly, worn often',
      'Jaipur in every stitch',
      'The art of layering',
      'Gifts with a story',
    ][index],
    button_text: 'Shop Now',
    button_link: '/products',
  })),
  featured_categories: categories.map((category, index) => ({
    id: category.id,
    name: category.name,
    image_url: category.image,
    link_url: `/categories/${category.slug}`,
    is_active: true,
    sort_order: index,
  })),
  best_sellers: products.slice(0, 4),
  new_arrivals: products.slice(1, 5),
  collection_slider: collections.map((collection) => ({
    id: collection.id,
    title: collection.title,
    handle: collection.handle,
    description: collection.description,
    image: collection.image,
    products: products.slice(0, 1),
  })),
  collections: collections.map((collection) => ({
    id: collection.id,
    title: collection.title,
    handle: collection.handle,
    description: collection.description,
    image: collection.image,
    products: products.slice(0, 3),
  })),
  watch_shop: [
    {
      id: 'reel-1',
      video_url: '',
      thumbnail_url: withVariant(image, 'watch-shop-1'),
      sort_order: 0,
      product: products[0],
    },
  ],
  brand_story: {
    title: 'Preserving craft, one thread at a time',
    content:
      'Odhvica connects Jaipur-rooted workmanship with considered modern wardrobes.',
    image_url: withVariant(image, 'brand-story'),
  },
  social: Array.from({ length: 8 }, (_, index) => ({
    id: `social-${index + 1}`,
    image_url: withVariant(image, `social-${index + 1}`),
    alt_text: `Odhvica community look ${index + 1}`,
    caption: 'Handmade textiles in everyday life.',
    destination_url: 'https://instagram.com/odhvica',
    sort_order: index,
  })),
  newsletter: {
    title: 'Join The Odhvica Circle',
    subtitle: 'Craft stories, considered launches, and notes from Jaipur.',
  },
};

function findCollection(handle) {
  return collections.find(
    (collection) => collection.handle === handle || collection.id === handle
  );
}

function findProduct(identifier) {
  return products.find(
    (item) => item.handle === identifier || item.id === identifier
  );
}

function buildProductsResponse(url) {
  const searchParams = url.searchParams;
  let filtered = [...products];

  const search = searchParams.get('search');
  if (search) {
    const normalized = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(normalized) ||
        item.handle.toLowerCase().includes(normalized)
    );
  }

  const categoryId = searchParams.get('category_id');
  if (categoryId) {
    filtered = filtered.filter((item) =>
      item.categories?.some((category) => category.id === categoryId)
    );
  }

  const collectionId = searchParams.get('collection_id');
  if (collectionId) {
    filtered = filtered.filter((item) => item.collection?.id === collectionId);
  }

  const limit = Number.parseInt(searchParams.get('limit') || `${filtered.length}`, 10);
  const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
  const paginated = filtered.slice(offset, offset + limit);

  return {
    success: true,
    data: paginated,
    pagination: {
      limit,
      offset,
      total: filtered.length,
      has_more: offset + limit < filtered.length,
    },
  };
}

const server = createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  const url = new URL(request.url || '/', `http://127.0.0.1:${port}`);
  const pathname = url.pathname;

  if (pathname === '/health') {
    json(response, { status: 'healthy', service: 'e2e-mock-api' });
    return;
  }

  if (pathname === '/auth/csrf') {
    json(response, { csrf_token: 'e2e-csrf-token' });
    return;
  }

  if (pathname === '/homepage') {
    json(response, homepage);
    return;
  }

  if (pathname === '/regions') {
    json(response, {
      regions: [
        {
          id: 'region-india',
          name: 'India',
          currency_code: 'inr',
          tax_rate: 0.18,
          countries: ['IN'],
          metadata: { market_key: 'india', checkout_enabled: true },
        },
      ],
    });
    return;
  }

  if (pathname === '/categories/tree') {
    json(response, { categories });
    return;
  }

  if (pathname === '/collections') {
    json(response, { collections });
    return;
  }

  if (pathname.startsWith('/collections/')) {
    const handle = decodeURIComponent(pathname.split('/').pop() || '');
    json(response, { collection: findCollection(handle) || collections[0] });
    return;
  }

  if (pathname === '/products') {
    json(response, buildProductsResponse(url));
    return;
  }

  if (pathname.startsWith('/products/featured')) {
    json(response, { data: products.slice(0, 4) });
    return;
  }

  if (pathname.startsWith('/products/search/suggestions')) {
    json(response, {
      suggestions: products.slice(0, 4).map((item) => item.title),
    });
    return;
  }

  if (pathname.startsWith('/products/')) {
    const identifier = decodeURIComponent(pathname.split('/').pop() || '');
    const matchedProduct = findProduct(identifier);
    if (!matchedProduct) {
      json(
        response,
        { success: false, error: { code: 'not_found', message: 'Product not found' } },
        404
      );
      return;
    }
    json(response, { success: true, data: { product: matchedProduct } });
    return;
  }

  if (pathname === '/store/settings') {
    json(response, {
      free_shipping_threshold: 200000,
      currency_code: 'inr',
      store_name: 'Odhvica',
      tax_rates: [{ country_code: 'IN', rate: 0.18, name: 'GST' }],
      default_tax_rate: 0.18,
    });
    return;
  }

  if (pathname === '/store/wholesale/prices') {
    json(response, { hasWholesaleAccess: false, tier: null });
    return;
  }

  if (pathname === '/store/wholesale/prices/bulk') {
    json(response, { prices: [] });
    return;
  }

  if (pathname === '/settings/homepage') {
    json(response, { settings: { hero_enabled: true } });
    return;
  }

  if (pathname === '/settings/footer') {
    json(response, { settings: { newsletter_enabled: true } });
    return;
  }

  if (pathname === '/settings/wholesale-tiers') {
    json(response, {
      tiers: [
        {
          id: 'tier-entry',
          name: 'Entry Wholesale',
          slug: 'entry-wholesale',
          discount_percent: 20,
          default_moq: 50,
          payment_terms: 'net_30',
          description: 'Ideal for independent boutiques and new stockists.',
        },
        {
          id: 'tier-growth',
          name: 'Growth Wholesale',
          slug: 'growth-wholesale',
          discount_percent: 30,
          default_moq: 150,
          payment_terms: 'net_45',
          description: 'For growing retail partners with recurring seasonal orders.',
        },
        {
          id: 'tier-enterprise',
          name: 'Enterprise Wholesale',
          slug: 'enterprise-wholesale',
          discount_percent: 40,
          default_moq: 400,
          payment_terms: 'net_60',
          description: 'For distributors and multi-store programs.',
        },
      ],
    });
    return;
  }

  if (pathname === '/pages/storefront') {
    json(response, { pages: [dynamicPage] });
    return;
  }

  if (pathname.startsWith('/pages/storefront/')) {
    const slug = decodeURIComponent(pathname.split('/').pop() || '');
    json(response, {
      page: { ...dynamicPage, slug, title: slug === dynamicPage.slug ? dynamicPage.title : 'Fixture Page' },
    });
    return;
  }

  if (pathname === '/posts/storefront') {
    json(response, { posts: [post] });
    return;
  }

  if (pathname.startsWith('/posts/storefront/')) {
    const slug = decodeURIComponent(pathname.split('/').pop() || '');
    json(response, { post: { ...post, slug, title: slug === post.slug ? post.title : 'Fixture Journal Entry' } });
    return;
  }

  if (pathname === '/seo/landing-pages' || pathname.startsWith('/seo/landing-pages?')) {
    json(response, { data: { landing_pages: [] } });
    return;
  }

  if (pathname.startsWith('/seo/landing-pages/')) {
    json(response, { data: { landing_page: null } });
    return;
  }

  if (pathname === '/artisans') {
    json(response, { data: { artisans: [artisan] } });
    return;
  }

  if (pathname.startsWith('/artisans/')) {
    json(response, { data: { artisan, products: products.slice(0, 3) } });
    return;
  }

  if (pathname === '/tags') {
    json(response, {
      tags: [
        { id: 'tag-bestseller', name: 'Bestseller', value: 'bestseller' },
        { id: 'tag-new', name: 'New Arrival', value: 'new-arrival' },
      ],
    });
    return;
  }

  if (pathname === '/testimonials/store') {
    json(response, {
      testimonials: [
        {
          id: 'test-1',
          name: 'Jane Doe',
          rating: 5,
          content: 'Amazing quality and craftsmanship.',
          location: 'London, UK',
          avatar_url: withVariant(image, 'avatar-1')
        }
      ]
    });
    return;
  }

  if (pathname === '/featured-products') {
    json(response, { featuredProducts: [] });
    return;
  }

  if (pathname === '/homepage-merchandising') {
    json(response, {
      slots: [
        {
          id: 'merch-1',
          slot_key: 'seasonal_edits',
          title: 'Seasonal',
          image_url: withVariant(image, 'seasonal'),
          is_active: true,
          sort_order: 1
        },
        {
          id: 'merch-2',
          slot_key: 'fabric_edits',
          title: 'Fabric',
          image_url: withVariant(image, 'fabric'),
          is_active: true,
          sort_order: 1
        },
        {
          id: 'merch-3',
          slot_key: 'occasion_edits',
          title: 'Occasion',
          image_url: withVariant(image, 'occasion'),
          is_active: true,
          sort_order: 1
        }
      ]
    });
    return;
  }

  if (pathname === '/trending-reels') {
    json(response, { reels: homepage.watch_shop });
    return;
  }

  if (pathname === '/reel-collections') {
    json(response, {
      collections: collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        hero_image_url: collection.image,
        description: collection.description,
      })),
    });
    return;
  }

  if (pathname === '/homepage-categories') {
    json(response, { categories: homepage.featured_categories });
    return;
  }

  if (pathname === '/category-circles') {
    json(response, { circles: homepage.category_circles });
    return;
  }

  if (pathname.startsWith('/reviews/store/products/')) {
    json(response, { reviews: [] });
    return;
  }

  if (pathname === '/store/wishlist') {
    json(response, { wishlist: [] });
    return;
  }

  if (pathname === '/store/customers/me') {
    json(response, {
      customer: {
        id: 'customer-fixture',
        email: 'fixture@odhvica.com',
        first_name: 'Fixture',
        last_name: 'Customer',
        created_at: '2026-06-21T00:00:00.000Z',
      },
    });
    return;
  }

  if (pathname === '/store/customers/me/orders') {
    json(response, {
      orders: [
        {
          id: 'demo-order',
          display_id: 1001,
          email: 'fixture@odhvica.com',
          total: 599900,
          subtotal: 559900,
          tax_total: 40000,
          shipping_total: 0,
          discount_total: 0,
          currency_code: 'inr',
          status: 'completed',
          payment_status: 'paid',
          fulfillment_status: 'fulfilled',
          items: [
            {
              id: 'demo-line-item',
              product_title: products[0].title,
              quantity: 1,
              unit_price: 599900,
              total: 599900,
            },
          ],
          created_at: '2026-06-21T00:00:00.000Z',
        },
      ],
    });
    return;
  }

  if (pathname.startsWith('/store/customers/me/orders/')) {
    json(response, {
      order: {
        id: 'demo-order',
        display_id: 1001,
        email: 'fixture@odhvica.com',
        total: 599900,
        subtotal: 559900,
        tax_total: 40000,
        shipping_total: 0,
        discount_total: 0,
        currency_code: 'inr',
        status: 'completed',
        payment_status: 'paid',
        fulfillment_status: 'fulfilled',
        items: [
          {
            id: 'demo-line-item',
            product_title: products[0].title,
            variant_title: products[0].variants[0].title,
            quantity: 1,
            unit_price: 599900,
            total: 599900,
          },
        ],
        created_at: '2026-06-21T00:00:00.000Z',
      },
    });
    return;
  }

  if (pathname === '/store/customers/me/addresses') {
    json(response, { addresses: [] });
    return;
  }

  if (pathname === '/store/customers/me/studio-inquiries') {
    json(response, { inquiries: [] });
    return;
  }

  if (pathname.startsWith('/store/customers/me/studio-inquiries/')) {
    json(response, {
      inquiry: {
        id: 'demo-thread',
        subject: 'Fixture studio inquiry',
        messages: [],
      },
    });
    return;
  }

  if (pathname === '/store/returns') {
    json(response, { returns: [] });
    return;
  }

  if (pathname === '/store/orders/track') {
    json(response, {
      order: {
        id: 'demo-order',
        status: 'fulfilled',
        order_number: 'ODH1001',
      },
    });
    return;
  }

  if (pathname === '/marketing/campaigns/active') {
    json(response, { campaigns: [] });
    return;
  }

  json(response, {});
});

server.listen(port, '127.0.0.1', () => {
  console.log(`E2E mock API listening on http://127.0.0.1:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}

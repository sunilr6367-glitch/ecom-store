/**
 * Site Configuration - Site Text Strings
 *
 * This file contains all configurable UI text strings for i18n readiness.
 * Edit these values to customize site text without modifying component code.
 */

export const siteConfig = {
  // General
  general: {
    loading: 'Loading...',
    submitting: 'Submitting...',
    error: 'An error occurred',
    tryAgain: 'Please try again',
    viewAll: 'View All',
    learnMore: 'Learn More',
  },

  // Navigation
  navigation: {
    filter: 'Filter',
    filters: 'Filters',
    closeFilters: 'Close filters',
    openFilters: 'Open filters',
  },

  // Catalog / Products
  catalog: {
    title: 'All Products',
    subtitle:
      'Discover our curated selection of artisanal luxury, from Kashmiri weaves to Florentine leather.',
    showingItems: (count: number) => `Showing ${count} Items`,
    theCollection: 'The Collection',
    newArrivals: 'Curated New Arrivals',
    newArrivalsSubtitle:
      'Fresh from the atelier. Limited quantities available.',
    viewAllProducts: 'View All Products',
  },

  // Newsletter
  newsletter: {
    placeholder: 'Your email address',
    button: 'Subscribe',
    loading: 'Subscribing...',
    successDefault: 'Thank you for subscribing!',
    errorDefault: 'Failed to subscribe',
    errorNetwork: 'Network error. Please try again.',
    ariaEmail: 'Email address',
    ariaSubmit: 'Subscribe to newsletter',
    ariaSubmitting: 'Subscribing to newsletter',
  },

  // Contact Page
  contact: {
    title: "We'd Love to Hear From You",
    subtitle:
      'Whether you have a question about sizing, custom orders, or just want to tell us about your recent travels, our concierge team is here.',
    sectionTitle: 'Get in Touch',

    // Form Labels
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    message: 'Message',

    // Validation Messages
    firstNameRequired: 'First name is required',
    firstNameMinLength: 'First name must be at least 2 characters',
    lastNameRequired: 'Last name is required',
    lastNameMinLength: 'Last name must be at least 2 characters',
    emailRequired: 'Email is required',
    emailInvalid: 'Please enter a valid email address',
    messageRequired: 'Message is required',
    messageMinLength: 'Message must be at least 10 characters',
    messageMaxLength: 'Message must be less than 2000 characters',

    // Contact Info
    emailUs: 'Email Us',
    emailAddress: 'support@odhvica.com',
    emailReplyTime: 'Monday-Friday, 9 AM - 6 PM IST',
    callOrWhatsApp: 'Call or WhatsApp',
    phoneNumber: '+91-9588078064',
    phoneHours: 'Monday-Friday, 9 AM - 6 PM IST',
    atelier: 'Atelier',
    address: '44C, Vijaypura, Sumel, Jaipur, Rajasthan 302031, India',

    // Form Actions
    sendMessage: 'Send Message',
    sending: 'Sending...',
    messageSent: 'Message Sent!',
    messageSentSubtitle:
      "Thank you for reaching out. We'll get back to you soon.",
    sendAnotherMessage: 'Send Another Message',
    errorSubmit: 'Failed to send message. Please try again.',
    errorNetwork: 'Network error. Please check your connection and try again.',
  },

  // Home Page
  home: {
    announcement: 'Complimentary Worldwide Shipping on Orders Over $250',

    valueProps: {
      globalShipping: {
        title: 'Global Shipping',
        description:
          'Seamless delivery to 150+ countries with duty-inclusive options.',
      },
      artisanCraft: {
        title: 'Artisan Craft',
        description: 'Hand-finished by master artisans in India and Italy.',
      },
      authenticity: {
        title: 'Authenticity',
        description: 'Guaranteed authentic materials and sustainable sourcing.',
      },
    },

    // Editorial Sections
    heritage: 'Heritage',
    outerwear: 'Outerwear',
    viewCollection: 'View Collection',
    fineSilk: 'Fine Silk',
    shopSarees: 'Shop Sarees',
    leatherGoods: 'Leather Goods',
    shopAccessories: 'Shop Accessories',

    atelier: {
      label: 'The Atelier',
      title: 'Where Tradition Meets',
      subtitle: 'Global Design',
      description:
        'Our studio collaborates directly with master craftsmen in Varanasi and Florence. Every thread tells a story of generations of skill, reimagined for the contemporary wardrobe of the global traveler.',
      readStory: 'Read Our Story',
      imagePlaceholder: 'Atelier Image',
    },

    testimonials: {
      quote:
        "The craftsmanship is unlike anything I've seen in Europe. The pashmina shawl is incredibly soft yet warm—a true heirloom piece.",
      author: 'Elena Rossi',
      location: 'Milan, Italy',
    },

    newsletter: {
      label: 'The Inner Circle',
      title: 'Unlock Early Access',
      description:
        'Be the first to know about new artisan collaborations, private sales, and stories from our workshops.',
      termsNote: 'By subscribing you agree to our Terms & Privacy Policy.',
    },
  },

  // Wholesale Page
  wholesale: {
    label: 'B2B Partnership',
    title: 'Wholesale & Bulk Orders',
    subtitle:
      'Partner with Odhvica to bring authentic artisanal luxury to your customers. Exclusive pricing, dedicated support, and global logistics for retailers and distributors worldwide.',
    ctaRequestPricing: 'Request Pricing',
    ctaLearnMore: 'Learn More',

    benefits: {
      title: 'Why Partner With Odhvica?',
      subtitle:
        'We provide everything you need to offer premium artisanal products to your market.',

      competitivePricing: {
        title: 'Competitive Pricing',
        description:
          'Volume-based discounts starting at 20% off retail. Tiered pricing for larger orders.',
      },
      flexibleMoq: {
        title: 'Flexible MOQ',
        description:
          'Minimum order quantities starting from just 50 units. Mix and match across collections.',
      },
      globalShipping: {
        title: 'Global Shipping',
        description:
          'DDP shipping to 150+ countries. Consolidated shipments and customs support included.',
      },
      marketingSupport: {
        title: 'Marketing Support',
        description:
          'High-res product images, brand assets, and storytelling content for your channels.',
      },
    },

    pricingTiers: {
      title: 'Wholesale Pricing Tiers',
      subtitle: 'Volume-based discounts to maximize your margins',

      starter: {
        title: 'Starter',
        subtitle: 'Perfect for boutiques',
        discount: '20% OFF',
        discountNote: 'Retail pricing',
        features: [
          'MOQ: 50 units',
          'Net 30 payment terms',
          'Standard shipping',
        ],
      },
      growth: {
        title: 'Growth',
        subtitle: 'For established retailers',
        discount: '30% OFF',
        discountNote: 'Retail pricing',
        popular: 'Most Popular',
        features: [
          'MOQ: 200 units',
          'Net 45 payment terms',
          'Priority shipping',
          'Dedicated account manager',
        ],
      },
      enterprise: {
        title: 'Enterprise',
        subtitle: 'For distributors & chains',
        discount: '40% OFF',
        discountNote: 'Retail pricing',
        features: [
          'MOQ: 500+ units',
          'Net 60 payment terms',
          'White-glove logistics',
          'Custom product development',
        ],
      },
    },

    process: {
      title: 'How It Works',
      subtitle: 'Simple 4-step process to start ordering',
      steps: [
        {
          title: 'Submit Inquiry',
          desc: 'Fill out the form below with your business details',
        },
        {
          title: 'Review & Quote',
          desc: 'Our team reviews and sends custom pricing within 24hrs',
        },
        {
          title: 'Sample Order',
          desc: 'Place a sample order to evaluate quality and fit',
        },
        {
          title: 'Bulk Orders',
          desc: 'Start ordering with flexible payment and shipping terms',
        },
      ],
    },

    inquiry: {
      title: 'Request Wholesale Pricing',
      subtitle:
        'Fill out the form and our team will contact you within 24 hours',

      // Form Labels
      companyName: 'Company Name *',
      contactName: 'Contact Name *',
      email: 'Email *',
      phone: 'Phone *',
      country: 'Country *',
      businessType: 'Business Type *',
      orderVolume: 'Estimated Monthly Order Volume',
      message: 'Message',
      placeholderMessage:
        "Tell us about your business and what products you're interested in...",

      // Business Types
      businessTypes: {
        boutique: 'Boutique / Retail Store',
        online: 'Online Retailer',
        distributor: 'Distributor',
        chain: 'Retail Chain',
        other: 'Other',
      },

      // Order Volumes
      orderVolumes: {
        select: 'Select...',
        range50_100: '50-100 units',
        range100_200: '100-200 units',
        range200_500: '200-500 units',
        range500Plus: '500+ units',
      },

      // Form Actions
      submit: 'Submit Inquiry',
      submitting: 'Submitting...',

      // Success State
      thankYou: 'Thank You!',
      thankYouSubtitle:
        "We've received your inquiry and will respond within 24 hours.",
    },

    contactCta: {
      emailUs: 'Email Us',
      emailAddress: 'wholesale@odhvica.com',
      callUs: 'Call Us',
      phoneNumber: '+1 (234) 567-890',
      downloadCatalog: 'Download Catalog',
      catalogFile: '2024 Wholesale Catalog (PDF)',
    },
  },
};

// Export type for TypeScript
export type SiteConfig = typeof siteConfig;

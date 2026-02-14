/**
 * SEO Optimization Utilities
 * Includes schema generation, meta tags, and AI-powered site descriptions
 */

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  url: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
}

// Generate page meta tags
export const generateMetaTags = (seoData: SEOData) => {
  const meta = {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords.join(', '),
    canonical: seoData.url,
    ogTitle: seoData.title,
    ogDescription: seoData.description,
    ogImage: seoData.image || 'https://res.cloudinary.com/dn5ya8xu5/image/upload/v1765988589/logo_lkxcbk.png',
    ogUrl: seoData.url,
    ogType: seoData.type || 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: seoData.title,
    twitterDescription: seoData.description,
    twitterImage: seoData.image || 'https://res.cloudinary.com/dn5ya8xu5/image/upload/v1765988589/logo_lkxcbk.png'
  };

  return meta;
};

// Generate Product Schema for SEO
export const generateProductSchema = (product: any) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  'name': product.name,
  'description': product.description,
  'image': product.image,
  'brand': {
    '@type': 'Brand',
    'name': 'Pixie Blooms'
  },
  'offers': {
    '@type': 'Offer',
    'url': `https://www.pixieblooms.in/shop?product=${product.id}`,
    'priceCurrency': 'INR',
    'price': product.price,
    'availability': 'https://schema.org/InStock'
  },
  'aggregateRating': product.rating ? {
    '@type': 'AggregateRating',
    'ratingValue': product.rating,
    'reviewCount': product.reviewCount || 0
  } : undefined
});

// Generate Organization Schema
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Pixie Blooms',
  'url': 'https://www.pixieblooms.in',
  'logo': 'https://www.pixieblooms.inhttps://res.cloudinary.com/ds7pknmvg/image/upload/v1770820147/logo-pixieblooms_e09fgp.png',
  'description': 'Premium handmade floral hair accessories for daily wear, photoshoots, and gifting',
  'email': 'pixieblooms2512@gmail.com',
  'sameAs': [],
  'address': {
    '@type': 'PostalAddress',
    'addressCountry': 'IN'
  }
});

// Generate Local Business Schema
export const generateLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  'name': 'Pixie Blooms',
  'image': 'https://www.pixieblooms.inhttps://res.cloudinary.com/ds7pknmvg/image/upload/v1770820147/logo-pixieblooms_e09fgp.png',
  'description': 'Premium handmade hair accessories and floral accessories shop',
  'url': 'https://www.pixieblooms.in',
  'telephone': '',
  'email': 'pixieblooms2512@gmail.com',
  'address': {
    '@type': 'PostalAddress',
    'addressCountry': 'IN'
  },
  'priceRange': '₹₹'
});

// Generate FAQ Schema
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': faqs.map(faq => ({
    '@type': 'Question',
    'name': faq.question,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': faq.answer
    }
  }))
});

// AI-Powered Site Description Generator
export const generateAISiteDescription = () => {
  const descriptions = [
    'Discover premium handmade hair accessories at Pixie Blooms. Shop unique floral hair clips, pins, scrunchies, and headbands perfect for any occasion.',
    'Pixie Blooms offers beautifully crafted hair accessories. Each piece is handmade with love, featuring vibrant florals and elegant designs for the modern woman.',
    'Browse our exclusive collection of handmade hair accessories including vintage-inspired clips, delicate hair pins, and colorful scrunchies at Pixie Blooms.',
    'Shop trending hair accessories at Pixie Blooms. Find the perfect handmade hair clip, scrunchie, or headband to express your unique style.',
    'Pixie Blooms specializes in premium handcrafted hair accessories. Our collection includes daily wear pieces, festive designs, and gift-worthy items.'
  ];

  // Rotate descriptions for freshness (SEO friendly)
  const index = Math.floor(Math.random() * descriptions.length);
  return descriptions[index];
};

// Generate AI Keywords for better SEO
export const generateAIKeywords = () => [
  'handmade hair accessories',
  'floral hair clips',
  'hair pins',
  'scrunchies',
  'headbands',
  'hair jewelry',
  'hair bands',
  'bobby pins',
  'hair accessories online',
  'premium hair clips',
  'artisan hair accessories',
  'unique hair pieces',
  'hair styling',
  'accessory shop',
  'pixie blooms',
  'buy hair clips online',
  'handcrafted jewelry',
  'daily wear accessories',
  'gifting ideas',
  'fashion accessories'
];

// Update page title dynamically
export const updatePageTitle = (title: string) => {
  document.title = `${title} | Pixie Blooms - Premium Hair Accessories`;
  
  // Update OG tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', document.title);
};

// Update meta description
export const updateMetaDescription = (description: string) => {
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
  
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', description);
  }
};

// Add breadcrumb schema
export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': items.map((item, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': item.name,
    'item': item.url
  }))
});

// Get SEO-friendly URL slug
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Generate canonical URL
export const getCanonicalUrl = (path: string = '') => {
  const baseUrl = 'https://www.pixieblooms.in';
  return `${baseUrl}${path}`;
};

// Inject schema script into page
export const injectSchema = (schema: any) => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
};

// Generate rich snippets for products
export const generateRichSnippet = (product: any) => {
  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    'name': product.name,
    'image': product.image,
    'description': product.description,
    'brand': {
      '@type': 'Brand',
      'name': 'Pixie Blooms'
    },
    'offers': {
      '@type': 'Offer',
      'url': `https://www.pixieblooms.in/shop?product=${product.id}`,
      'priceCurrency': 'INR',
      'price': product.price.toString(),
      'availability': 'https://schema.org/InStock'
    }
  };
  
  injectSchema(schema);
  return schema;
};

export default {
  generateMetaTags,
  generateProductSchema,
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateFAQSchema,
  generateAISiteDescription,
  generateAIKeywords,
  updatePageTitle,
  updateMetaDescription,
  generateBreadcrumbSchema,
  slugify,
  getCanonicalUrl,
  injectSchema,
  generateRichSnippet
};

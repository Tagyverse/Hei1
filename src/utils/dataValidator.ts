// Data validation utility for admin panel

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    productCount: number;
    categoryCount: number;
    reviewCount: number;
    offerCount: number;
  };
}

export interface DataToValidate {
  products?: Record<string, any> | null;
  categories?: Record<string, any> | null;
  reviews?: Record<string, any> | null;
  offers?: Record<string, any> | null;
  [key: string]: any;
}

function validateProducts(products: Record<string, any> | null): { errors: string[]; warnings: string[]; count: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let count = 0;

  if (!products) {
    errors.push('No products found in database');
    return { errors, warnings, count };
  }

  Object.entries(products).forEach(([id, product]) => {
    count++;

    // Required fields
    if (!product.name || product.name.trim() === '') {
      errors.push(`Product ${id}: Missing or empty name`);
    }

    if (product.price === undefined || product.price === null) {
      errors.push(`Product ${id}: Missing price`);
    } else if (typeof product.price !== 'number' || product.price < 0) {
      errors.push(`Product ${id}: Invalid price format`);
    }

    if (!product.category_ids && !product.category_id) {
      warnings.push(`Product ${id}: Not assigned to any category`);
    }

    if (!product.image_url || product.image_url.trim() === '') {
      warnings.push(`Product ${id}: Missing product image`);
    }

    // Optional but important fields
    if (!product.description || product.description.trim() === '') {
      warnings.push(`Product ${id}: Missing description`);
    }

    // Check for reasonable price
    if (product.price > 1000000) {
      warnings.push(`Product ${id}: Price seems unusually high (${product.price})`);
    }

    // Validate compare_at_price if present
    if (product.compare_at_price && product.compare_at_price < product.price) {
      errors.push(`Product ${id}: Compare price should be higher than sale price`);
    }
  });

  return { errors, warnings, count };
}

function validateCategories(categories: Record<string, any> | null): { errors: string[]; warnings: string[]; count: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let count = 0;

  if (!categories) {
    errors.push('No categories found in database');
    return { errors, warnings, count };
  }

  Object.entries(categories).forEach(([id, category]) => {
    count++;

    if (!category.name || category.name.trim() === '') {
      errors.push(`Category ${id}: Missing or empty name`);
    }

    if (!category.image_url || category.image_url.trim() === '') {
      warnings.push(`Category ${id}: Missing category image`);
    }
  });

  return { errors, warnings, count };
}

function validateReviews(reviews: Record<string, any> | null): { errors: string[]; warnings: string[]; count: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let count = 0;

  if (!reviews) {
    return { errors, warnings, count };
  }

  Object.entries(reviews).forEach(([id, review]) => {
    count++;

    if (!review.customer_name || review.customer_name.trim() === '') {
      errors.push(`Review ${id}: Missing customer name`);
    }

    if (!review.review_text || review.review_text.trim() === '') {
      errors.push(`Review ${id}: Missing review text`);
    }
  });

  return { errors, warnings, count };
}

function validateOffers(offers: Record<string, any> | null): { errors: string[]; warnings: string[]; count: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let count = 0;

  if (!offers) {
    return { errors, warnings, count };
  }

  Object.entries(offers).forEach(([id, offer]) => {
    count++;

    if (!offer.title || offer.title.trim() === '') {
      errors.push(`Offer ${id}: Missing title`);
    }

    if (offer.is_active === undefined && offer.isActive === undefined) {
      warnings.push(`Offer ${id}: Active status not set`);
    }
  });

  return { errors, warnings, count };
}

export function validateFirebaseData(data: DataToValidate): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const stats = {
    productCount: 0,
    categoryCount: 0,
    reviewCount: 0,
    offerCount: 0,
  };

  // Validate products
  const productValidation = validateProducts(data.products || null);
  allErrors.push(...productValidation.errors);
  allWarnings.push(...productValidation.warnings);
  stats.productCount = productValidation.count;

  // Validate categories
  const categoryValidation = validateCategories(data.categories || null);
  allErrors.push(...categoryValidation.errors);
  allWarnings.push(...categoryValidation.warnings);
  stats.categoryCount = categoryValidation.count;

  // Validate reviews
  const reviewValidation = validateReviews(data.reviews || null);
  allErrors.push(...reviewValidation.errors);
  allWarnings.push(...reviewValidation.warnings);
  stats.reviewCount = reviewValidation.count;

  // Validate offers
  const offerValidation = validateOffers(data.offers || null);
  allErrors.push(...offerValidation.errors);
  allWarnings.push(...offerValidation.warnings);
  stats.offerCount = offerValidation.count;

  // Core requirement check
  if (stats.productCount === 0) {
    allErrors.push('CRITICAL: No products in database - cannot publish without products');
  }

  if (stats.categoryCount === 0) {
    allErrors.push('CRITICAL: No categories in database - cannot publish without categories');
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    stats,
  };
}

export function getDataSummary(data: DataToValidate): string {
  const productCount = data.products ? Object.keys(data.products).length : 0;
  const categoryCount = data.categories ? Object.keys(data.categories).length : 0;
  const reviewCount = data.reviews ? Object.keys(data.reviews).length : 0;
  const offerCount = data.offers ? Object.keys(data.offers).length : 0;

  return `
📊 Data Summary:
• Products: ${productCount}
• Categories: ${categoryCount}
• Reviews: ${reviewCount}
• Offers: ${offerCount}
  `.trim();
}

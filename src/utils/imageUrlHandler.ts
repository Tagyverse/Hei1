/**
 * Utility functions for handling image URLs from various sources
 * Ensures proper CORS, encoding, and fallback handling
 */

export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '') return false;
  
  // Check if it's a data URL
  if (trimmed.startsWith('data:image')) return true;
  
  // Check if it looks like a valid URL
  try {
    new URL(trimmed);
    return true;
  } catch {
    // Check if it's a relative path
    return trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../');
  }
}

export function normalizeImageUrl(url: string, baseUrl?: string): string {
  if (!url) return '';
  
  const trimmed = url.trim();
  if (trimmed === '') return '';
  
  // Data URLs stay as-is
  if (trimmed.startsWith('data:')) return trimmed;
  
  // Relative URLs get made absolute if baseUrl provided
  if (baseUrl && (trimmed.startsWith('/') || trimmed.startsWith('./'))) {
    try {
      const base = new URL(baseUrl);
      return new URL(trimmed, base).toString();
    } catch {
      // If URL construction fails, return as-is
      return trimmed;
    }
  }
  
  // Absolute URLs are returned as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // For relative paths without leading slash, make it absolute
  if (baseUrl) {
    try {
      return new URL(trimmed, baseUrl).toString();
    } catch {
      return trimmed;
    }
  }
  
  return trimmed;
}

export function getProxyImageUrl(url: string, width?: number, height?: number, quality?: number): string {
  if (!isValidImageUrl(url)) return '';
  
  const trimmed = url.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  
  // Check if URL needs proxying (R2 or Cloudflare URLs)
  try {
    const imageUrl = new URL(trimmed);
    const needsProxy = imageUrl.hostname.includes('r2.') || 
                      imageUrl.hostname.includes('cloudflare') ||
                      imageUrl.hostname.includes('.workers.dev');
    
    if (needsProxy) {
      const proxyUrl = new URL('/api/serve-image', window.location.origin);
      proxyUrl.searchParams.append('url', trimmed);
      if (width) proxyUrl.searchParams.append('width', String(width));
      if (height) proxyUrl.searchParams.append('height', String(height));
      if (quality) proxyUrl.searchParams.append('quality', String(Math.min(quality, 100)));
      return proxyUrl.toString();
    }
  } catch (e) {
    // If URL parsing fails, return original
    console.warn('[v0] Could not parse image URL:', trimmed);
  }
  
  return trimmed;
}

export function sanitizeImageUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Decode if it's encoded
    let decoded = url;
    try {
      decoded = decodeURIComponent(url);
    } catch {
      // If decoding fails, use original
    }
    
    // Encode special characters
    return encodeURI(decoded);
  } catch (e) {
    console.warn('[v0] Error sanitizing image URL:', e);
    return url;
  }
}

export function getImageUrlForBill(productImage?: string | null, logoUrl?: string | null): string {
  // Prefer product image if available and valid
  if (productImage && isValidImageUrl(productImage)) {
    return normalizeImageUrl(productImage, window.location.origin);
  }
  
  // Fall back to logo if available and valid
  if (logoUrl && isValidImageUrl(logoUrl)) {
    return normalizeImageUrl(logoUrl, window.location.origin);
  }
  
  return '';
}

/**
 * Get properly formatted image URL with R2 proxy support for React components
 * Handles normalization, validation, and proxying in one call
 */
export function getProxiedImageUrl(imageUrl: string | undefined | null): string {
  if (!imageUrl || !isValidImageUrl(imageUrl)) return '';
  
  const trimmed = imageUrl.trim();
  if (!trimmed) return '';
  
  // Normalize the URL (make absolute if relative)
  const normalizedUrl = normalizeImageUrl(trimmed, typeof window !== 'undefined' ? window.location.origin : '');
  
  // Check if it needs proxying (R2 or Cloudflare) and apply optimization
  return getProxyImageUrl(normalizedUrl);
}

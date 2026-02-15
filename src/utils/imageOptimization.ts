export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

/**
 * Image optimization strategies for different use cases
 */
export const IMAGE_OPTIMIZATION_PRESETS = {
  thumbnail: { maxWidth: 200, maxHeight: 200, quality: 0.7 },
  small: { maxWidth: 400, maxHeight: 400, quality: 0.75 },
  medium: { maxWidth: 600, maxHeight: 600, quality: 0.8 },
  large: { maxWidth: 1200, maxHeight: 1200, quality: 0.85 },
  hero: { maxWidth: 1920, maxHeight: 1080, quality: 0.9 },
};

export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
  } = options;

  const isPNG = file.type === 'image/png';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: isPNG });
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        if (!isPNG) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          isPNG ? 'image/png' : 'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate optimized image URLs with query parameters for CDN optimization
 */
export function generateOptimizedImageUrl(
  imageUrl: string,
  width?: number,
  height?: number,
  quality?: number
): string {
  if (!imageUrl) return '';
  
  // Skip optimization for data URLs
  if (imageUrl.startsWith('data:')) return imageUrl;
  
  // Add query parameters for known CDNs
  if (imageUrl.includes('r2.') || imageUrl.includes('cloudflare')) {
    const params = new URLSearchParams();
    if (width) params.append('w', String(width));
    if (height) params.append('h', String(height));
    if (quality) params.append('q', String(Math.min(quality, 100)));
    
    const separator = imageUrl.includes('?') ? '&' : '?';
    return params.toString() ? `${imageUrl}${separator}${params.toString()}` : imageUrl;
  }
  
  return imageUrl;
}

/**
 * Preload images for better performance
 */
export function preloadImage(imageUrl: string): void {
  if (!imageUrl) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = imageUrl;
  document.head.appendChild(link);
}

/**
 * Get image dimensions for responsive images
 */
export function getResponsiveSizes(naturalWidth: number, naturalHeight: number): string {
  // Return responsive sizes for srcset
  const sizes = [320, 640, 960, 1280, 1920];
  return sizes.map(size => `${size}px`).join(', ');
}

/**
 * Check if image URL supports WebP format
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise(resolve => {
    const webp = new Image();
    webp.onload = webp.onerror = () => {
      resolve(webp.height === 2);
    };
    webp.src = 'data:image/webp;base64,UklGRjoKAABXRUJQVlA4IC4AAAAwAQCdASoBAAEAAUAcJaACdLoBAAA=';
  });
}

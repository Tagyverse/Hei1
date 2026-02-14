import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  priority?: boolean; // Load immediately without lazy loading
  sizes?: string; // Responsive image sizes
}

/**
 * OptimizedImage component with lazy loading, webp support, and responsive images
 * Provides better performance than standard img tags
 */
export default function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  onClick,
  priority = false,
  sizes = '100vw'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Load images 200px before they come into view
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Generate webp alternative if the image is from a CDN that supports it
  const getWebpSrc = (originalSrc: string): string | null => {
    if (originalSrc.includes('pexels.com') || originalSrc.includes('unsplash.com')) {
      // These CDNs support webp format
      return originalSrc.replace(/\.(jpg|jpeg|png)/, '.webp');
    }
    return null;
  };

  const webpSrc = getWebpSrc(src);

  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef} 
      className={`${className} relative overflow-hidden bg-gray-200`}
      style={{ minHeight: '100px' }}
    >
      {/* Shimmer loading effect */}
      {!isLoaded && isInView && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%]" />
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs">Image not available</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && !error && (
        <picture>
          {webpSrc && (
            <source srcSet={webpSrc} type="image/webp" />
          )}
          <img
            src={src}
            alt={alt}
            className={`${className} w-full h-full object-cover transition-all duration-500 ease-out ${
              !isLoaded
                ? 'opacity-0 scale-95 blur-sm'
                : 'opacity-100 scale-100 blur-0'
            }`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            sizes={sizes}
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
            onClick={onClick}
          />
        </picture>
      )}
    </div>
  );
}

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { X, RotateCw, ZoomIn, ZoomOut, AlertCircle, RefreshCw, Video, Image as ImageIcon, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { Product, TryOnModel } from '../types';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { objectToArray } from '../utils/publishedData';

interface VirtualTryOnProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

interface ErrorDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

const ErrorDialog = React.memo(function ErrorDialog({ isOpen, title, message, onClose, onRetry }: ErrorDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom md:fade-in md:zoom-in duration-300">
        <div className="bg-red-500 p-4 md:p-6 flex items-center gap-3 md:gap-4">
          <div className="bg-white rounded-full p-2 md:p-3">
            <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-white">{title}</h3>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-4 md:mb-6 whitespace-pre-line">{message}</p>
          <div className="flex gap-2 md:gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 bg-blue-500 text-white py-2.5 md:py-3 px-4 md:px-6 rounded-xl text-sm md:text-base font-semibold hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                Retry
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 bg-red-500 text-white py-2.5 md:py-3 px-4 md:px-6 rounded-xl text-sm md:text-base font-semibold hover:bg-red-600 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function VirtualTryOn({ isOpen, onClose, product: initialProduct }: VirtualTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const modelImageRef = useRef<HTMLImageElement>(null);
  const productImageRef = useRef<HTMLImageElement | null>(null);

  const { data: publishedData } = usePublishedData();
  const [currentProduct, setCurrentProduct] = useState<Product | null>(initialProduct || null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProductImageLoaded, setIsProductImageLoaded] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [productImageUrl, setProductImageUrl] = useState<string>('');
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);

  const [useLiveCamera, setUseLiveCamera] = useState(true);
  const [models, setModels] = useState<TryOnModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<TryOnModel | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);
  const currentFacingModeRef = useRef<'user' | 'environment'>('user');

  // Cache for preloaded images to speed up switching
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    loadModels();
    if (publishedData?.products) {
      const productsArray: Product[] = objectToArray<Product>(publishedData.products);
      const tryOnProducts = productsArray.filter(
        (p: Product) => p.try_on_enabled && p.try_on_image_url && p.in_stock
      );
      setAllProducts(tryOnProducts);
      
      // If no initial product, select the first one
      if (!initialProduct && tryOnProducts.length > 0) {
        setCurrentProduct(tryOnProducts[0]);
      } else if (initialProduct) {
        setCurrentProduct(initialProduct);
      }
    }
  }, [publishedData, initialProduct]);

  const loadModels = async () => {
    try {
      const modelsRef = dbRef(db, 'try_on_models');
      const snapshot = await get(modelsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const modelsList = Object.entries(data)
          .map(([id, modelData]: [string, any]) => ({
            id,
            ...modelData
          }))
          .filter((model: TryOnModel) => model.is_active)
          .sort((a: TryOnModel, b: TryOnModel) => (a.order_index || 0) - (b.order_index || 0)) as TryOnModel[];

        setModels(modelsList);
        if (modelsList.length > 0) {
          setSelectedModel(modelsList[0]);
        }
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const loadProductImage = useCallback((product: Product) => {
    const tryOnImage = product.try_on_image_url || product.image_url;
    
    // Check cache first for instant update
    if (imageCache.current.has(tryOnImage)) {
      productImageRef.current = imageCache.current.get(tryOnImage)!;
      setProductImageUrl(tryOnImage);
      setIsProductImageLoaded(true);
      return;
    }

    setIsProductImageLoaded(false);
    const img = new Image();
    const isFirebaseUrl = tryOnImage.includes('firebasestorage.googleapis.com');

    if (!isFirebaseUrl) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (!isMountedRef.current) return;
      imageCache.current.set(tryOnImage, img);
      productImageRef.current = img;
      setProductImageUrl(tryOnImage);
      setIsProductImageLoaded(true);
    };

    img.onerror = () => {
      console.error('Failed to load product image');
      setIsProductImageLoaded(false);
      setError({
        title: 'Image Load Error',
        message: 'Failed to load product image. Please try another product.'
      });
      setShowErrorDialog(true);
    };

    img.src = tryOnImage;
  }, []);

  useEffect(() => {
    if (currentProduct) {
      loadProductImage(currentProduct);
    }
  }, [currentProduct, loadProductImage]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      // Stop all tracks properly
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          console.log('[V0] Camera track stopped:', track.kind);
        } catch (e) {
          console.error('[V0] Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {
        console.error('[V0] Error pausing video:', e);
      }
    }

    setIsCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      setShowErrorDialog(false);
      setIsCameraReady(false);
      
      // Stop previous camera stream to avoid "already in use" error
      stopCamera();
      
      // Wait a bit for tracks to fully release
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const constraints = {
        video: {
          facingMode: currentFacingModeRef.current || 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      };

      console.log('[V0] Requesting camera with facingMode:', currentFacingModeRef.current);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await new Promise<void>((resolve) => {
        if (!videoRef.current) {
          resolve();
          return;
        }

        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsCameraReady(true);
              setIsLoading(false);
              resolve();
            }).catch(err => {
              console.error('Error playing video:', err);
              resolve();
            });
          } else {
            resolve();
          }
        };
      });
    } catch (err: any) {
      console.error('Camera error:', err);
      
      let errorTitle = 'Camera Access Error';
      let errorMessage = 'Failed to access camera. Please check permissions and try again.';
      
      if (err.name === 'NotAllowedError') {
        errorTitle = 'Permission Denied';
        errorMessage = 'Camera permission was denied. Please enable it in your browser settings:\n\n' +
                      '1. Click the camera/lock icon in the address bar\n' +
                      '2. Set Camera to "Allow"\n' +
                      '3. Refresh and try again';
      } else if (err.name === 'NotFoundError') {
        errorTitle = 'No Camera Found';
        errorMessage = 'No camera device was detected on this device. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError') {
        errorTitle = 'Camera In Use';
        errorMessage = 'Your camera is already being used by another application.\n\nPlease close that application and try again.';
      } else if (err.name === 'OverconstrainedError') {
        errorTitle = 'Unsupported Camera';
        errorMessage = 'Your camera does not support the required specifications.\n\nTry switching cameras if available.';
      } else if (err.message?.includes('not supported')) {
        errorTitle = 'Browser Not Supported';
        errorMessage = 'Your browser does not support camera access.\n\nPlease use Chrome, Firefox, Safari, or Edge.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError({
        title: errorTitle,
        message: errorMessage
      });
      setShowErrorDialog(true);
      setIsLoading(false);
    }
  }, [stopCamera]);

  const flipCamera = useCallback(() => {
    const newMode = currentFacingModeRef.current === 'user' ? 'environment' : 'user';
    currentFacingModeRef.current = newMode;
    setFacingMode(newMode);
    hasInitializedRef.current = false;
    startCamera();
  }, [startCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    hasInitializedRef.current = false;
    setIsProductImageLoaded(false);
    setProductImageUrl('');
    onClose();
  }, [stopCamera, onClose]);

  const handleRetry = useCallback(() => {
    setShowErrorDialog(false);
    setError(null);
    if (useLiveCamera) {
      startCamera();
    }
  }, [startCamera, useLiveCamera]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - imageTransform.x, y: e.clientY - imageTransform.y });
  }, [imageTransform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setImageTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - imageTransform.x,
        y: e.touches[0].clientY - imageTransform.y
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setLastPinchDistance(distance);
    }
  }, [imageTransform]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && isDragging) {
      setImageTransform(prev => ({
        ...prev,
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      }));
    } else if (e.touches.length === 2 && lastPinchDistance) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleDelta = distance / lastPinchDistance;
      setImageTransform(prev => ({
        ...prev,
        scale: Math.max(0.5, Math.min(3, prev.scale * scaleDelta))
      }));
      setLastPinchDistance(distance);
    }
  }, [isDragging, dragStart, lastPinchDistance]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setLastPinchDistance(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleDelta = e.deltaY > 0 ? 0.95 : 1.05;
    setImageTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * scaleDelta))
    }));
  }, []);

  const smoothZoom = useCallback((targetScale: number) => {
    setImageTransform(prev => {
      const newScale = Math.max(0.5, Math.min(3, targetScale));
      return { ...prev, scale: newScale };
    });
  }, []);

  const toggleBackgroundMode = useCallback(() => {
    const newMode = !useLiveCamera;

    setError(null);
    setShowErrorDialog(false);
    setIsLoading(true);
    hasInitializedRef.current = false;

    setUseLiveCamera(newMode);

    if (newMode) {
      setTimeout(() => {
        if (isMountedRef.current) {
          hasInitializedRef.current = true;
          startCamera();
        }
      }, 300);
    } else {
      stopCamera();
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsLoading(false);
          hasInitializedRef.current = true;
        }
      }, 300);
    }
  }, [useLiveCamera, startCamera, stopCamera]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      hasInitializedRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      stopCamera();
      return;
    }

    if (hasInitializedRef.current) return;

    setIsLoading(true);
    if (currentProduct) {
      loadProductImage(currentProduct);
    }

    if (useLiveCamera) {
      const timer = setTimeout(() => {
        if (isMountedRef.current && !hasInitializedRef.current) {
          hasInitializedRef.current = true;
          startCamera();
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
      hasInitializedRef.current = true;
    }
  }, [isOpen, loadProductImage, startCamera, stopCamera, useLiveCamera, currentProduct]);

  const handleNextProduct = useCallback(() => {
    if (allProducts.length === 0 || !currentProduct) return;
    const currentIndex = allProducts.findIndex(p => p.id === currentProduct.id);
    const nextIndex = (currentIndex + 1) % allProducts.length;
    setCurrentProduct(allProducts[nextIndex]);
  }, [allProducts, currentProduct]);

  const handlePrevProduct = useCallback(() => {
    if (allProducts.length === 0 || !currentProduct) return;
    const currentIndex = allProducts.findIndex(p => p.id === currentProduct.id);
    const prevIndex = (currentIndex - 1 + allProducts.length) % allProducts.length;
    setCurrentProduct(allProducts[prevIndex]);
  }, [allProducts, currentProduct]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <div className="relative h-full w-full">
        {useLiveCamera ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
        ) : selectedModel ? (
          <img
            ref={modelImageRef}
            src={selectedModel.image_url}
            alt={selectedModel.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <p className="text-white text-lg">No model selected</p>
          </div>
        )}

        {productImageUrl && isProductImageLoaded && !isLoading && (useLiveCamera ? isCameraReady : true) && (
          <div
            className="absolute inset-0 flex items-center justify-center select-none"
            style={{
              zIndex: 11,
              touchAction: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <div className="relative">
              <img
                src={productImageUrl}
                alt="Product Preview"
                className="object-contain"
                loading="lazy"
                decoding="async"
                style={{
                  width: '300px',
                  height: '300px',
                  transform: `translate3d(${imageTransform.x}px, ${imageTransform.y}px, 0) scale(${imageTransform.scale})`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  willChange: 'transform',
                  transition: isDragging ? 'none' : 'transform 0.1s linear'
                }}
                draggable={false}
              />
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center text-white text-sm bg-black bg-opacity-75 py-2 px-4 rounded-lg pointer-events-none">
                Drag to Move • Pinch to Zoom
              </div>
            </div>
          </div>
        )}

        {(isLoading || !isProductImageLoaded) && !showErrorDialog && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="text-center bg-gray-900 bg-opacity-90 rounded-2xl p-8 max-w-md mx-4">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg font-semibold">
                {!isProductImageLoaded ? 'Loading Product...' : 'Setting Up Virtual Try-On...'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <ErrorDialog
            isOpen={showErrorDialog}
            title={error.title}
            message={error.message}
            onClose={handleClose}
            onRetry={handleRetry}
          />
        )}

        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30">
          <button
            onClick={handleClose}
            className="bg-black bg-opacity-50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200 hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-white bg-black bg-opacity-50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <p className="font-medium text-sm">{currentProduct?.name || 'Virtual Try-On'}</p>
          </div>
          
          <div className="w-12"></div> {/* Spacer for balance */}
        </div>

        {/* Product Navigation Overlay */}
        {!isLoading && (useLiveCamera ? isCameraReady : true) && allProducts.length > 1 && (
          <>
            <button
              onClick={handlePrevProduct}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2.5 sm:p-3.5 rounded-full transition-all hover:scale-110 active:scale-95 border border-white/20"
              title="Previous Product"
            >
              <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
            </button>
            <button
              onClick={handleNextProduct}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2.5 sm:p-3.5 rounded-full transition-all hover:scale-110 active:scale-95 border border-white/20"
              title="Next Product"
            >
              <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
            </button>
          </>
        )}



        <div className="absolute top-4 sm:top-6 left-3 sm:left-4 z-30 flex flex-col gap-2 sm:gap-3">
          <button
            onClick={toggleBackgroundMode}
            className={`backdrop-blur-md text-white p-2.5 sm:p-3 rounded-full transition-all duration-200 hover:scale-110 border border-white/20 ${
              useLiveCamera ? 'bg-pink-500/70 hover:bg-pink-600/70' : 'bg-black/60 hover:bg-black/80'
            }`}
            title="Toggle Camera/Model"
          >
            <Video className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {!useLiveCamera && models.length > 0 && (
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2.5 sm:p-3 rounded-full transition-all duration-200 hover:scale-110 border border-white/20"
              title="Select Model"
            >
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {showModelSelector && !useLiveCamera && (
          <div className="absolute top-20 sm:top-32 left-3 sm:left-4 z-30 bg-black/80 backdrop-blur-md rounded-2xl p-3 sm:p-4 max-w-xs border border-white/10">
            <h3 className="text-white font-semibold mb-3 text-xs sm:text-sm">Select Background</h3>
            <div className="space-y-2 max-h-56 sm:max-h-64 overflow-y-auto pr-2">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model);
                    setShowModelSelector(false);
                  }}
                  className={`w-full flex items-center gap-2.5 p-2 sm:p-3 rounded-lg transition-all border ${
                    selectedModel?.id === model.id
                      ? 'bg-pink-500/40 border-pink-400'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <img
                    src={model.image_url}
                    alt={model.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded flex-shrink-0"
                  />
                  <span className="text-white text-xs sm:text-sm font-medium line-clamp-1">{model.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Carousel at bottom (Snapchat-like) */}
        {!isLoading && (useLiveCamera ? isCameraReady : true) && allProducts.length > 0 && (
          <div className="absolute bottom-20 sm:bottom-24 left-0 right-0 z-30 overflow-x-auto pb-3 sm:pb-4 scrollbar-hide">
            <div className="flex gap-2 sm:gap-4 px-4 sm:px-8 items-center justify-center min-w-full">
              {allProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setCurrentProduct(p)}
                  className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-3 sm:border-4 transition-all duration-200 ${
                    currentProduct?.id === p.id ? 'border-pink-500 scale-110 shadow-lg' : 'border-white/50 scale-90'
                  }`}
                  title={p.name}
                >
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {!isLoading && (useLiveCamera ? isCameraReady : true) && (
          <div className="absolute bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-30">
            <div className="bg-black/60 backdrop-blur-md rounded-full px-3 sm:px-6 py-2.5 sm:py-3 flex gap-2 sm:gap-4 items-center shadow-2xl border border-white/10">
              <button
                onClick={() => smoothZoom(imageTransform.scale - 0.15)}
                className="text-white p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>

              <button
                onClick={() => smoothZoom(imageTransform.scale + 0.15)}
                className="text-white p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-30 bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/10">
          <p className="text-white text-xs sm:text-sm font-semibold">
            by{' '}
            <a
              href="https://www.tagyverse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-pink-300 transition-colors duration-200"
            >
              tagyverse
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

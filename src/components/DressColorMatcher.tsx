import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X, Upload, Sparkles, CheckCircle, AlertCircle, Camera, Image as ImageIcon, ArrowLeft, RefreshCcw, Palette, ChevronRight } from 'lucide-react';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { objectToArray } from '../utils/publishedData';
import type { Product } from '../types';
import LazyImage from './LazyImage';
import { requestCameraPermission } from '../utils/permissionManager';

interface DressColorMatcherProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct?: Product;
}

interface ColorInfo {
  hex: string;
  name: string;
  percentage: number;
}

interface MatchedProduct {
  product: Product;
  matchPercentage: number;
  matchingColors: string[];
}

const colorMap: { [key: string]: string } = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#6B7280',
  grey: '#6B7280',
  pink: '#EC4899',
  purple: '#A855F7',
  orange: '#F97316',
  brown: '#92400E',
  navy: '#1E3A8A',
  beige: '#D4C5B9',
  cream: '#FFFDD0',
  maroon: '#800000',
  gold: '#FFD700',
  silver: '#C0C0C0',
  teal: '#14B8A6',
  cyan: '#06B6D4',
  lime: '#84CC16',
  indigo: '#6366F1',
};

const getColorName = (hex: string): string => {
  const distances = Object.entries(colorMap).map(([name, colorHex]) => {
    const r1 = parseInt(hex.substring(1, 3), 16);
    const g1 = parseInt(hex.substring(3, 5), 16);
    const b1 = parseInt(hex.substring(5, 7), 16);

    const r2 = parseInt(colorHex.substring(1, 3), 16);
    const g2 = parseInt(colorHex.substring(3, 5), 16);
    const b2 = parseInt(colorHex.substring(5, 7), 16);

    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    );

    return { name, distance };
  });

  distances.sort((a, b) => a.distance - b.distance);
  return distances[0].name;
};

export default function DressColorMatcher({ isOpen, onClose, currentProduct }: DressColorMatcherProps) {
  const { data: publishedData } = usePublishedData();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detectedColors, setDetectedColors] = useState<ColorInfo[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<MatchedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'camera' | 'processing' | 'results'>('upload');
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUploadedImage(null);
      setDetectedColors([]);
      setMatchedProducts([]);
      setError(null);
      setCameraError(null);
      setStep('upload');
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setIsProcessing(true);
    
    try {
      const result = await requestCameraPermission();
      
      if (result.granted) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setStep('camera');
          }
        } catch (err: any) {
          console.error('Error accessing camera:', err);
          let errorMsg = 'Could not access camera. ';
          
          if (err.name === 'NotReadableError') {
            errorMsg += 'Camera may be in use by another app. Please close it and try again.';
          } else if (err.name === 'OverconstrainedError') {
            errorMsg += 'Camera does not support required settings. Try a different camera.';
          } else {
            errorMsg += 'Please check your camera and permissions.';
          }
          
          setCameraError(errorMsg);
        }
      } else {
        setCameraError(result.error || 'Camera permission denied.');
      }
    } catch (err) {
      console.error('Error in startCamera:', err);
      setCameraError('An unexpected error occurred. Please try again.');
    }
    
    setIsProcessing(false);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setUploadedImage(dataUrl);
        stopCamera();
        processImage(dataUrl);
      }
    }
  };

  const processImage = (imageUrl: string) => {
    setIsProcessing(true);
    setError(null);
    setStep('processing');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const colors = extractColorsFromImage(img);
      setDetectedColors(colors);
      await matchProductsByColors(colors);
      setIsProcessing(false);
      setStep('results');
    };
    img.onerror = () => {
      setError('Failed to process image. Please try another one.');
      setIsProcessing(false);
      setStep('upload');
    };
    img.src = imageUrl;
  };

  const extractColorsFromImage = useCallback((imageElement: HTMLImageElement): ColorInfo[] => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    // Focus on center area but with larger focus zone
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const focusWidth = Math.floor(canvas.width * 0.8);  // Increased from 0.7 to 0.8
    const focusHeight = Math.floor(canvas.height * 0.8); // Increased from 0.7 to 0.8
    const startX = Math.floor(centerX - focusWidth / 2);
    const startY = Math.floor(centerY - focusHeight / 2);

    const imageData = ctx.getImageData(startX, startY, focusWidth, focusHeight);
    const pixels = imageData.data;
    const colorCounts: { [key: string]: number } = {};
    const pixelColors: Array<{ r: number; g: number; b: number; hex: string }> = [];
    let validPixelCount = 0;

    const edgeThreshold = 30; // Increased from 20 to exclude more background

    // First pass: collect valid pixels
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (a < 200) continue;

      const pixelIndex = i / 4;
      const x = pixelIndex % focusWidth;
      const y = Math.floor(pixelIndex / focusWidth);

      // Exclude edges to avoid background
      if (x < edgeThreshold || x > focusWidth - edgeThreshold ||
          y < edgeThreshold || y > focusHeight - edgeThreshold) {
        continue;
      }

      const brightness = (r + g + b) / 3;
      
      // Filter out very bright (near white) and very dark (near black) pixels
      if (brightness > 240 || brightness < 15) continue;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;

      // Increased saturation threshold from 0.15 to 0.25 to focus on saturated colors (dress colors)
      if (saturation < 0.25) continue;

      const roundedR = Math.round(r / 10) * 10;
      const roundedG = Math.round(g / 10) * 10;
      const roundedB = Math.round(b / 10) * 10;
      const hex = `#${((1 << 24) + (roundedR << 16) + (roundedG << 8) + roundedB).toString(16).slice(1).toUpperCase()}`;

      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      pixelColors.push({ r: roundedR, g: roundedG, b: roundedB, hex });
      validPixelCount++;
    }

    // Filter out uniform background colors by analyzing color distribution
    const filteredColorCounts: { [key: string]: number } = {};
    
    for (const [hex, count] of Object.entries(colorCounts)) {
      const percentage = (count / validPixelCount) * 100;
      
      // Very dominant single colors are likely background
      if (percentage > 40) continue;
      
      // Keep colors that appear meaningfully (at least 1% of pixels)
      if (percentage >= 1) {
        filteredColorCounts[hex] = count;
      }
    }

    // If filtering removed all colors, fall back to original with higher threshold
    const finalColorCounts = Object.keys(filteredColorCounts).length > 0 
      ? filteredColorCounts 
      : colorCounts;

    const sortedColors = Object.entries(finalColorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hex, count]) => ({
        hex,
        name: getColorName(hex),
        percentage: Math.round((count / validPixelCount) * 100 * 100) / 100
      }))
      .filter(color => color.percentage > 1.5); // Reduced threshold from 2 to 1.5 after filtering

    return sortedColors;
  }, []);

  const matchProductsByColors = useCallback(async (colors: ColorInfo[]) => {
    if (!publishedData?.products) return;

    try {
      const allProducts = objectToArray<Product>(publishedData.products)
        .filter((p: Product) => {
          if (!p.in_stock || p.isVisible === false || !p.availableColors || p.availableColors.length === 0) {
            return false;
          }

          if (currentProduct && p.id === currentProduct.id) {
            return false;
          }

          return true;
        });

      const detectedColorNames = colors.map(c => c.name.toLowerCase());

      const matches: MatchedProduct[] = [];

      for (const product of allProducts) {
        const productColors = (product.availableColors || []).map(c => c.toLowerCase());
        const matchingColors = productColors.filter(pc =>
          detectedColorNames.includes(pc)
        );

        if (matchingColors.length > 0) {
          const matchPercentage = Math.round((matchingColors.length / productColors.length) * 100);
          matches.push({
            product,
            matchPercentage,
            matchingColors
          });
        }
      }

      matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
      setMatchedProducts(matches.slice(0, 10));
    } catch (err) {
      console.error('Error matching products:', err);
      setError('Failed to find matching products');
    }
  }, [publishedData, currentProduct]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setUploadedImage(dataUrl);
        processImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  }, [processImage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-w-5xl w-full h-[95vh] md:h-auto md:max-h-[92vh] overflow-hidden flex flex-col">
        {/* Material Design Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 sm:p-4 md:p-6 flex items-start md:items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/40 flex-shrink-0">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base md:text-2xl font-bold text-white leading-tight truncate">Dress Color Matcher</h2>
              <p className="text-white/80 text-xs sm:text-sm font-medium hidden sm:block truncate">Find perfect matching pieces</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 border border-white/40"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 sm:p-4 md:p-6 bg-gradient-to-b from-pink-50/50 to-white">
          {step === 'upload' && (
            <div className="max-w-lg mx-auto space-y-6 sm:space-y-8 py-4 sm:py-8">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto border-4 border-pink-200 relative shadow-md">
                  <Sparkles className="absolute -top-2 -right-2 text-yellow-500 w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" />
                  <Palette className="w-8 h-8 sm:w-10 sm:h-10 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Let's Find Your Match</h3>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mt-1">Capture your dress color and discover matching accessories</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <button
                  onClick={startCamera}
                  className="group flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl hover:bg-pink-50 transition-all border border-pink-200 hover:border-pink-400 hover:shadow-lg active:scale-95"
                >
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-pink-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-pink-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-sm sm:text-base text-gray-900">Use Camera</p>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Snap a quick photo</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 hidden sm:block group-hover:text-pink-600 transition-colors" />
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl hover:bg-blue-50 transition-all border border-blue-200 hover:border-blue-400 hover:shadow-lg active:scale-95"
                >
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-sm sm:text-base text-gray-900">Upload Photo</p>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Choose from gallery</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 hidden sm:block group-hover:text-blue-600 transition-colors" />
                </button>
              </div>
              
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

              {cameraError && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs sm:text-sm font-medium">{cameraError}</p>
                </div>
              )}
            </div>
          )}

          {step === 'camera' && (
            <div className="max-w-2xl mx-auto space-y-4 py-4">
              <div className="relative bg-black rounded-3xl overflow-hidden aspect-square shadow-2xl">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {/* Guide overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 border-2 border-dashed border-pink-400/50 rounded-full"></div>
                  </div>
                </div>
                {/* Instruction text */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-black/40 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full text-white text-xs sm:text-sm font-medium border border-white/20">
                    Position dress in the center
                  </div>
                </div>
                {/* Capture button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full border-4 sm:border-6 border-gray-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl touch-none focus:outline-none focus:ring-4 focus:ring-pink-400/50"
                  >
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full animate-pulse"></div>
                  </button>
                </div>
                {/* Back button */}
                <button
                  onClick={() => setStep('upload')}
                  className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full border border-white/20 transition-all active:scale-90"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4">
              <div className="relative mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 sm:border-6 border-pink-100 border-t-pink-500 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 text-center">Analyzing your style...</p>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mt-2 text-center">Finding the perfect matches</p>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Dress preview */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide">Your Dress</h3>
                    <button
                      onClick={() => setStep('upload')}
                      className="flex items-center gap-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-colors border border-pink-200"
                    >
                      <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Try Again
                    </button>
                  </div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                    <img src={uploadedImage!} alt="Dress" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 sm:p-4">
                      <div className="flex flex-wrap gap-2">
                        {detectedColors.map((color, idx) => (
                          <div key={idx} className="bg-white/95 backdrop-blur-sm px-2.5 sm:px-3 py-1 rounded-full border border-gray-200 flex items-center gap-1.5 shadow-sm">
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }}></div>
                            <span className="text-[10px] sm:text-xs font-bold uppercase text-gray-900">{color.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matched products */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide">Matches</h3>
                    <div className="bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold border border-pink-200">
                      {matchedProducts.length} found
                    </div>
                  </div>

                  <div className="space-y-2.5 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2">
                    {matchedProducts.length === 0 ? (
                      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
                        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-xs sm:text-sm font-medium">No matching items found</p>
                      </div>
                    ) : (
                      matchedProducts.map(({ product, matchPercentage }) => (
                        <div key={product.id} className="group bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex gap-3 hover:shadow-md hover:border-pink-300 transition-all cursor-pointer">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
                            <LazyImage src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2 leading-tight">{product.name}</h4>
                                <div className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold whitespace-nowrap">
                                  {matchPercentage}% MATCH
                                </div>
                              </div>
                              <p className="text-pink-600 font-bold text-xs sm:text-sm">₹{product.price}</p>
                            </div>
                            <div className="flex gap-1.5">
                              {product.availableColors?.slice(0, 4).map((c, i) => (
                                <div key={i} className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: c }}></div>
                              ))}
                              {product.availableColors && product.availableColors.length > 4 && (
                                <div className="text-[10px] text-gray-500 font-bold flex items-center">+{product.availableColors.length - 4}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

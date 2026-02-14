import React from 'react';
import { X, Camera, Palette, Sparkles } from 'lucide-react';
import type { Product } from '../types';

interface TryOnOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVirtualTryOn: () => void;
  onSelectColorMatcher: () => void;
  product: Product;
}

export default function TryOnOptionModal({
  isOpen,
  onClose,
  onSelectVirtualTryOn,
  onSelectColorMatcher,
  product
}: TryOnOptionModalProps) {
  if (!isOpen) return null;

  const hasColorMatcher = product.availableColors && product.availableColors.length > 0;

  return (
    <div className="fixed inset-0 z-[105] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 border-4 border-black">
        <div className="bg-[#B5E5CF] p-4 md:p-6 relative border-b-4 border-black rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-3 md:top-4 right-3 md:right-4 bg-white text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-200 border-2 border-black hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-black">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-black">Choose Your Experience</h2>
          </div>
          <p className="text-black text-xs md:text-sm font-medium">
            Select how you'd like to visualize this product
          </p>
        </div>

        <div className="p-4 md:p-6 space-y-3 md:space-y-4 bg-white">
          <button
            onClick={() => {
              onSelectVirtualTryOn();
              onClose();
            }}
            className="w-full group"
          >
            <div className="bg-[#B5E5CF] border-2 border-black rounded-2xl p-4 md:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-black rounded-xl p-3 md:p-4 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-base md:text-xl font-bold text-black mb-1 md:mb-2">Virtual Try-On</h3>
                  <p className="text-black text-xs md:text-sm leading-relaxed font-medium">
                    See how this accessory looks on you using your camera or a model
                  </p>
                  <div className="mt-2 md:mt-3 flex items-center gap-2 flex-wrap">
                    <span className="bg-white text-black px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-bold border-2 border-black">
                      Live Preview
                    </span>
                    <span className="bg-white text-black px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-bold border-2 border-black">
                      AR Experience
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </button>

          {hasColorMatcher && (
            <button
              onClick={() => {
                onSelectColorMatcher();
                onClose();
              }}
              className="w-full group"
            >
              <div className="bg-[#B5E5CF] border-2 border-black rounded-2xl p-4 md:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="bg-black rounded-xl p-3 md:p-4 group-hover:scale-110 transition-transform duration-300">
                    <Palette className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-base md:text-xl font-bold text-black mb-1 md:mb-2">Match Your Dress</h3>
                    <p className="text-black text-xs md:text-sm leading-relaxed font-medium">
                      Upload a photo of your dress to find accessories with matching colors
                    </p>
                    <div className="mt-2 md:mt-3 flex items-center gap-2 flex-wrap">
                      <span className="bg-white text-black px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-bold border-2 border-black">
                        AI Powered
                      </span>
                      <span className="bg-white text-black px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-bold border-2 border-black">
                        Smart Match
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )}

          {!hasColorMatcher && (
            <div className="bg-gray-100 border-2 border-gray-300 rounded-2xl p-4 md:p-6 opacity-50">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-gray-300 rounded-xl p-3 md:p-4 border-2 border-gray-400">
                  <Palette className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-base md:text-xl font-bold text-black mb-1 md:mb-2">Match Your Dress</h3>
                  <p className="text-black text-xs md:text-sm leading-relaxed font-medium">
                    Color matching not available for this product
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-white text-gray-700 py-3 md:py-4 px-6 rounded-xl font-bold hover:bg-gray-50 transition-all duration-200 border-2 border-gray-300 hover:border-black"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

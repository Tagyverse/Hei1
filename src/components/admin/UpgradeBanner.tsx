import React, { useState } from 'react';
import { Zap, X } from 'lucide-react';
import PricingBottomSheet from './PricingBottomSheet';

export default function UpgradeBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [showPricing, setShowPricing] = useState(false);

  if (!isVisible) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500 opacity-20 animate-pulse"></div>

        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Unlock Premium Features</h3>
              <p className="text-blue-100 text-sm">
                Upgrade your admin panel with advanced features starting from ₹13,000
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPricing(true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
          >
            View Pricing Plans
          </button>
        </div>
      </div>

      {showPricing && (
        <PricingBottomSheet onClose={() => setShowPricing(false)} />
      )}
    </>
  );
}

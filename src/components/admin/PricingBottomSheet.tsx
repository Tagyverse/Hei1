import React from 'react';
import { X, Check, Sparkles, Crown, Rocket, Star } from 'lucide-react';

interface PricingBottomSheetProps {
  onClose: () => void;
}

interface PricingTier {
  name: string;
  price: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  features: string[];
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '₹13,000',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'text-green-600',
    bgGradient: 'from-green-50 to-green-100',
    features: [
      'Coupon Management',
      'Video Overlay Section',
      'Basic Video Section',
      'Custom Info or Warning Section',
      'Basic Traffic Analytics (Total Count Only)',
    ],
  },
  {
    name: 'Professional',
    price: '₹17,000',
    icon: <Rocket className="w-6 h-6" />,
    color: 'text-blue-600',
    bgGradient: 'from-blue-50 to-blue-100',
    popular: true,
    features: [
      'All Starter Features',
      'Bulk Operations',
      'Product Card Customization',
      'Category Card Customization',
      'Create & Edit Marquee Section',
      'Navigation Customization',
      'Footer Customization',
    ],
  },
  {
    name: 'Advanced',
    price: '₹20,000',
    icon: <Crown className="w-6 h-6" />,
    color: 'text-purple-600',
    bgGradient: 'from-purple-50 to-purple-100',
    features: [
      'All Professional Features',
      'Virtual Try-On Models',
      'AI Dress Color Matching System',
      'Enhanced Product Visualization',
    ],
  },
  {
    name: 'Enterprise',
    price: '₹22,000',
    icon: <Star className="w-6 h-6" />,
    color: 'text-orange-600',
    bgGradient: 'from-orange-50 to-orange-100',
    features: [
      'Everything in Admin Panel Unlocked',
      'AI Assistant Manager',
      'Advanced Traffic Analytics',
      'Complete Design Control',
      'All Future Updates',
      'Priority Support',
    ],
  },
];

export default function PricingBottomSheet({ onClose }: PricingBottomSheetProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="bg-white rounded-t-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative animate-slide-up">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Admin Panel</h2>
            <p className="text-gray-600 text-sm mt-1">Choose the perfect plan for your business</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative rounded-2xl shadow-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl ${
                  tier.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}

                <div className={`bg-gradient-to-br ${tier.bgGradient} p-6`}>
                  <div className={`${tier.color} mb-3`}>
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-600 ml-2">one-time</span>
                  </div>
                </div>

                <div className="p-6 bg-white">
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      window.open('https://wa.me/919876543210?text=Hi, I want to upgrade to the ' + tier.name + ' plan (' + tier.price + ')', '_blank');
                    }}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      tier.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Need a Custom Solution?</h3>
            <p className="text-gray-600 mb-4">
              Contact us for enterprise solutions tailored to your specific needs
            </p>
            <button
              onClick={() => {
                window.open('https://wa.me/917845431658?text=Hi, I need a custom admin panel solution', '_blank');
              }}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Contact Sales
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>All plans include lifetime access with no recurring fees</p>
            <p className="mt-1">Secure payment via Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
}

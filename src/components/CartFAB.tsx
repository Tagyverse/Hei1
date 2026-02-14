'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, X, Sparkles, ArrowRight, MessageCircle, Plus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { objectToArray } from '../utils/publishedData';
import type { Product } from '../types';

interface CartFABProps {
  onCartClick: () => void;
  position?: 'right' | 'left';
}

const SUGGESTION_MESSAGES = [
  { text: "We picked this for you", emoji: "✨" },
  { text: "Don't miss this!", emoji: "🔥" },
  { text: "Trending now", emoji: "📈" },
  { text: "Add this beauty", emoji: "💎" },
  { text: "Customer favorite", emoji: "⭐" },
  { text: "Limited stock", emoji: "⏰" },
  { text: "On sale today", emoji: "🎉" },
  { text: "You'll love this", emoji: "💕" }
];

export default function CartFAB({ onCartClick, position = 'right' }: CartFABProps) {
  const { itemCount, cart, addToCart } = useCart();
  const { data: publishedData } = usePublishedData();
  const [expanded, setExpanded] = useState(false);
  const [suggestedProduct, setSuggestedProduct] = useState<Product | null>(null);
  const [currentMessage, setCurrentMessage] = useState(SUGGESTION_MESSAGES[0]);
  const [showNotification, setShowNotification] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Get all products and pick a random one every 5 seconds
  useEffect(() => {
    if (publishedData?.products) {
      const allProducts = objectToArray<Product>(publishedData.products);
      setProducts(allProducts);
      
      if (allProducts.length > 0) {
        const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
        setSuggestedProduct(randomProduct);
        const randomMessage = SUGGESTION_MESSAGES[Math.floor(Math.random() * SUGGESTION_MESSAGES.length)];
        setCurrentMessage(randomMessage);
      }
    }
  }, [publishedData]);

  // Change suggestion every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (products.length > 0) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        setSuggestedProduct(randomProduct);
        const randomMessage = SUGGESTION_MESSAGES[Math.floor(Math.random() * SUGGESTION_MESSAGES.length)];
        setCurrentMessage(randomMessage);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [products]);

  const handleAddSuggested = () => {
    if (suggestedProduct) {
      addToCart(suggestedProduct);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    }
  };

  const positionClasses = position === 'right' 
    ? 'bottom-8 right-8 sm:right-6 md:right-8' 
    : 'bottom-8 left-8 sm:left-6 md:left-8';

  const expandedMenuClasses = position === 'right'
    ? 'bottom-28 right-8 sm:right-6 md:right-8'
    : 'bottom-28 left-8 sm:left-6 md:left-8';

  return (
    <>
      {/* Chat Bubble Notification - Fixed Position */}
      {showNotification && (
        <div className="fixed bottom-56 right-8 sm:right-6 md:right-8 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-200 overflow-hidden max-w-sm mx-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-white font-bold text-sm">Added to cart!</span>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Chat Menu - Fixed Positioning & Responsive */}
      {expanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 pointer-events-auto sm:hidden"
            onClick={() => setExpanded(false)}
          />
          <div className={`fixed ${expandedMenuClasses} z-50 bg-white rounded-3xl shadow-2xl border-2 border-emerald-100 overflow-hidden w-full max-w-xs sm:max-w-sm mx-2 sm:mx-0 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold text-lg">Suggestions</h3>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-white hover:bg-emerald-600 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Card */}
            {suggestedProduct && (
              <div className="p-4 border-b border-gray-200">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-2xl">{currentMessage.emoji}</span>
                    <p className="text-emerald-600 font-bold text-sm">{currentMessage.text}</p>
                  </div>
                  
                  {suggestedProduct.image && (
                    <div className="mb-4 aspect-square overflow-hidden rounded-xl bg-white">
                      <img 
                        src={suggestedProduct.image || "/placeholder.svg"} 
                        alt={suggestedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">{suggestedProduct.name}</h4>
                  <p className="text-emerald-600 font-bold text-lg mb-4">
                    {suggestedProduct.price ? `₹${suggestedProduct.price}` : 'Check price'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="p-4">
              <button
                onClick={handleAddSuggested}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add to Cart
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main FAB Button - Material Design - Fixed Sticky Position */}
      <div className={`fixed ${positionClasses} z-50 flex flex-col items-center gap-4 pointer-events-auto`}>
        <button
          onClick={() => onCartClick()}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 relative ${
            itemCount > 0
              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
              : 'bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
          }`}
          title="View cart"
        >
          <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          
          {/* Counter Badge */}
          {itemCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs sm:text-sm font-bold rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shadow-lg animate-pulse">
              {itemCount > 99 ? '99+' : itemCount}
            </div>
          )}
        </button>

        {/* Suggestion Chip */}
        {suggestedProduct && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="bg-white rounded-full shadow-xl border-2 border-emerald-200 px-4 py-2 flex items-center gap-2 hover:shadow-2xl transition-all duration-300 text-emerald-600 font-bold text-xs sm:text-sm pointer-events-auto whitespace-nowrap"
          >
            <span>{currentMessage.emoji}</span>
            <span className="hidden sm:inline">{currentMessage.text}</span>
            <span className="sm:hidden">{suggestedProduct.name.substring(0, 10)}...</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Powered by branding - Responsive */}
      <div className="fixed bottom-2 right-8 sm:right-6 md:right-8 z-40 pointer-events-auto">
        <p className="text-xs text-gray-500 font-medium text-center whitespace-nowrap">
          Powered by{' '}
          <a
            href="https://tagyverse.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
          >
            tagyverse.com
          </a>
        </p>
      </div>
    </>
  );
}

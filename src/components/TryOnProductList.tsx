import React, { useState, useEffect } from 'react';
import { X, Sparkles, Shirt } from 'lucide-react';
import { usePublishedData } from '../contexts/PublishedDataContext';
import type { Product } from '../types';
import LazyImage from './LazyImage';
import VirtualTryOn from './VirtualTryOn';
import { objectToArray } from '../utils/publishedData';

interface TryOnProductListProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TryOnProductList({ isOpen, onClose }: TryOnProductListProps) {
  const { data: publishedData } = usePublishedData();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);

  useEffect(() => {
    if (isOpen && publishedData?.products) {
      try {
        const productsArray: Product[] = objectToArray<Product>(publishedData.products);
        const tryOnProducts = productsArray.filter(
          (p: Product) => p.try_on_enabled && p.try_on_image_url && p.in_stock
        );
        setProducts(tryOnProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error loading try-on products:', error);
        setLoading(false);
      }
    }
  }, [isOpen, publishedData]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowTryOn(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shirt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Virtual Try-On</h2>
                <p className="text-blue-100 text-sm">Select a product to see how it looks on you!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-gray-50">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4 font-medium">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shirt className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-600 font-medium">No products available for virtual try-on at the moment.</p>
                <button 
                  onClick={onClose}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors"
                >
                  Back to Shop
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="group bg-white border-2 border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <LazyImage
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white text-blue-600 px-4 py-2 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                          Try This On
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1 truncate">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-blue-600 font-black">₹{product.price}</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" />
                          Try-On
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <VirtualTryOn
        isOpen={showTryOn}
        onClose={() => {
          setShowTryOn(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onBack={() => setShowTryOn(false)}
      />
    </>
  );
}

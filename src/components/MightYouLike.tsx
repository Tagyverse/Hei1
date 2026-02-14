import { ShoppingCart, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import type { Product } from '../types';
import LazyImage from './LazyImage';
import { useCardDesign, getCardStyles } from '../hooks/useCardDesign';
import { objectToArray } from '../utils/publishedData';

interface MightYouLikeProps {
  onProductClick: (product: Product) => void;
  onCartClick: () => void;
}

export default function MightYouLike({ onProductClick, onCartClick }: MightYouLikeProps) {
  const { data: publishedData } = usePublishedData();
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart, isInCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { design } = useCardDesign('might_you_like');
  const cardStyles = getCardStyles(design);

  useEffect(() => {
    if (!publishedData?.products) return;

    const productsArray: Product[] = objectToArray<Product>(publishedData.products);
    const mightYouLikeProducts = productsArray.filter(p => p.might_you_like).slice(0, 8);
    setProducts(mightYouLikeProducts);
  }, [publishedData]);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gradient-to-b from-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">You Might Also Like</h2>
          <p className="text-gray-600 text-lg">Handpicked recommendations just for you</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className={cardStyles.container}
              onClick={() => onProductClick(product)}
            >
              <div className="relative">
                <LazyImage
                  src={product.image_url}
                  alt={product.name}
                  className={cardStyles.image}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product);
                  }}
                  className="absolute top-3 right-3 bg-white/90 p-2 rounded-full hover:bg-white transition-all"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                    }`}
                  />
                </button>
              </div>

              <div className={cardStyles.content}>
                <h3 className={cardStyles.title}>{product.name}</h3>
                <p className={cardStyles.description}>{product.description}</p>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <span className={cardStyles.price}>₹{product.price}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className={cardStyles.comparePrice}>₹{product.compare_at_price}</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isInCart(product.id)) {
                        onCartClick();
                      } else {
                        addToCart(product);
                      }
                    }}
                    className={cardStyles.button}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{isInCart(product.id) ? 'In Cart' : 'Add'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

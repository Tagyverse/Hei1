import { ShoppingCart, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import LazyImage from './LazyImage';
import type { Category, Product } from '../types';
import { useCardDesign, getCardStyles } from '../hooks/useCardDesign';
import { objectToArray } from '../utils/publishedData';

interface FeaturedCategoriesProps {
  onNavigate: (page: 'shop', categoryId?: string) => void;
  onAddToCart: (product: Product) => void;
  onCartClick: () => void;
  onProductClick: (product: Product) => void;
}

interface CategoryWithProducts {
  category: Category;
  products: Product[];
}

export default function FeaturedCategories({ onNavigate, onAddToCart, onCartClick, onProductClick }: FeaturedCategoriesProps) {
  const { data: publishedData } = usePublishedData();
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const { isInCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { design } = useCardDesign('shop_by_category');
  const cardStyles = getCardStyles(design);

  useEffect(() => {
    if (!publishedData) {
      setLoading(false);
      return;
    }

    try {
      const categoriesArray: Category[] = objectToArray<Category>(publishedData.categories);
      const productsArray: Product[] = objectToArray<Product>(publishedData.products);

      const featuredCategories = categoriesArray.filter(cat => cat.featured === true);

      const categoriesWithProds: CategoryWithProducts[] = featuredCategories.map(category => ({
        category,
        products: productsArray.filter(product => {
          if (product.category_ids && product.category_ids.length > 0) {
            return product.category_ids.includes(category.id);
          }
          return product.category_id === category.id;
        }).slice(0, 4)
      })).filter(item => item.products.length > 0);

      setCategoriesWithProducts(categoriesWithProds);
      setLoading(false);
    } catch (error) {
      console.error('Error processing featured categories:', error);
      setLoading(false);
    }
  }, [publishedData]);

  if (loading || categoriesWithProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gradient-to-b from-white to-teal-50">
      {categoriesWithProducts.map(({ category, products }) => (
        <div key={category.id} className="mb-16 last:mb-0">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">{category.description}</p>
              )}
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
                            onAddToCart(product);
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

            <div className="text-center mt-8">
              <button
                onClick={() => onNavigate('shop', category.id)}
                className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
              >
                View All {category.name}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

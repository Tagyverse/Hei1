import { useState, useEffect } from 'react';
import { CheckSquare, Square, Percent, DollarSign, Tag, Eye, EyeOff, Trash2, Edit2, Layers, AlertCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, update, remove } from 'firebase/database';
import type { Product } from '../../types';
import LazyImage from '../LazyImage';

export default function BulkOperationsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [operationType, setOperationType] = useState<'discount' | 'price' | 'category' | 'visibility' | 'stock' | 'delete'>('discount');

  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newVisibility, setNewVisibility] = useState<boolean>(true);
  const [newStockStatus, setNewStockStatus] = useState<boolean>(true);
  const [priceAdjustment, setPriceAdjustment] = useState<'increase' | 'decrease'>('decrease');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const productsRef = ref(db, 'products');
      const snapshot = await get(productsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const productsArray = Object.entries(data).map(([id, product]: [string, any]) => ({
          id,
          ...product,
          // Normalize property names to handle both camelCase and snake_case
          image: product.image || product.image_url,
          category: product.category || product.category_id,
          inStock: product.inStock !== undefined ? product.inStock : product.in_stock,
          isVisible: product.isVisible !== undefined ? product.isVisible : product.is_visible,
          originalPrice: product.originalPrice || product.compare_at_price,
        }));
        setProducts(productsArray);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesRef = ref(db, 'categories');
      const snapshot = await get(categoriesRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const categoriesArray = Object.entries(data).map(([id, cat]: [string, any]) => cat.name);
        setCategories([...new Set(categoriesArray)]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const applyBulkOperation = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }

    if (operationType === 'discount' && !discountValue) {
      alert('Please enter a discount value');
      return;
    }

    if (operationType === 'price' && !discountValue) {
      alert('Please enter a price adjustment value');
      return;
    }

    if (operationType === 'category' && !newCategory) {
      alert('Please select a category');
      return;
    }

    if (operationType === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)? This action cannot be undone.`)) {
        return;
      }
    }

    const applyButton = document.querySelector('button[disabled]');
    if (applyButton) {
      (applyButton as HTMLButtonElement).disabled = true;
    }

    try {
      let processedCount = 0;
      const errors: string[] = [];

      for (const productId of selectedProducts) {
        try {
          const product = products.find(p => p.id === productId);
          if (!product) {
            console.warn(`Product ${productId} not found, skipping`);
            continue;
          }

          const productRef = ref(db, `products/${productId}`);
          const productUpdates: { [key: string]: any } = {};

          switch (operationType) {
            case 'discount': {
              const originalPrice = product.originalPrice || product.compare_at_price || product.price;
              let newPrice = originalPrice;

              if (discountType === 'percentage') {
                const discount = parseFloat(discountValue) || 0;
                if (discount < 0 || discount > 100) {
                  alert('Discount percentage must be between 0 and 100');
                  return;
                }
                newPrice = originalPrice * (1 - discount / 100);
              } else {
                const discount = parseFloat(discountValue) || 0;
                if (discount < 0) {
                  alert('Discount amount must be positive');
                  return;
                }
                newPrice = originalPrice - discount;
              }

              const finalPrice = Math.max(0, Math.round(newPrice * 100) / 100);
              productUpdates.price = finalPrice;
              productUpdates.compare_at_price = originalPrice;
              break;
            }

            case 'price': {
              const adjustment = parseFloat(discountValue) || 0;
              if (adjustment < 0) {
                alert('Adjustment value must be positive');
                return;
              }

              let newProductPrice = product.price;

              if (discountType === 'percentage') {
                if (adjustment > 100) {
                  alert('Percentage adjustment must not exceed 100%');
                  return;
                }
                if (priceAdjustment === 'increase') {
                  newProductPrice = product.price * (1 + adjustment / 100);
                } else {
                  newProductPrice = product.price * (1 - adjustment / 100);
                }
              } else {
                if (priceAdjustment === 'increase') {
                  newProductPrice = product.price + adjustment;
                } else {
                  newProductPrice = product.price - adjustment;
                }
              }

              const finalPrice = Math.max(0, Math.round(newProductPrice * 100) / 100);
              productUpdates.price = finalPrice;
              break;
            }

            case 'category': {
              if (newCategory) {
                productUpdates.category_id = newCategory;
              }
              break;
            }

            case 'visibility': {
              productUpdates.is_visible = newVisibility;
              break;
            }

            case 'stock': {
              productUpdates.in_stock = newStockStatus;
              break;
            }

            case 'delete': {
              await remove(productRef);
              processedCount++;
              continue;
            }
          }

          if (Object.keys(productUpdates).length > 0) {
            await update(productRef, productUpdates);
            processedCount++;
          }
        } catch (err: any) {
          console.error(`Error updating product ${productId}:`, err);
          errors.push(`Product ${productId}: ${err.message}`);
        }
      }

      if (processedCount === 0) {
        if (errors.length > 0) {
          alert(`Failed to update products:\n${errors.join('\n')}`);
        } else {
          alert('No products were processed. Please check your selection and try again.');
        }
        return;
      }

      if (errors.length > 0) {
        alert(`Partially completed: ${processedCount} product(s) updated, ${errors.length} failed.\n\nErrors:\n${errors.slice(0, 3).join('\n')}`);
      } else {
        alert(`Successfully applied bulk operation to ${processedCount} product(s)`);
      }

      setSelectedProducts(new Set());
      setDiscountValue('');
      setNewPrice('');
      setNewCategory('');
      await loadProducts();
    } catch (error: any) {
      console.error('Error applying bulk operation:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to apply bulk operation: ${errorMessage}\n\nPlease check the console for details and try again.`);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedProductsData = products.filter(p => selectedProducts.has(p.id));
  const totalOriginalValue = selectedProductsData.reduce((sum, p) => sum + (p.originalPrice || p.price), 0);
  const totalCurrentValue = selectedProductsData.reduce((sum, p) => sum + p.price, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <Layers className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Bulk Operations</h2>
            <p className="text-teal-50 mt-1">Select multiple products and apply changes in bulk</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            onClick={toggleAll}
            className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            {selectedProducts.size === filteredProducts.length ? (
              <>
                <CheckSquare className="w-5 h-5" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="w-5 h-5" />
                Select All ({filteredProducts.length})
              </>
            )}
          </button>
        </div>

        {selectedProducts.size > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900">
                  {selectedProducts.size} product(s) selected
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Total Original Value: ₹{totalOriginalValue.toFixed(2)} |
                  Current Value: ₹{totalCurrentValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 bg-gray-50 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Select Operation</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <button
              onClick={() => setOperationType('discount')}
              className={`p-4 rounded-lg border-2 transition-all ${
                operationType === 'discount'
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <Percent className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-semibold block">Apply Discount</span>
            </button>

            <button
              onClick={() => setOperationType('price')}
              className={`p-4 rounded-lg border-2 transition-all ${
                operationType === 'price'
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <DollarSign className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-semibold block">Adjust Price</span>
            </button>

            <button
              onClick={() => setOperationType('category')}
              className={`p-4 rounded-lg border-2 transition-all ${
                operationType === 'category'
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <Tag className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-semibold block">Change Category</span>
            </button>

            <button
              onClick={() => setOperationType('visibility')}
              className={`p-4 rounded-lg border-2 transition-all ${
                operationType === 'visibility'
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <Eye className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-semibold block">Toggle Visibility</span>
            </button>

            <button
              onClick={() => setOperationType('stock')}
              className={`p-4 rounded-lg border-2 transition-all ${
                operationType === 'stock'
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <Layers className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-semibold block">Update Stock</span>
            </button>

            <button
              onClick={() => setOperationType('delete')}
              className={`p-4 rounded-lg border-2 transition-all ${
                operationType === 'delete'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <Trash2 className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-semibold block">Delete Products</span>
            </button>
          </div>

          {operationType === 'discount' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 100'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                This will apply a discount from the original price of selected products
              </p>
            </div>
          )}

          {operationType === 'price' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Adjustment Type</label>
                  <select
                    value={priceAdjustment}
                    onChange={(e) => setPriceAdjustment(e.target.value as 'increase' | 'decrease')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Method</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'e.g., 10' : 'e.g., 50'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                This will {priceAdjustment} the current price by the specified amount
              </p>
            </div>
          )}

          {operationType === 'category' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {operationType === 'visibility' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility Status</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newVisibility === true}
                    onChange={() => setNewVisibility(true)}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-green-600" />
                    Visible
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newVisibility === false}
                    onChange={() => setNewVisibility(false)}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="flex items-center gap-2">
                    <EyeOff className="w-5 h-5 text-gray-600" />
                    Hidden
                  </span>
                </label>
              </div>
            </div>
          )}

          {operationType === 'stock' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Status</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newStockStatus === true}
                    onChange={() => setNewStockStatus(true)}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-green-600" />
                    In Stock
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newStockStatus === false}
                    onChange={() => setNewStockStatus(false)}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-red-600" />
                    Out of Stock
                  </span>
                </label>
              </div>
            </div>
          )}

          {operationType === 'delete' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">Warning: This action cannot be undone!</p>
              <p className="text-red-700 text-sm mt-1">
                Selected products will be permanently deleted from the database.
              </p>
            </div>
          )}

          <button
            onClick={applyBulkOperation}
            disabled={selectedProducts.size === 0 ||
              (operationType === 'discount' && !discountValue) ||
              (operationType === 'price' && !discountValue) ||
              (operationType === 'category' && !newCategory)
            }
            className={`w-full mt-6 py-3 rounded-lg font-semibold transition-colors ${
              operationType === 'delete'
                ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300'
                : 'bg-teal-600 hover:bg-teal-700 text-white disabled:bg-gray-300'
            } disabled:cursor-not-allowed`}
          >
            {operationType === 'delete'
              ? `Delete ${selectedProducts.size} Product(s)`
              : `Apply to ${selectedProducts.size} Product(s)`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all ${
              selectedProducts.has(product.id)
                ? 'ring-4 ring-teal-500'
                : 'hover:shadow-xl'
            }`}
          >
            <div className="relative">
              <LazyImage
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => toggleProduct(product.id)}
                className={`absolute top-3 right-3 p-2 rounded-lg shadow-lg transition-colors ${
                  selectedProducts.has(product.id)
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {selectedProducts.has(product.id) ? (
                  <CheckSquare className="w-6 h-6" />
                ) : (
                  <Square className="w-6 h-6" />
                )}
              </button>

              {!product.isVisible && (
                <div className="absolute top-3 left-3 bg-gray-900 text-white px-2 py-1 rounded text-xs font-semibold">
                  Hidden
                </div>
              )}

              {!product.inStock && (
                <div className="absolute bottom-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  Out of Stock
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1 truncate">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.category}</p>

              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-teal-600">₹{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-gray-400 line-through">
                      ₹{product.originalPrice}
                    </span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
}

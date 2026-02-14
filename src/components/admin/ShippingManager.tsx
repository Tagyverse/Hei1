import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { ref, get, set, update } from 'firebase/database';
import { Save, Truck } from 'lucide-react';
import { requireAdminAuth } from '../../utils/adminAuth';

export default function ShippingManager() {
  const [shippingPrice, setShippingPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadShippingPrice();
  }, []);

  const loadShippingPrice = async () => {
    try {
      const shippingRef = ref(db, 'settings/shipping_price');
      const snapshot = await get(shippingRef);
      if (snapshot.exists()) {
        setShippingPrice(snapshot.val());
      }
    } catch (error) {
      console.error('Error loading shipping price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!requireAdminAuth('update shipping price')) {
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const shippingRef = ref(db, 'settings/shipping_price');
      await update(ref(db, 'settings'), { shipping_price: shippingPrice, updated_by: 'admin' });
      setMessage('Shipping price updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving shipping price:', error);
      setMessage('Failed to update shipping price');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Truck className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Shipping Settings</h2>
      </div>

      <div className="max-w-md">
        <label className="block mb-2 font-medium text-gray-700">
          Shipping Price (₹)
        </label>
        <input
          type="number"
          value={shippingPrice}
          onChange={(e) => setShippingPrice(parseFloat(e.target.value) || 0)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="0"
          step="0.01"
        />
        <p className="text-sm text-gray-500 mt-2">
          This shipping charge will be applied to all orders
        </p>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

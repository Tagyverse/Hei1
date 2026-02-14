import React, { useState, useEffect } from 'react';
import { ref, set, get, update } from 'firebase/database';
import { requireAdminAuth } from '../../utils/adminAuth';
import { db } from '../../lib/firebase';
import { Info, Save } from 'lucide-react';

interface TaxSettings {
  is_enabled: boolean;
  tax_percentage: number;
  gst_number: string;
  tax_label: string;
  include_in_price: boolean;
}

export default function TaxManager() {
  const [settings, setSettings] = useState<TaxSettings>({
    is_enabled: false,
    tax_percentage: 18,
    gst_number: '',
    tax_label: 'GST',
    include_in_price: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsRef = ref(db, 'tax_settings');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        setSettings(snapshot.val());
      }
    } catch (error) {
      console.error('Error loading tax settings:', error);
      setMessage('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!requireAdminAuth('update tax settings')) {
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const settingsRef = ref(db, 'tax_settings');
      await update(settingsRef, {
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: 'admin'
      });

      setMessage('Tax settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving tax settings:', error);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Tax Settings</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">About Tax Settings</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Enable tax to show tax information on products and in cart. Tax can be included in the displayed price or added separately.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="is_enabled"
                checked={settings.is_enabled}
                onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-500"
              />
              <label htmlFor="is_enabled" className="flex-1 cursor-pointer">
                <span className="font-semibold text-gray-800">Enable Tax</span>
                <p className="text-sm text-gray-600">Show tax information on products and cart</p>
              </label>
            </div>

            {settings.is_enabled && (
              <>
                <div>
                  <label htmlFor="tax_label" className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Label
                  </label>
                  <input
                    type="text"
                    id="tax_label"
                    value={settings.tax_label}
                    onChange={(e) => setSettings({ ...settings, tax_label: e.target.value })}
                    placeholder="e.g., GST, VAT, Sales Tax"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">This label will be shown to customers</p>
                </div>

                <div>
                  <label htmlFor="tax_percentage" className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="tax_percentage"
                      value={settings.tax_percentage}
                      onChange={(e) => setSettings({ ...settings, tax_percentage: parseFloat(e.target.value) || 0 })}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Enter tax rate (0-100)</p>
                </div>

                <div>
                  <label htmlFor="gst_number" className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number / Tax ID
                  </label>
                  <input
                    type="text"
                    id="gst_number"
                    value={settings.gst_number}
                    onChange={(e) => setSettings({ ...settings, gst_number: e.target.value.toUpperCase() })}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent uppercase"
                  />
                  <p className="text-sm text-gray-500 mt-1">Your business GST/Tax identification number</p>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="include_in_price"
                    checked={settings.include_in_price}
                    onChange={(e) => setSettings({ ...settings, include_in_price: e.target.checked })}
                    className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-500"
                  />
                  <label htmlFor="include_in_price" className="flex-1 cursor-pointer">
                    <span className="font-semibold text-gray-800">Tax Included in Price</span>
                    <p className="text-sm text-gray-600">
                      {settings.include_in_price
                        ? 'Product prices already include tax (shows "Tax included")'
                        : 'Tax will be added on top of product prices at checkout'}
                    </p>
                  </label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Preview:</strong> {settings.include_in_price
                      ? `Products will show "Inclusive of ${settings.tax_label} ${settings.tax_percentage}%"`
                      : `${settings.tax_label} ${settings.tax_percentage}% will be added to cart total`}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <div>
              {message && (
                <p className={`text-sm font-medium ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How Tax Display Works</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• When tax is <strong>enabled with "Include in Price"</strong>: Products show "Inclusive of {settings.tax_label} {settings.tax_percentage}%"</li>
          <li>• When tax is <strong>enabled without "Include in Price"</strong>: Tax is added separately in cart breakdown</li>
          <li>• When tax is <strong>disabled</strong>: No tax information is shown anywhere</li>
          <li>• GST number will be displayed on invoices and order confirmations</li>
        </ul>
      </div>
    </div>
  );
}

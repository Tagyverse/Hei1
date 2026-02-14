import { useState, useEffect, useRef } from 'react';
import { FileText, Save, Eye, Upload, X, Type, Palette, Layout, Image as ImageIcon, Loader2, Truck } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set } from 'firebase/database';
import R2ImageSelectorDialog from './R2ImageSelectorDialog';
import { fetchDeliveryCharge } from '../../utils/billGenerator';

interface BillSettings {
  // Header Settings
  logo_url: string;
  company_name: string;
  company_tagline: string;
  company_address: string;
  company_email: string;
  company_phone: string;
  company_gst: string;
  
  // Layout Settings
  layout_style: 'modern' | 'classic' | 'minimal' | 'detailed';
  show_product_images: boolean;
  show_shipping_label: boolean;
  show_cut_line: boolean;
  
  // Color Theme
  primary_color: string;
  secondary_color: string;
  header_bg_color: string;
  table_header_color: string;
  
  // Font Settings
  font_family: string;
  header_font_size: number;
  body_font_size: number;
  
  // Footer Settings
  footer_text: string;
  thank_you_message: string;
  
  // From Address (Shipping Label)
  from_name: string;
  from_address: string;
  from_city: string;
  from_state: string;
  from_pincode: string;
  from_phone: string;
  
  // Shipping Settings
  free_delivery_minimum_amount?: number;
  show_free_delivery_badge?: boolean;
}

const defaultSettings: BillSettings = {
  logo_url: '',
  company_name: 'Pixie Blooms',
  company_tagline: 'Beautiful flowers for every occasion',
  company_address: 'Atchukattu Street, Thiruppathur',
  company_email: 'pixieblooms2512@gmail.com',
  company_phone: '+91 9876543210',
  company_gst: '',
  
  layout_style: 'modern',
  show_product_images: true,
  show_shipping_label: true,
  show_cut_line: true,
  
  primary_color: '#000000',
  secondary_color: '#333333',
  header_bg_color: '#ffffff',
  table_header_color: '#000000',
  
  font_family: 'Inter',
  header_font_size: 24,
  body_font_size: 12,
  
  footer_text: 'This is a computer-generated invoice and does not require a signature.',
  thank_you_message: 'Thank you for your business!',
  
  from_name: 'Pixie Blooms',
  from_address: 'Atchukattu Street',
  from_city: 'Thiruppathur',
  from_state: 'Tamil Nadu',
  from_pincode: '630211',
  from_phone: '+91 9876543210',
  
  // Shipping settings
  free_delivery_minimum_amount: 2000,
  show_free_delivery_badge: true,
};

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
];

const layoutOptions = [
  { value: 'modern', label: 'Modern', description: 'Clean, minimal design with bold accents' },
  { value: 'classic', label: 'Classic', description: 'Traditional invoice layout' },
  { value: 'minimal', label: 'Minimal', description: 'Simple and clean' },
  { value: 'detailed', label: 'Detailed', description: 'Full information with all details' },
];

const themeOptions = [
  { value: 'professional', label: 'Professional', description: 'Corporate black & white' },
  { value: 'modern', label: 'Modern', description: 'Blue contemporary design' },
  { value: 'classic', label: 'Classic', description: 'Red traditional style' },
  { value: 'minimal', label: 'Minimal', description: 'Clean & simple' },
];

export default function BillCustomizer() {
  const [settings, setSettings] = useState<BillSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showLogoGallery, setShowLogoGallery] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSettings();
    loadDeliveryCharge();
  }, []);

  const loadDeliveryCharge = async () => {
    try {
      const charge = await fetchDeliveryCharge(db);
      setDeliveryCharge(charge);
      console.log('[v0] Delivery charge loaded:', charge);
    } catch (error) {
      console.warn('[v0] Could not load delivery charge:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settingsRef = ref(db, 'bill_settings');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        const loadedSettings = { ...defaultSettings, ...snapshot.val() };
        setSettings(loadedSettings);
        // Also save to localStorage for immediate access
        localStorage.setItem('billSettings', JSON.stringify(loadedSettings));
      } else {
        // If no Firebase settings, use defaults and save to localStorage
        localStorage.setItem('billSettings', JSON.stringify(defaultSettings));
      }
    } catch (error) {
      console.error('Error loading bill settings:', error);
      // Fallback to localStorage if Firebase fails
      try {
        const saved = localStorage.getItem('billSettings');
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsRef = ref(db, 'bill_settings');
      
      console.log('[v0] Saving bill settings...', Object.keys(settings).length, 'fields');
      
      // Prepare settings data with timestamp
      const dataToSave = {
        ...settings,
        updated_at: new Date().toISOString(),
      };
      
      console.log('[v0] Data to save:', Object.keys(dataToSave));
      
      // Save settings to Firebase
      await set(settingsRef, dataToSave);
      
      console.log('[v0] Firebase save completed');
      
      // Save to localStorage for immediate access
      localStorage.setItem('billSettings', JSON.stringify(settings));
      
      console.log('[v0] LocalStorage save completed');
      console.log('[v0] Bill settings saved successfully!');
      
      alert('Bill settings saved successfully!');
    } catch (error: any) {
      console.error('[v0] Bill Settings Error:', {
        message: error.message,
        code: error.code,
        name: error.name,
        full: error,
      });
      
      const errorMsg = error.message || error.code || 'Failed to save settings';
      alert('Error saving settings: ' + errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof BillSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const generatePreviewHTML = () => {
    const s = settings;
    return `
      <div style="font-family: '${s.font_family}', sans-serif; max-width: 100%; padding: 20px; background: white; border: 2px solid ${s.primary_color};">
        <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid ${s.primary_color}; padding-bottom: 15px; margin-bottom: 20px; background: ${s.header_bg_color};">
          <div style="display: flex; align-items: center; gap: 15px;">
            ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" style="width: 60px; height: 60px; object-fit: contain;" />` : ''}
            <div>
              <div style="font-size: ${s.header_font_size}px; font-weight: bold; color: ${s.primary_color};">${s.company_name}</div>
              ${s.company_tagline ? `<div style="font-size: ${s.body_font_size}px; color: ${s.secondary_color};">${s.company_tagline}</div>` : ''}
              <div style="font-size: ${s.body_font_size - 1}px; color: ${s.secondary_color}; margin-top: 5px;">
                ${s.company_email}<br/>
                ${s.company_phone}
                ${s.company_gst ? `<br/>GST: ${s.company_gst}` : ''}
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <h1 style="font-size: 28px; color: ${s.primary_color}; margin: 0;">INVOICE</h1>
            <p style="font-size: ${s.body_font_size}px; color: ${s.secondary_color};">Order #ABC12345</p>
            <p style="font-size: ${s.body_font_size}px; color: ${s.secondary_color};">Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: ${s.table_header_color}; color: white;">
              <th style="padding: 10px; text-align: left; font-size: ${s.body_font_size}px;">Product</th>
              <th style="padding: 10px; text-align: center; font-size: ${s.body_font_size}px;">Qty</th>
              <th style="padding: 10px; text-align: right; font-size: ${s.body_font_size}px;">Price</th>
              <th style="padding: 10px; text-align: right; font-size: ${s.body_font_size}px;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-size: ${s.body_font_size}px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  ${s.show_product_images ? '<div style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 4px;"></div>' : ''}
                  <span>Sample Product Name</span>
                </div>
              </td>
              <td style="padding: 10px; text-align: center; font-size: ${s.body_font_size}px;">2</td>
              <td style="padding: 10px; text-align: right; font-size: ${s.body_font_size}px;">₹500.00</td>
              <td style="padding: 10px; text-align: right; font-size: ${s.body_font_size}px;">₹1,000.00</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-size: ${s.body_font_size}px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  ${s.show_product_images ? '<div style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 4px;"></div>' : ''}
                  <span>Another Product</span>
                </div>
              </td>
              <td style="padding: 10px; text-align: center; font-size: ${s.body_font_size}px;">1</td>
              <td style="padding: 10px; text-align: right; font-size: ${s.body_font_size}px;">₹750.00</td>
              <td style="padding: 10px; text-align: right; font-size: ${s.body_font_size}px;">₹750.00</td>
            </tr>
          </tbody>
        </table>
        
        <div style="width: 250px; margin-left: auto;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; font-size: ${s.body_font_size}px;">
            <span>Subtotal</span><span>₹1,750.00</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; font-size: ${s.body_font_size}px;">
            <span>Shipping</span><span>₹50.00</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 15px; background: ${s.primary_color}; color: white; margin-top: 8px; font-size: 16px; font-weight: bold;">
            <span>Total</span><span>₹1,800.00</span>
          </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center; font-size: ${s.body_font_size + 2}px; color: ${s.primary_color}; font-weight: 600;">
          ${s.thank_you_message}
        </div>
        
        ${s.show_cut_line ? `
          <div style="margin: 20px 0; border-top: 2px dashed #666; position: relative; text-align: center;">
            <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: white; padding: 0 12px; font-size: 10px; color: #000;">✂ CUT HERE ✂</span>
          </div>
        ` : ''}
        
        ${s.show_shipping_label ? `
          <div style="display: flex; gap: 20px; margin-top: 15px;">
            <div style="flex: 1; border: 2px solid ${s.primary_color}; padding: 15px;">
              <h3 style="font-size: 12px; text-transform: uppercase; margin: 0 0 10px; border-bottom: 2px solid ${s.primary_color}; padding-bottom: 5px;">From</h3>
              <p style="font-size: 11px; margin: 0; line-height: 1.6;">
                <strong>${s.from_name}</strong><br/>
                ${s.from_address}<br/>
                ${s.from_city}, ${s.from_state}<br/>
                PIN: ${s.from_pincode}<br/>
                Mobile: ${s.from_phone}
              </p>
            </div>
            <div style="flex: 1; border: 2px solid ${s.primary_color}; padding: 15px;">
              <h3 style="font-size: 12px; text-transform: uppercase; margin: 0 0 10px; border-bottom: 2px solid ${s.primary_color}; padding-bottom: 5px;">Ship To</h3>
              <p style="font-size: 11px; margin: 0; line-height: 1.6;">
                <strong>John Doe</strong><br/>
                123 Sample Street<br/>
                Chennai, Tamil Nadu<br/>
                PIN: 600001<br/>
                Mobile: +91 9876543210
              </p>
            </div>
          </div>
        ` : ''}
        
        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid ${s.primary_color}; text-align: center; font-size: 10px; color: ${s.secondary_color};">
          <p>${s.footer_text}</p>
          <p>For queries: ${s.company_email}</p>
        </div>
      </div>
    `;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bill Customizer</h2>
            <p className="text-sm text-gray-600">Customize your invoice/bill design</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Type className="w-5 h-5 text-teal-600" />
              Company Information
            </h3>
            
            <div className="space-y-4">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  {settings.logo_url ? (
                    <div className="relative">
                      <img src={settings.logo_url} alt="Logo" className="w-16 h-16 object-contain border rounded-lg" />
                      <button
                        onClick={() => handleChange('logo_url', '')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => setShowLogoGallery(true)}
                    className="px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors text-sm"
                  >
                    Browse Gallery
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={settings.company_tagline}
                    onChange={(e) => handleChange('company_tagline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={settings.company_address}
                  onChange={(e) => handleChange('company_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={settings.company_email}
                    onChange={(e) => handleChange('company_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={settings.company_phone}
                    onChange={(e) => handleChange('company_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  value={settings.company_gst}
                  onChange={(e) => handleChange('company_gst', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., 22AAAAA0000A1Z5"
                />
              </div>
            </div>
          </div>

          {/* Theme Presets */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-teal-600" />
              Design Themes
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {themeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    const BILL_THEMES: any = {
                      professional: { primary_color: '#1a1a1a', secondary_color: '#666666', header_bg_color: '#1a1a1a', table_header_color: '#1a1a1a', header_font_size: 32, body_font_size: 12 },
                      modern: { primary_color: '#2563eb', secondary_color: '#64748b', header_bg_color: '#2563eb', table_header_color: '#2563eb', header_font_size: 36, body_font_size: 13 },
                      classic: { primary_color: '#c41e3a', secondary_color: '#333333', header_bg_color: '#c41e3a', table_header_color: '#c41e3a', header_font_size: 34, body_font_size: 12 },
                      minimal: { primary_color: '#000000', secondary_color: '#777777', header_bg_color: '#ffffff', table_header_color: '#f0f0f0', header_font_size: 28, body_font_size: 11 },
                    };
                    const theme = BILL_THEMES[option.value];
                    setSettings(prev => ({ ...prev, ...theme }));
                  }}
                  className="p-4 text-left rounded-lg border-2 border-gray-200 hover:border-teal-500 transition-all"
                >
                  <div className="font-semibold text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Layout Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layout className="w-5 h-5 text-teal-600" />
              Layout Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Layout Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {layoutOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleChange('layout_style', option.value)}
                      className={`p-3 text-left rounded-lg border-2 transition-colors ${
                        settings.layout_style === option.value
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_product_images}
                    onChange={(e) => handleChange('show_product_images', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Show product images in bill</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_shipping_label}
                    onChange={(e) => handleChange('show_shipping_label', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Show shipping labels (From/To)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_cut_line}
                    onChange={(e) => handleChange('show_cut_line', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Show cut line separator</span>
                </label>
              </div>
            </div>
          </div>

          {/* Shipping Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-teal-600" />
              Shipping Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Delivery Minimum Amount (₹)
                </label>
                <input
                  type="number"
                  value={settings.free_delivery_minimum_amount || 2000}
                  onChange={(e) => handleChange('free_delivery_minimum_amount', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter minimum amount for free delivery"
                />
                <p className="text-xs text-gray-500 mt-1">Orders above this amount will get free delivery</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.show_free_delivery_badge || false}
                  onChange={(e) => handleChange('show_free_delivery_badge', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Show 'FREE DELIVERY' badge on qualifying orders</span>
              </label>
            </div>
          </div>

          {/* Color Theme */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-teal-600" />
              Color Theme
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Header Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.header_bg_color}
                    onChange={(e) => handleChange('header_bg_color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.header_bg_color}
                    onChange={(e) => handleChange('header_bg_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Header</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.table_header_color}
                    onChange={(e) => handleChange('table_header_color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.table_header_color}
                    onChange={(e) => handleChange('table_header_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Font Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Type className="w-5 h-5 text-teal-600" />
              Font Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                <select
                  value={settings.font_family}
                  onChange={(e) => handleChange('font_family', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  {fontOptions.map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Header Font Size</label>
                  <input
                    type="number"
                    value={settings.header_font_size}
                    onChange={(e) => handleChange('header_font_size', parseInt(e.target.value))}
                    min="16"
                    max="48"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Font Size</label>
                  <input
                    type="number"
                    value={settings.body_font_size}
                    onChange={(e) => handleChange('body_font_size', parseInt(e.target.value))}
                    min="8"
                    max="18"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer & Messages */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Footer & Messages</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thank You Message</label>
                <input
                  type="text"
                  value={settings.thank_you_message}
                  onChange={(e) => handleChange('thank_you_message', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                <textarea
                  value={settings.footer_text}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* From Address (Shipping Label) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping From Address</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={settings.from_name}
                  onChange={(e) => handleChange('from_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={settings.from_address}
                  onChange={(e) => handleChange('from_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={settings.from_city}
                    onChange={(e) => handleChange('from_city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={settings.from_state}
                    onChange={(e) => handleChange('from_state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={settings.from_pincode}
                    onChange={(e) => handleChange('from_pincode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={settings.from_phone}
                    onChange={(e) => handleChange('from_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="bg-gray-100 rounded-xl p-4 sticky top-4 max-h-[calc(100vh-200px)] overflow-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </h3>
            <div 
              ref={previewRef}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
              style={{ transform: 'scale(0.75)', transformOrigin: 'top left', width: '133.33%' }}
              dangerouslySetInnerHTML={{ __html: generatePreviewHTML() }}
            />
          </div>
        )}
      </div>

      {/* Logo Gallery Dialog */}
      <R2ImageSelectorDialog
        isOpen={showLogoGallery}
        onClose={() => setShowLogoGallery(false)}
        onSelect={(url) => {
          if (typeof url === 'string') {
            handleChange('logo_url', url);
          }
        }}
        multiple={false}
        currentValue={settings.logo_url}
        title="Select Logo"
      />
    </div>
  );
}

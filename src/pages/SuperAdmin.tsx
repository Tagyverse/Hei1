import { useState, useEffect } from 'react';
import { Settings, Home, CreditCard, Save, Plus, Trash2, Eye, EyeOff, Edit2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, get, set } from 'firebase/database';
import LazyImage from '../components/LazyImage';

interface HomepageSection {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  content: any;
  isVisible: boolean;
  order: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  iconUrl: string;
  isActive: boolean;
  order: number;
}

interface PaymentGateway {
  provider: string;
  isEnabled: boolean;
  apiKey: string;
  secretKey: string;
  webhookUrl: string;
  settings: any;
}

const defaultSections: HomepageSection[] = [
  {
    id: '1',
    type: 'hero',
    title: 'Welcome to Pixie Blooms',
    subtitle: 'Where Every Accessory Tells a Story',
    content: { buttonText: 'Shop Now', buttonLink: '/shop' },
    isVisible: true,
    order: 1
  },
  {
    id: '2',
    type: 'welcome_banner',
    title: 'Welcome to Pixie Blooms!',
    subtitle: 'Discover our exclusive collection of handcrafted hair accessories',
    content: {},
    isVisible: true,
    order: 2
  },
  {
    id: '3',
    type: 'top_banner',
    title: '🎉 Grand Opening Sale! Get 20% OFF on all items!',
    subtitle: '',
    content: { backgroundColor: '#f59e0b' },
    isVisible: true,
    order: 3
  }
];

const defaultPaymentMethods: PaymentMethod[] = [
  { id: '1', name: 'Visa', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg', isActive: true, order: 1 },
  { id: '2', name: 'Mastercard', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg', isActive: true, order: 2 },
  { id: '3', name: 'RuPay', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/RuPay.svg', isActive: true, order: 3 },
  { id: '4', name: 'UPI', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg', isActive: true, order: 4 },
  { id: '5', name: 'PhonePe', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/42/PhonePe_Logo.svg', isActive: true, order: 5 },
  { id: '6', name: 'Paytm', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg', isActive: true, order: 6 }
];

const defaultGateways: PaymentGateway[] = [
  { provider: 'Stripe', isEnabled: false, apiKey: '', secretKey: '', webhookUrl: '', settings: { currency: 'INR' } },
  { provider: 'Razorpay', isEnabled: false, apiKey: '', secretKey: '', webhookUrl: '', settings: { currency: 'INR' } },
  { provider: 'PayPal', isEnabled: false, apiKey: '', secretKey: '', webhookUrl: '', settings: { currency: 'USD' } }
];

interface SiteContent {
  key: string;
  value: any;
}

export default function SuperAdmin() {
  const [activeTab, setActiveTab] = useState<'homepage' | 'payments' | 'gateways' | 'site'>('homepage');
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const sectionsRef = ref(db, 'homepage_sections');
        const methodsRef = ref(db, 'payment_methods');
        const gatewaysRef = ref(db, 'payment_gateways');
        const contentRef = ref(db, 'site_content');

        const [sectionsSnap, methodsSnap, gatewaysSnap, contentSnap] = await Promise.all([
          get(sectionsRef),
          get(methodsRef),
          get(gatewaysRef),
          get(contentRef)
        ]);

        if (sectionsSnap.exists()) {
          const data = sectionsSnap.val();
          setSections(Object.keys(data).map(key => ({ ...data[key], id: key })));
        } else {
          const sectionsData: any = {};
          defaultSections.forEach(section => {
            sectionsData[section.id] = section;
          });
          await set(sectionsRef, sectionsData);
          setSections(defaultSections);
        }

        if (methodsSnap.exists()) {
          const data = methodsSnap.val();
          setPaymentMethods(Object.keys(data).map(key => ({ ...data[key], id: key })));
        } else {
          const methodsData: any = {};
          defaultPaymentMethods.forEach(method => {
            methodsData[method.id] = method;
          });
          await set(methodsRef, methodsData);
          setPaymentMethods(defaultPaymentMethods);
        }

        if (gatewaysSnap.exists()) {
          const data = gatewaysSnap.val();
          setPaymentGateways(Object.values(data));
        } else {
          const gatewaysData: any = {};
          defaultGateways.forEach(gateway => {
            gatewaysData[gateway.provider] = gateway;
          });
          await set(gatewaysRef, gatewaysData);
          setPaymentGateways(defaultGateways);
        }

        if (contentSnap.exists()) {
          const data = contentSnap.val();
          setSiteContent(Object.values(data));
        } else {
          const defaultContent = [
            { key: 'top_banner', value: { text: '🎉 Grand Opening Sale! Get 20% OFF on all items!', isVisible: true, backgroundColor: '#f59e0b' } },
            { key: 'welcome_banner', value: { title: 'Welcome to Pixie Blooms!', subtitle: 'Discover our exclusive collection of handcrafted hair accessories', isVisible: true } },
            { key: 'footer_text', value: { companyName: 'Pixie Blooms', tagline: 'Where Every Accessory Tells a Story', copyright: '© 2025 Pixie Blooms. All rights reserved.' } }
          ];
          const contentData: any = {};
          defaultContent.forEach(content => {
            contentData[content.key] = content;
          });
          await set(contentRef, contentData);
          setSiteContent(defaultContent);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    loadData();
  }, []);

  const saveData = async () => {
    try {
      const sectionsData: any = {};
      sections.forEach(section => {
        sectionsData[section.id] = section;
      });

      const methodsData: any = {};
      paymentMethods.forEach(method => {
        methodsData[method.id] = method;
      });

      const gatewaysData: any = {};
      paymentGateways.forEach(gateway => {
        gatewaysData[gateway.provider] = gateway;
      });

      const contentData: any = {};
      siteContent.forEach(content => {
        contentData[content.key] = content;
      });

      await Promise.all([
        set(ref(db, 'homepage_sections'), sectionsData),
        set(ref(db, 'payment_methods'), methodsData),
        set(ref(db, 'payment_gateways'), gatewaysData),
        set(ref(db, 'site_content'), contentData)
      ]);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const updateSiteContent = (key: string, updates: any) => {
    setSiteContent(siteContent.map(c => c.key === key ? { ...c, value: { ...c.value, ...updates } } : c));
  };

  const addSection = () => {
    const newSection: HomepageSection = {
      id: Date.now().toString(),
      type: 'custom',
      title: 'New Section',
      subtitle: '',
      content: {},
      isVisible: true,
      order: sections.length + 1
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, updates: Partial<HomepageSection>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const addPaymentMethod = () => {
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      name: 'New Payment Method',
      iconUrl: '',
      isActive: true,
      order: paymentMethods.length + 1
    };
    setPaymentMethods([...paymentMethods, newMethod]);
  };

  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethod>) => {
    setPaymentMethods(paymentMethods.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(m => m.id !== id));
  };

  const updateGateway = (provider: string, updates: Partial<PaymentGateway>) => {
    setPaymentGateways(paymentGateways.map(g => g.provider === provider ? { ...g, ...updates } : g));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 text-white">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Super Admin Panel
            </h1>
            <p className="text-pink-100 mt-2">Manage all aspects of your website</p>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex gap-1 p-4">
              <button
                onClick={() => setActiveTab('homepage')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'homepage'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Home className="w-5 h-5" />
                Homepage
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'payments'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </button>
              <button
                onClick={() => setActiveTab('gateways')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'gateways'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings className="w-5 h-5" />
                Payment Gateways
              </button>
              <button
                onClick={() => setActiveTab('site')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'site'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Edit2 className="w-5 h-5" />
                Site Content
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'homepage' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Homepage Sections</h2>
                  <button
                    onClick={addSection}
                    className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add Section
                  </button>
                </div>

                <div className="space-y-4">
                  {sections.map((section) => (
                    <div key={section.id} className="bg-white border-2 border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {section.type}
                          </span>
                          <button
                            onClick={() => updateSection(section.id, { isVisible: !section.isVisible })}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {section.isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteSection(section.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {editingSection === section.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Section Type</label>
                            <input
                              type="text"
                              value={section.type}
                              onChange={(e) => updateSection(section.id, { type: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                            <input
                              type="text"
                              value={section.subtitle}
                              onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Content (JSON)</label>
                            <textarea
                              value={JSON.stringify(section.content, null, 2)}
                              onChange={(e) => {
                                try {
                                  updateSection(section.id, { content: JSON.parse(e.target.value) });
                                } catch (error) {
                                  console.error('Invalid JSON');
                                }
                              }}
                              rows={4}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                            <input
                              type="number"
                              value={section.order}
                              onChange={(e) => updateSection(section.id, { order: parseInt(e.target.value) })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{section.title}</h3>
                          {section.subtitle && <p className="text-gray-600 mt-1">{section.subtitle}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Payment Methods</h2>
                  <button
                    onClick={addPaymentMethod}
                    className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add Method
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="bg-white border-2 border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {method.iconUrl && (
                            <LazyImage src={method.iconUrl} alt={method.name} className="h-8 w-auto" />
                          )}
                          <div>
                            <input
                              type="text"
                              value={method.name}
                              onChange={(e) => updatePaymentMethod(method.id, { name: e.target.value })}
                              className="font-semibold text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-pink-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updatePaymentMethod(method.id, { isActive: !method.isActive })}
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              method.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {method.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => deletePaymentMethod(method.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
                          <input
                            type="text"
                            value={method.iconUrl}
                            onChange={(e) => updatePaymentMethod(method.id, { iconUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                          <input
                            type="number"
                            value={method.order}
                            onChange={(e) => updatePaymentMethod(method.id, { order: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'gateways' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Payment Gateway Integration</h2>

                <div className="space-y-6">
                  {paymentGateways.map((gateway) => (
                    <div key={gateway.provider} className="bg-white border-2 border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800">{gateway.provider}</h3>
                        <button
                          onClick={() => updateGateway(gateway.provider, { isEnabled: !gateway.isEnabled })}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            gateway.isEnabled
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {gateway.isEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                          <input
                            type="password"
                            value={gateway.apiKey}
                            onChange={(e) => updateGateway(gateway.provider, { apiKey: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="Enter API key"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                          <input
                            type="password"
                            value={gateway.secretKey}
                            onChange={(e) => updateGateway(gateway.provider, { secretKey: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="Enter secret key"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                          <input
                            type="text"
                            value={gateway.webhookUrl}
                            onChange={(e) => updateGateway(gateway.provider, { webhookUrl: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="https://your-domain.com/webhook"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Settings (JSON)</label>
                          <textarea
                            value={JSON.stringify(gateway.settings, null, 2)}
                            onChange={(e) => {
                              try {
                                updateGateway(gateway.provider, { settings: JSON.parse(e.target.value) });
                              } catch (error) {
                                console.error('Invalid JSON');
                              }
                            }}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'site' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Site Content</h2>

                <div className="space-y-6">
                  {siteContent.map((content) => (
                    <div key={content.key} className="bg-white border-2 border-gray-200 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 capitalize">
                        {content.key.replace(/_/g, ' ')}
                      </h3>

                      {content.key === 'top_banner' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Banner Text</label>
                            <input
                              type="text"
                              value={content.value.text}
                              onChange={(e) => updateSiteContent(content.key, { text: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                            <input
                              type="color"
                              value={content.value.backgroundColor}
                              onChange={(e) => updateSiteContent(content.key, { backgroundColor: e.target.value })}
                              className="w-full h-12 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="top-banner-visible"
                              checked={content.value.isVisible}
                              onChange={(e) => updateSiteContent(content.key, { isVisible: e.target.checked })}
                              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                            />
                            <label htmlFor="top-banner-visible" className="text-sm font-medium text-gray-700">
                              Show Banner
                            </label>
                          </div>
                        </div>
                      )}

                      {content.key === 'welcome_banner' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                            <input
                              type="text"
                              value={content.value.title}
                              onChange={(e) => updateSiteContent(content.key, { title: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                            <input
                              type="text"
                              value={content.value.subtitle}
                              onChange={(e) => updateSiteContent(content.key, { subtitle: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="welcome-banner-visible"
                              checked={content.value.isVisible}
                              onChange={(e) => updateSiteContent(content.key, { isVisible: e.target.checked })}
                              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                            />
                            <label htmlFor="welcome-banner-visible" className="text-sm font-medium text-gray-700">
                              Show Banner
                            </label>
                          </div>
                        </div>
                      )}

                      {content.key === 'footer_text' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                            <input
                              type="text"
                              value={content.value.companyName}
                              onChange={(e) => updateSiteContent(content.key, { companyName: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                            <input
                              type="text"
                              value={content.value.tagline}
                              onChange={(e) => updateSiteContent(content.key, { tagline: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Text</label>
                            <input
                              type="text"
                              value={content.value.copyright}
                              onChange={(e) => updateSiteContent(content.key, { copyright: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={saveData}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                <Save className="w-5 h-5" />
                Save All Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            <span className="font-semibold">Changes saved successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
}

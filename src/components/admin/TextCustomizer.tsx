import { useState, useEffect } from 'react';
import { Save, Type } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set } from 'firebase/database';

interface TextContent {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'textarea';
  section: string;
}

export default function TextCustomizer() {
  const [textContents, setTextContents] = useState<TextContent[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('header');

  const defaultContents: TextContent[] = [
    { key: 'site_title', label: 'Site Title', value: 'Pixie Blooms', type: 'text', section: 'header' },
    { key: 'site_tagline', label: 'Site Tagline', value: 'Premium Hair Accessories', type: 'text', section: 'header' },
    { key: 'welcome_title', label: 'Welcome Banner Title', value: 'Welcome to Pixie Blooms!', type: 'text', section: 'home' },
    { key: 'welcome_subtitle', label: 'Welcome Banner Subtitle', value: 'Discover our exclusive collection of handcrafted hair accessories', type: 'text', section: 'home' },
    { key: 'shop_title', label: 'Shop Page Title', value: 'Shop Our Collection', type: 'text', section: 'shop' },
    { key: 'shop_subtitle', label: 'Shop Page Subtitle', value: 'Browse our carefully curated selection', type: 'text', section: 'shop' },
    { key: 'featured_categories_title', label: 'Featured Categories Title', value: 'Shop by Category', type: 'text', section: 'home' },
    { key: 'customer_reviews_title', label: 'Customer Reviews Title', value: 'What Our Customers Say', type: 'text', section: 'home' },
    { key: 'faq_title', label: 'FAQ Section Title', value: 'Frequently Asked Questions', type: 'text', section: 'home' },
    { key: 'faq_subtitle', label: 'FAQ Section Subtitle', value: 'Find answers to common questions', type: 'text', section: 'home' },
    { key: 'footer_company_name', label: 'Footer Company Name', value: 'Pixie Blooms', type: 'text', section: 'footer' },
    { key: 'footer_tagline', label: 'Footer Tagline', value: 'Where Every Accessory Tells a Story', type: 'text', section: 'footer' },
    { key: 'footer_copyright', label: 'Footer Copyright', value: '© 2025 Pixie Blooms. All rights reserved.', type: 'text', section: 'footer' },
    { key: 'contact_email', label: 'Contact Email', value: 'hello@pixieblooms.com', type: 'text', section: 'contact' },
    { key: 'contact_phone', label: 'Contact Phone', value: '+919345259073', type: 'text', section: 'contact' },
    { key: 'about_text', label: 'About Us Text', value: 'We create beautiful, handcrafted hair accessories with love and attention to detail.', type: 'textarea', section: 'footer' }
  ];

  useEffect(() => {
    loadTextContents();
  }, []);

  const loadTextContents = async () => {
    try {
      const contentsRef = ref(db, 'text_contents');
      const snapshot = await get(contentsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const contentsArray = Object.keys(data).map(key => ({
          ...data[key],
          key
        }));
        setTextContents(contentsArray);
      } else {
        const contentsData: any = {};
        defaultContents.forEach(content => {
          contentsData[content.key] = {
            label: content.label,
            value: content.value,
            type: content.type,
            section: content.section
          };
        });
        await set(contentsRef, contentsData);
        setTextContents(defaultContents);
      }
    } catch (error) {
      console.error('Error loading text contents:', error);
      setTextContents(defaultContents);
    }
  };

  const saveTextContents = async () => {
    setSaving(true);
    try {
      const contentsData: any = {};
      textContents.forEach(content => {
        contentsData[content.key] = {
          label: content.label,
          value: content.value,
          type: content.type,
          section: content.section
        };
      });

      await set(ref(db, 'text_contents'), contentsData);
      alert('Text content saved successfully!');
    } catch (error) {
      console.error('Error saving text contents:', error);
      alert('Failed to save text content');
    } finally {
      setSaving(false);
    }
  };

  const updateContent = (key: string, value: string) => {
    setTextContents(textContents.map(content =>
      content.key === key ? { ...content, value } : content
    ));
  };

  const sections = [
    { id: 'header', label: 'Header' },
    { id: 'home', label: 'Home Page' },
    { id: 'shop', label: 'Shop Page' },
    { id: 'footer', label: 'Footer' },
    { id: 'contact', label: 'Contact' }
  ];

  const filteredContents = textContents.filter(content => content.section === activeSection);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Text Content Manager</h3>
        <button
          onClick={saveTextContents}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeSection === section.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {filteredContents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No content items in this section
            </div>
          ) : (
            filteredContents.map(content => (
              <div key={content.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Type className="w-4 h-4 inline mr-2" />
                  {content.label}
                </label>
                {content.type === 'textarea' ? (
                  <textarea
                    value={content.value}
                    onChange={(e) => updateContent(content.key, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <input
                    type="text"
                    value={content.value}
                    onChange={(e) => updateContent(content.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                )}
                <p className="mt-1 text-xs text-gray-500">Key: {content.key}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Usage Information</h4>
        <p className="text-sm text-blue-800">
          Changes made here will affect the corresponding text across your website.
          Make sure to click "Save All Changes" after editing to apply your updates.
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Save, X, Eye, Palette, Loader2, RefreshCw } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set, update } from 'firebase/database';

interface CardDesign {
  section_name: string;
  theme: string;
  border_radius?: string;
  border_width?: string;
  border_color?: string;
  shadow?: string;
  bg_color?: string;
  hover_transform?: string;
  image_border_radius?: string;
  button_style?: string;
  updated_at: string;
}

interface SectionOption {
  value: string;
  label: string;
  type: 'product' | 'category';
}

const DEFAULT_SECTIONS: SectionOption[] = [
  { value: 'all_categories', label: 'All Categories Cards', type: 'category' },
  { value: 'shop_by_category', label: 'Shop by Category Cards', type: 'category' },
  { value: 'featured_products', label: 'Featured Products Cards', type: 'product' },
  { value: 'might_you_like', label: 'Might You Like Cards', type: 'product' },
  { value: 'shop_page', label: 'Shop Page Product Cards', type: 'product' },
  { value: 'product_details', label: 'Product Details Cards', type: 'product' }
];

const PRESET_THEMES = {
  classic: {
    name: 'Classic',
    description: 'Traditional rounded cards',
    border_radius: '1rem',
    border_width: '2px',
    border_color: '#14b8a6',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    bg_color: '#ffffff',
    hover_transform: 'translateY(-0.5rem)',
    image_border_radius: '0.75rem',
    button_style: 'rounded-xl'
  },
  modern: {
    name: 'Modern',
    description: 'Clean flat design',
    border_radius: '0.5rem',
    border_width: '1px',
    border_color: '#e5e7eb',
    shadow: 'none',
    bg_color: '#ffffff',
    hover_transform: 'scale(1.02)',
    image_border_radius: '0.5rem',
    button_style: 'rounded-lg'
  },
  minimal: {
    name: 'Minimal',
    description: 'Simple subtle borders',
    border_radius: '0.75rem',
    border_width: '1px',
    border_color: '#d1d5db',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    bg_color: '#ffffff',
    hover_transform: 'none',
    image_border_radius: '0.5rem',
    button_style: 'rounded-md'
  },
  elegant: {
    name: 'Elegant',
    description: 'Soft shadows & curves',
    border_radius: '1.5rem',
    border_width: '2px',
    border_color: '#cbd5e1',
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    bg_color: '#ffffff',
    hover_transform: 'translateY(-0.75rem) scale(1.02)',
    image_border_radius: '1.25rem',
    button_style: 'rounded-2xl'
  },
  bold: {
    name: 'Bold',
    description: 'Strong borders & colors',
    border_radius: '1rem',
    border_width: '3px',
    border_color: '#0891b2',
    shadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)',
    bg_color: '#ffffff',
    hover_transform: 'translateY(-1rem) scale(1.05)',
    image_border_radius: '0.75rem',
    button_style: 'rounded-xl'
  },
  premium: {
    name: 'Premium',
    description: 'Luxurious gold accent',
    border_radius: '1.25rem',
    border_width: '2px',
    border_color: '#f59e0b',
    shadow: '0 12px 24px -6px rgba(245, 158, 11, 0.3)',
    bg_color: '#fffbeb',
    hover_transform: 'translateY(-0.5rem) scale(1.03)',
    image_border_radius: '1rem',
    button_style: 'rounded-2xl'
  },
  neon: {
    name: 'Neon',
    description: 'Vibrant glowing effect',
    border_radius: '0.75rem',
    border_width: '2px',
    border_color: '#ec4899',
    shadow: '0 0 20px rgba(236, 72, 153, 0.4)',
    bg_color: '#fdf2f8',
    hover_transform: 'scale(1.05)',
    image_border_radius: '0.5rem',
    button_style: 'rounded-full'
  },
  glassmorphism: {
    name: 'Glass',
    description: 'Frosted glass effect',
    border_radius: '1rem',
    border_width: '1px',
    border_color: 'rgba(255, 255, 255, 0.3)',
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    bg_color: 'rgba(255, 255, 255, 0.7)',
    hover_transform: 'translateY(-0.5rem)',
    image_border_radius: '0.75rem',
    button_style: 'rounded-xl'
  },
  neumorphism: {
    name: 'Neumorphic',
    description: 'Soft UI depth effect',
    border_radius: '2rem',
    border_width: '0px',
    border_color: 'transparent',
    shadow: '12px 12px 24px #d1d5db, -12px -12px 24px #ffffff',
    bg_color: '#e5e7eb',
    hover_transform: 'translateY(-0.25rem)',
    image_border_radius: '1.5rem',
    button_style: 'rounded-2xl'
  },
  sharp: {
    name: 'Sharp',
    description: 'Angular edges',
    border_radius: '0px',
    border_width: '2px',
    border_color: '#1e293b',
    shadow: '4px 4px 0px #1e293b',
    bg_color: '#ffffff',
    hover_transform: 'translate(-4px, -4px)',
    image_border_radius: '0px',
    button_style: 'rounded-none'
  },
  gradient: {
    name: 'Gradient',
    description: 'Colorful gradient border',
    border_radius: '1rem',
    border_width: '3px',
    border_color: 'transparent',
    shadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
    bg_color: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, #6366f1, #ec4899, #f59e0b) border-box',
    hover_transform: 'translateY(-0.5rem) scale(1.02)',
    image_border_radius: '0.75rem',
    button_style: 'rounded-xl'
  },
  retro: {
    name: 'Retro',
    description: 'Vintage 80s style',
    border_radius: '0.5rem',
    border_width: '3px',
    border_color: '#1e293b',
    shadow: '8px 8px 0px #14b8a6',
    bg_color: '#fef3c7',
    hover_transform: 'translate(-4px, -4px)',
    image_border_radius: '0.25rem',
    button_style: 'rounded-md'
  },
  soft: {
    name: 'Soft',
    description: 'Gentle pastel theme',
    border_radius: '2rem',
    border_width: '2px',
    border_color: '#ddd6fe',
    shadow: '0 6px 20px rgba(167, 139, 250, 0.15)',
    bg_color: '#faf5ff',
    hover_transform: 'translateY(-0.25rem)',
    image_border_radius: '1.75rem',
    button_style: 'rounded-full'
  },
  corporate: {
    name: 'Corporate',
    description: 'Professional business',
    border_radius: '0.375rem',
    border_width: '1px',
    border_color: '#64748b',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    bg_color: '#ffffff',
    hover_transform: 'translateY(-2px)',
    image_border_radius: '0.25rem',
    button_style: 'rounded'
  },
  vibrant: {
    name: 'Vibrant',
    description: 'Energetic & colorful',
    border_radius: '1rem',
    border_width: '3px',
    border_color: '#f43f5e',
    shadow: '0 8px 24px rgba(244, 63, 94, 0.25)',
    bg_color: '#fff1f2',
    hover_transform: 'scale(1.05) rotate(1deg)',
    image_border_radius: '0.75rem',
    button_style: 'rounded-xl'
  }
};

export default function CardDesignManager() {
  const [selectedSection, setSelectedSection] = useState('all_categories');
  const [selectedType, setSelectedType] = useState<'product' | 'category'>('product');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cardDesign, setCardDesign] = useState<CardDesign>({
    section_name: 'All Categories Section',
    theme: 'classic',
    ...PRESET_THEMES.classic,
    updated_at: new Date().toISOString()
  });
  const [showPreview, setShowPreview] = useState(false);
  const [allSections, setAllSections] = useState<SectionOption[]>(DEFAULT_SECTIONS);

  useEffect(() => {
    loadCustomSections();
  }, []);

  useEffect(() => {
    loadDesign();
  }, [selectedSection]);

  const loadCustomSections = async () => {
    try {
      const sectionsRef = ref(db, 'homepage_sections');
      const snapshot = await get(sectionsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const customSections: SectionOption[] = Object.entries(data).map(([id, section]: [string, any]) => ({
          value: `custom_${id}`,
          label: `${section.title} (Custom Section)`,
          type: section.content_type === 'category' ? 'category' : 'product'
        }));

        setAllSections([...DEFAULT_SECTIONS, ...customSections]);
      }
    } catch (error) {
      console.error('Error loading custom sections:', error);
    }
  };

  const loadDesign = async () => {
    try {
      setLoading(true);
      const designRef = ref(db, `card_designs/${selectedSection}`);
      const snapshot = await get(designRef);

      if (snapshot.exists()) {
        setCardDesign(snapshot.val());
      } else {
        const sectionName = allSections.find(s => s.value === selectedSection)?.label || 'Section';
        setCardDesign({
          section_name: sectionName,
          theme: 'classic',
          ...PRESET_THEMES.classic,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error loading card design:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (theme: keyof typeof PRESET_THEMES) => {
    const preset = PRESET_THEMES[theme];
    setCardDesign({
      ...cardDesign,
      theme,
      ...preset
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const designRef = ref(db, `card_designs/${selectedSection}`);

      const designData: any = {
        section_name: cardDesign.section_name,
        theme: cardDesign.theme,
        updated_at: new Date().toISOString()
      };

      if (cardDesign.border_radius) designData.border_radius = cardDesign.border_radius;
      if (cardDesign.border_width) designData.border_width = cardDesign.border_width;
      if (cardDesign.border_color) designData.border_color = cardDesign.border_color;
      if (cardDesign.shadow) designData.shadow = cardDesign.shadow;
      if (cardDesign.bg_color) designData.bg_color = cardDesign.bg_color;
      if (cardDesign.hover_transform) designData.hover_transform = cardDesign.hover_transform;
      if (cardDesign.image_border_radius) designData.image_border_radius = cardDesign.image_border_radius;
      if (cardDesign.button_style) designData.button_style = cardDesign.button_style;

      await update(designRef, designData);
      alert('Card design saved successfully!');
    } catch (error) {
      console.error('Error saving card design:', error);
      alert('Failed to save card design. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  const productSections = allSections.filter(s => s.type === 'product');
  const categorySections = allSections.filter(s => s.type === 'category');
  const currentSections = selectedType === 'product' ? productSections : categorySections;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Card Design Customizer</h2>
        <div className="flex gap-2">
          <button
            onClick={loadCustomSections}
            className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            title="Reload custom sections"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Sections
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Card Type
          </label>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setSelectedType('product');
                setSelectedSection(productSections[0]?.value || 'featured_products');
              }}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                selectedType === 'product'
                  ? 'bg-teal-500 text-white ring-2 ring-teal-500 ring-offset-2'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Product Cards ({productSections.length})
            </button>
            <button
              onClick={() => {
                setSelectedType('category');
                setSelectedSection(categorySections[0]?.value || 'all_categories');
              }}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                selectedType === 'category'
                  ? 'bg-purple-500 text-white ring-2 ring-purple-500 ring-offset-2'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Category Cards ({categorySections.length})
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Select Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
          >
            {currentSections.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Showing {selectedType === 'product' ? 'product' : 'category'} card sections.
            Custom sections from homepage are included automatically.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Choose Theme Preset
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {(Object.keys(PRESET_THEMES) as Array<keyof typeof PRESET_THEMES>).map((themeKey) => {
              const theme = PRESET_THEMES[themeKey];
              return (
                <button
                  key={themeKey}
                  onClick={() => handleThemeChange(themeKey)}
                  className={`p-3 border-2 rounded-lg transition-all hover:scale-105 ${
                    cardDesign.theme === themeKey
                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500 ring-offset-2'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <Palette className="w-5 h-5 mx-auto mb-1 text-teal-600" />
                  <div className="text-sm font-bold text-gray-900">{theme.name}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{theme.description}</div>
                </button>
              );
            })}
            <button
              onClick={() => setCardDesign({ ...cardDesign, theme: 'custom' })}
              className={`p-3 border-2 rounded-lg transition-all hover:scale-105 ${
                cardDesign.theme === 'custom'
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500 ring-offset-2'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <Palette className="w-5 h-5 mx-auto mb-1 text-purple-600" />
              <div className="text-sm font-bold text-gray-900">Custom</div>
              <div className="text-xs text-gray-500 mt-1">Your own style</div>
            </button>
          </div>
        </div>

        <div className="space-y-4 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Customize Properties</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Border Radius
              </label>
              <input
                type="text"
                value={cardDesign.border_radius || ''}
                onChange={(e) => setCardDesign({ ...cardDesign, border_radius: e.target.value, theme: 'custom' })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                placeholder="e.g., 1rem, 16px"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Border Width
              </label>
              <input
                type="text"
                value={cardDesign.border_width || ''}
                onChange={(e) => setCardDesign({ ...cardDesign, border_width: e.target.value, theme: 'custom' })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                placeholder="e.g., 2px"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Border Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={cardDesign.border_color || '#14b8a6'}
                  onChange={(e) => setCardDesign({ ...cardDesign, border_color: e.target.value, theme: 'custom' })}
                  className="w-16 h-10 rounded border-2 border-gray-300"
                />
                <input
                  type="text"
                  value={cardDesign.border_color || ''}
                  onChange={(e) => setCardDesign({ ...cardDesign, border_color: e.target.value, theme: 'custom' })}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  placeholder="#14b8a6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={cardDesign.bg_color || '#ffffff'}
                  onChange={(e) => setCardDesign({ ...cardDesign, bg_color: e.target.value, theme: 'custom' })}
                  className="w-16 h-10 rounded border-2 border-gray-300"
                />
                <input
                  type="text"
                  value={cardDesign.bg_color || ''}
                  onChange={(e) => setCardDesign({ ...cardDesign, bg_color: e.target.value, theme: 'custom' })}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Shadow
              </label>
              <input
                type="text"
                value={cardDesign.shadow || ''}
                onChange={(e) => setCardDesign({ ...cardDesign, shadow: e.target.value, theme: 'custom' })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                placeholder="e.g., 0 4px 6px rgba(0,0,0,0.1)"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Hover Transform
              </label>
              <input
                type="text"
                value={cardDesign.hover_transform || ''}
                onChange={(e) => setCardDesign({ ...cardDesign, hover_transform: e.target.value, theme: 'custom' })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                placeholder="e.g., translateY(-0.5rem)"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Image Border Radius
              </label>
              <input
                type="text"
                value={cardDesign.image_border_radius || ''}
                onChange={(e) => setCardDesign({ ...cardDesign, image_border_radius: e.target.value, theme: 'custom' })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                placeholder="e.g., 0.75rem"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Button Style
              </label>
              <select
                value={cardDesign.button_style || 'rounded-xl'}
                onChange={(e) => setCardDesign({ ...cardDesign, button_style: e.target.value, theme: 'custom' })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
              >
                <option value="rounded-md">Small Rounded (md)</option>
                <option value="rounded-lg">Medium Rounded (lg)</option>
                <option value="rounded-xl">Large Rounded (xl)</option>
                <option value="rounded-2xl">Extra Large Rounded (2xl)</option>
                <option value="rounded-full">Fully Rounded (pill)</option>
              </select>
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="mt-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Preview - {selectedType === 'product' ? 'Product Card' : 'Category Card'}
            </h3>
            <div className="max-w-sm mx-auto">
              <div
                className="group overflow-hidden transition-all duration-300 cursor-pointer"
                style={{
                  borderRadius: cardDesign.border_radius,
                  borderWidth: cardDesign.border_width,
                  borderColor: cardDesign.border_color,
                  borderStyle: 'solid',
                  boxShadow: cardDesign.shadow,
                  backgroundColor: cardDesign.bg_color
                }}
              >
                <div
                  className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300"
                  style={{ borderRadius: cardDesign.image_border_radius }}
                >
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    {selectedType === 'product' ? 'Product Image' : 'Category Image'}
                  </div>
                </div>
                <div className="p-4">
                  {selectedType === 'product' ? (
                    <>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Product Name</h3>
                      <p className="text-sm text-gray-600 mb-3">Sample product description</p>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-xl font-bold text-gray-900">₹299.00</span>
                        <span className="text-sm text-gray-400 line-through">₹399.00</span>
                      </div>
                      <button
                        className={`w-full bg-teal-500 text-white py-2 ${cardDesign.button_style} text-sm font-semibold hover:bg-teal-600 transition-colors border-2 border-teal-600`}
                      >
                        Add to Cart
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Category Name</h3>
                      <p className="text-sm text-gray-600 mb-3">Browse amazing products</p>
                      <button
                        className={`w-full bg-purple-500 text-white py-2 ${cardDesign.button_style} text-sm font-semibold hover:bg-purple-600 transition-colors border-2 border-purple-600`}
                      >
                        View Category
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Design
              </>
            )}
          </button>
          <button
            onClick={loadDesign}
            className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

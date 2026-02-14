import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff, ChevronUp, ChevronDown, Loader2, Lock } from 'lucide-react';
import { HomepageSection, Product, Category } from '../../types';
import { db } from '../../lib/firebase';
import { ref, get, set, update, remove, push } from 'firebase/database';

interface ExtendedSection extends HomepageSection {
  is_default?: boolean;
  default_key?: string;
}

const DEFAULT_SECTIONS_CONFIG = [
  { key: 'banner_social', name: 'Banner & Social Links', description: 'Welcome banner and social media links' },
  { key: 'feature_boxes', name: 'Feature Boxes', description: 'Top Quality, Unique Designs, 100% Handmade' },
  { key: 'all_categories', name: 'All Categories', description: 'New arrival categories grid' },
  { key: 'best_sellers', name: 'Best Sellers', description: 'Top selling products showcase' },
  { key: 'might_you_like', name: 'Might You Like', description: 'Featured products recommendations' },
  { key: 'shop_by_category', name: 'Shop by Category', description: 'Featured categories carousel' },
  { key: 'customer_reviews', name: 'Customer Reviews', description: 'Customer testimonials' },
  { key: 'marquee', name: 'Marquee', description: 'Scrolling announcement text' },
  { key: 'video_section', name: 'Video Section', description: 'Display video gallery' }
];

export default function SectionManager() {
  const [sections, setSections] = useState<ExtendedSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [showMarqueeForm, setShowMarqueeForm] = useState(false);
  const [editingSection, setEditingSection] = useState<ExtendedSection | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content_type: 'product' as 'category' | 'product',
    display_type: 'horizontal' as 'horizontal' | 'vertical' | 'carousel' | 'swipable' | 'grid',
    selected_items: [] as string[],
    is_visible: true,
    order_index: 0
  });

  const [infoFormData, setInfoFormData] = useState({
    title: '',
    content: '',
    theme: 'default' as string,
    is_visible: true
  });

  const [marqueeFormData, setMarqueeFormData] = useState({
    text: '',
    speed: 'medium' as 'slow' | 'medium' | 'fast',
    bg_color: '#000000',
    text_color: '#ffffff',
    is_visible: true
  });

  const [draggedSection, setDraggedSection] = useState<ExtendedSection | null>(null);
  const [dropIndicator, setDropIndicator] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const sectionsSnapshot = await get(ref(db, 'homepage_sections'));
      const customSectionsData: ExtendedSection[] = [];
      if (sectionsSnapshot.exists()) {
        const data = sectionsSnapshot.val();
        Object.entries(data).forEach(([id, sectionData]: [string, any]) => {
          customSectionsData.push({ id, ...sectionData });
        });
      }

      const marqueeSectionsSnapshot = await get(ref(db, 'marquee_sections'));
      const marqueeSectionsData: any[] = [];
      if (marqueeSectionsSnapshot.exists()) {
        const data = marqueeSectionsSnapshot.val();
        Object.entries(data).forEach(([id, sectionData]: [string, any]) => {
          marqueeSectionsData.push({ id, type: 'marquee', ...sectionData });
        });
      }

      const videoSectionsSnapshot = await get(ref(db, 'video_sections'));
      const videoSectionsData: any[] = [];
      if (videoSectionsSnapshot.exists()) {
        const data = videoSectionsSnapshot.val();
        Object.entries(data).forEach(([id, videoData]: [string, any]) => {
          if (videoData.isVisible) {
            videoSectionsData.push({ id, ...videoData });
          }
        });
      }

      const videoSectionSettingsSnapshot = await get(ref(db, 'video_section_settings'));
      let videoSectionSettings: any = { is_visible: false };
      if (videoSectionSettingsSnapshot.exists()) {
        videoSectionSettings = videoSectionSettingsSnapshot.val();
      }

      const defaultSectionsRef = ref(db, 'default_sections_visibility');
      const defaultSectionsSnapshot = await get(defaultSectionsRef);
      const defaultSectionsVisibility: Record<string, boolean> = {};
      if (defaultSectionsSnapshot.exists()) {
        Object.assign(defaultSectionsVisibility, defaultSectionsSnapshot.val());
      }

      const defaultSectionsData: ExtendedSection[] = DEFAULT_SECTIONS_CONFIG.map((config, index) => {
        const orderIndexKey = `default_sections_order/${config.key}`;
        const orderSnapshot = defaultSectionsSnapshot.exists()
          ? defaultSectionsVisibility[`order_${config.key}`]
          : undefined;

        let isVisible = defaultSectionsVisibility[config.key] !== undefined
          ? defaultSectionsVisibility[config.key]
          : true;

        if (config.key === 'video_section') {
          isVisible = videoSectionSettings.is_visible !== undefined
            ? videoSectionSettings.is_visible
            : false;
        }

        return {
          id: `default_${config.key}`,
          title: config.name,
          subtitle: config.description,
          content_type: 'product' as const,
          display_type: 'horizontal' as const,
          selected_items: [],
          is_visible: isVisible,
          order_index: orderSnapshot !== undefined ? orderSnapshot : index,
          created_at: '',
          updated_at: '',
          is_default: true,
          default_key: config.key
        };
      });

      const allSections = [...defaultSectionsData, ...customSectionsData, ...marqueeSectionsData];
      allSections.sort((a, b) => a.order_index - b.order_index);

      allSections.forEach((section, index) => {
        section.order_index = index;
      });

      setSections(allSections);

      const productsSnapshot = await get(ref(db, 'products'));
      if (productsSnapshot.exists()) {
        const productsData = productsSnapshot.val();
        const productsArray = Object.entries(productsData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        }));
        setProducts(productsArray);
      }

      const categoriesSnapshot = await get(ref(db, 'categories'));
      if (categoriesSnapshot.exists()) {
        const categoriesData = categoriesSnapshot.val();
        const categoriesArray = Object.entries(categoriesData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        }));
        setCategories(categoriesArray);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const sectionData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        content_type: formData.content_type,
        display_type: formData.display_type,
        selected_items: formData.selected_items,
        is_visible: formData.is_visible,
        order_index: editingSection ? editingSection.order_index : sections.length,
        updated_at: new Date().toISOString()
      };

      if (editingSection) {
        const sectionRef = ref(db, `homepage_sections/${editingSection.id}`);
        await update(sectionRef, sectionData);
      } else {
        const sectionsRef = ref(db, 'homepage_sections');
        await push(sectionsRef, {
          ...sectionData,
          created_at: new Date().toISOString()
        });
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (section: ExtendedSection) => {
    if (section.is_default) {
      alert('Default sections cannot be edited. You can only show/hide and reorder them.');
      return;
    }
    setEditingSection(section);
    setFormData({
      title: section.title,
      subtitle: section.subtitle || '',
      content_type: section.content_type,
      display_type: section.display_type,
      selected_items: section.selected_items,
      is_visible: section.is_visible,
      order_index: section.order_index
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const section = sections.find(s => s.id === id);
    if (section?.is_default) {
      alert('Default sections cannot be deleted. You can only hide them.');
      return;
    }

    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const sectionType = (section as any)?.type;
      const sectionPath = sectionType === 'marquee' ? 'marquee_sections' : 'homepage_sections';
      const sectionRef = ref(db, `${sectionPath}/${id}`);
      await remove(sectionRef);
      await fetchData();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const toggleVisibility = async (section: ExtendedSection) => {
    try {
      if (section.is_default && section.default_key) {
        const updates: Record<string, any> = {};
        if (section.default_key === 'video_section') {
          updates['video_section_settings/is_visible'] = !section.is_visible;
        } else {
          updates[`default_sections_visibility/${section.default_key}`] = !section.is_visible;
        }
        await update(ref(db), updates);
      } else {
        const sectionType = (section as any)?.type;
        const sectionPath = sectionType === 'marquee' ? 'marquee_sections' : 'homepage_sections';
        const sectionRef = ref(db, `${sectionPath}/${section.id}`);
        await update(sectionRef, { is_visible: !section.is_visible });
      }
      await fetchData();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to update visibility');
    }
  };

  const moveSection = async (section: ExtendedSection, direction: 'up' | 'down') => {
    const currentIndex = section.order_index;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const targetSection = sections.find(s => s.order_index === targetIndex);
    if (!targetSection) return;

    try {
      const updates: Record<string, any> = {};

      if (section.is_default && section.default_key) {
        if (section.default_key === 'video_section') {
          updates['video_section_settings/order_index'] = targetIndex;
        } else {
          updates[`default_sections_visibility/order_${section.default_key}`] = targetIndex;
        }
      } else {
        const sectionType = (section as any)?.type;
        const sectionPath = sectionType === 'marquee' ? 'marquee_sections' : 'homepage_sections';
        updates[`${sectionPath}/${section.id}/order_index`] = targetIndex;
      }

      if (targetSection.is_default && targetSection.default_key) {
        if (targetSection.default_key === 'video_section') {
          updates['video_section_settings/order_index'] = currentIndex;
        } else {
          updates[`default_sections_visibility/order_${targetSection.default_key}`] = currentIndex;
        }
      } else {
        const targetSectionType = (targetSection as any)?.type;
        const targetSectionPath = targetSectionType === 'marquee' ? 'marquee_sections' : 'homepage_sections';
        updates[`${targetSectionPath}/${targetSection.id}/order_index`] = currentIndex;
      }

      await update(ref(db), updates);
      await fetchData();
    } catch (error) {
      console.error('Error moving section:', error);
      alert('Failed to reorder section');
    }
  };

  const handleDragStart = useCallback((section: ExtendedSection) => {
    setDraggedSection(section);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndicator(targetIndex);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropIndicator(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetSection: ExtendedSection) => {
    e.preventDefault();
    setDropIndicator(null);
    
    if (!draggedSection || draggedSection.id === targetSection.id) {
      setDraggedSection(null);
      return;
    }

    try {
      const draggedIndex = draggedSection.order_index;
      const targetIndex = targetSection.order_index;
      
      if (draggedIndex === targetIndex) {
        setDraggedSection(null);
        return;
      }

      const updates: Record<string, any> = {};

      if (draggedSection.is_default && draggedSection.default_key) {
        if (draggedSection.default_key === 'video_section') {
          updates['video_section_settings/order_index'] = targetIndex;
        } else {
          updates[`default_sections_visibility/order_${draggedSection.default_key}`] = targetIndex;
        }
      } else {
        const sectionType = (draggedSection as any)?.type;
        const sectionPath = sectionType === 'marquee' ? 'marquee_sections' : 'homepage_sections';
        updates[`${sectionPath}/${draggedSection.id}/order_index`] = targetIndex;
      }

      if (targetSection.is_default && targetSection.default_key) {
        if (targetSection.default_key === 'video_section') {
          updates['video_section_settings/order_index'] = draggedIndex;
        } else {
          updates[`default_sections_visibility/order_${targetSection.default_key}`] = draggedIndex;
        }
      } else {
        const targetSectionType = (targetSection as any)?.type;
        const targetSectionPath = targetSectionType === 'marquee' ? 'marquee_sections' : 'homepage_sections';
        updates[`${targetSectionPath}/${targetSection.id}/order_index`] = draggedIndex;
      }

      await update(ref(db), updates);
      await fetchData();
    } catch (error) {
      console.error('Error reordering section via drag-drop:', error);
      alert('Failed to reorder section');
    } finally {
      setDraggedSection(null);
    }
  }, [draggedSection]);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      subtitle: '',
      content_type: 'product',
      display_type: 'horizontal',
      selected_items: [],
      is_visible: true,
      order_index: 0
    });
    setEditingSection(null);
    setShowForm(false);
  }, []);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const infoSectionData = {
        title: infoFormData.title,
        content: infoFormData.content,
        theme: infoFormData.theme,
        is_visible: infoFormData.is_visible,
        order_index: sections.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const infoSectionsRef = ref(db, 'info_sections');
      await push(infoSectionsRef, infoSectionData);

      await fetchData();
      resetInfoForm();
    } catch (error) {
      console.error('Error saving info section:', error);
      alert('Failed to save info section');
    } finally {
      setSaving(false);
    }
  };

  const resetInfoForm = () => {
    setInfoFormData({
      title: '',
      content: '',
      theme: 'default',
      is_visible: true
    });
    setShowInfoForm(false);
  };

  const handleMarqueeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const marqueeSectionData = {
        text: marqueeFormData.text,
        speed: marqueeFormData.speed,
        bg_color: marqueeFormData.bg_color,
        text_color: marqueeFormData.text_color,
        is_visible: marqueeFormData.is_visible,
        order_index: sections.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const marqueeSectionsRef = ref(db, 'marquee_sections');
      await push(marqueeSectionsRef, marqueeSectionData);

      await fetchData();
      resetMarqueeForm();
    } catch (error) {
      console.error('Error saving marquee section:', error);
      alert('Failed to save marquee section');
    } finally {
      setSaving(false);
    }
  };

  const resetMarqueeForm = () => {
    setMarqueeFormData({
      text: '',
      speed: 'medium',
      bg_color: '#000000',
      text_color: '#ffffff',
      is_visible: true
    });
    setShowMarqueeForm(false);
  };

  const toggleItemSelection = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_items: prev.selected_items.includes(itemId)
        ? prev.selected_items.filter(id => id !== itemId)
        : [...prev.selected_items, itemId]
    }));
  };

  const availableItems = formData.content_type === 'product' ? products : categories;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Homepage Sections</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setShowMarqueeForm(!showMarqueeForm);
              setShowForm(false);
              setShowInfoForm(false);
            }}
            className="flex items-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-600 transition-colors border-2 border-purple-600"
          >
            {showMarqueeForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showMarqueeForm ? 'Cancel' : 'Add Marquee'}
          </button>
          <button
            onClick={() => {
              setShowInfoForm(!showInfoForm);
              setShowForm(false);
              setShowMarqueeForm(false);
            }}
            className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors border-2 border-blue-600"
          >
            {showInfoForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showInfoForm ? 'Cancel' : 'Add Info Section'}
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setShowInfoForm(false);
              setShowMarqueeForm(false);
            }}
            className="flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancel' : 'Add Product/Category Section'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-teal-50 rounded-2xl p-6 border-2 border-teal-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingSection ? 'Edit Section' : 'Add New Section'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                placeholder="e.g., Best Sellers"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                placeholder="e.g., Shop our most popular items"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Content Type *
                </label>
                <select
                  value={formData.content_type}
                  onChange={(e) => setFormData({
                    ...formData,
                    content_type: e.target.value as 'category' | 'product',
                    selected_items: []
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                >
                  <option value="product">Products</option>
                  <option value="category">Categories</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Display Type *
                </label>
                <select
                  value={formData.display_type}
                  onChange={(e) => setFormData({
                    ...formData,
                    display_type: e.target.value as any
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                >
                  <option value="horizontal">Horizontal Scroll</option>
                  <option value="vertical">Vertical List</option>
                  <option value="carousel">Carousel</option>
                  <option value="swipable">Swipable</option>
                  <option value="grid">Grid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select {formData.content_type === 'product' ? 'Products' : 'Categories'} *
              </label>
              <div className="border-2 border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                {availableItems.length === 0 ? (
                  <p className="text-gray-500 text-center">
                    No {formData.content_type === 'product' ? 'products' : 'categories'} available
                  </p>
                ) : (
                  availableItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-3 hover:bg-teal-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selected_items.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="flex-1 text-gray-900">{item.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {formData.selected_items.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_visible"
                checked={formData.is_visible}
                onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500"
              />
              <label htmlFor="is_visible" className="text-sm font-bold text-gray-700">
                Show on homepage
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving || formData.selected_items.length === 0}
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
                    {editingSection ? 'Update' : 'Save'} Section
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {showMarqueeForm && (
        <form onSubmit={handleMarqueeSubmit} className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Add Marquee Section</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Marquee Text *
              </label>
              <textarea
                required
                value={marqueeFormData.text}
                onChange={(e) => setMarqueeFormData({ ...marqueeFormData, text: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none min-h-20"
                placeholder="Enter scrolling text here..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Speed *
                </label>
                <select
                  value={marqueeFormData.speed}
                  onChange={(e) => setMarqueeFormData({ ...marqueeFormData, speed: e.target.value as 'slow' | 'medium' | 'fast' })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value="slow">Slow</option>
                  <option value="medium">Medium</option>
                  <option value="fast">Fast</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Background Color *
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={marqueeFormData.bg_color}
                    onChange={(e) => setMarqueeFormData({ ...marqueeFormData, bg_color: e.target.value })}
                    className="w-16 h-10 border-2 border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={marqueeFormData.bg_color}
                    onChange={(e) => setMarqueeFormData({ ...marqueeFormData, bg_color: e.target.value })}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Text Color *
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={marqueeFormData.text_color}
                    onChange={(e) => setMarqueeFormData({ ...marqueeFormData, text_color: e.target.value })}
                    className="w-16 h-10 border-2 border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={marqueeFormData.text_color}
                    onChange={(e) => setMarqueeFormData({ ...marqueeFormData, text_color: e.target.value })}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border-2 border-gray-300">
              <label className="block text-sm font-bold text-gray-700 mb-2">Preview</label>
              <div
                className="overflow-hidden py-3"
                style={{ backgroundColor: marqueeFormData.bg_color }}
              >
                <div className="whitespace-nowrap animate-marquee" style={{ color: marqueeFormData.text_color }}>
                  {marqueeFormData.text || 'Enter text to see preview...'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="marquee_is_visible"
                checked={marqueeFormData.is_visible}
                onChange={(e) => setMarqueeFormData({ ...marqueeFormData, is_visible: e.target.checked })}
                className="w-4 h-4 text-purple-500 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="marquee_is_visible" className="text-sm font-bold text-gray-700">
                Show on homepage
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Marquee Section
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetMarqueeForm}
                className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {showInfoForm && (
        <form onSubmit={handleInfoSubmit} className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Add Information Section</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={infoFormData.title}
                onChange={(e) => setInfoFormData({ ...infoFormData, title: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Special Announcement"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                required
                value={infoFormData.content}
                onChange={(e) => setInfoFormData({ ...infoFormData, content: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none min-h-32"
                placeholder="Enter your message or announcement here..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Theme *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { value: 'default', label: 'Default', colors: 'bg-gray-100 text-gray-900 border-gray-300' },
                  { value: 'primary', label: 'Primary', colors: 'bg-teal-100 text-teal-900 border-teal-300' },
                  { value: 'success', label: 'Success', colors: 'bg-green-100 text-green-900 border-green-300' },
                  { value: 'warning', label: 'Warning', colors: 'bg-amber-100 text-amber-900 border-amber-300' },
                  { value: 'info', label: 'Info', colors: 'bg-blue-100 text-blue-900 border-blue-300' },
                  { value: 'danger', label: 'Danger', colors: 'bg-red-100 text-red-900 border-red-300' },
                  { value: 'purple', label: 'Purple', colors: 'bg-purple-100 text-purple-900 border-purple-300' },
                  { value: 'pink', label: 'Pink', colors: 'bg-pink-100 text-pink-900 border-pink-300' },
                  { value: 'gradient', label: 'Gradient', colors: 'bg-gradient-to-r from-teal-500 to-blue-500 text-white border-teal-500' },
                  { value: 'gradient-sunset', label: 'Sunset', colors: 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-orange-500' },
                  { value: 'gradient-ocean', label: 'Ocean', colors: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-500' },
                  { value: 'gradient-forest', label: 'Forest', colors: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500' },
                  { value: 'dark', label: 'Dark', colors: 'bg-gray-900 text-white border-gray-700' },
                  { value: 'light', label: 'Light', colors: 'bg-white text-gray-900 border-gray-200' },
                  { value: 'premium', label: 'Premium', colors: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-500' },
                  { value: 'neon', label: 'Neon', colors: 'bg-black text-pink-400 border-pink-400' }
                ].map((theme) => (
                  <label
                    key={theme.value}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer border-2 transition-all hover:scale-105 ${
                      infoFormData.theme === theme.value
                        ? 'ring-2 ring-blue-500 ring-offset-2'
                        : 'hover:border-blue-300'
                    } ${theme.colors}`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={theme.value}
                      checked={infoFormData.theme === theme.value}
                      onChange={(e) => setInfoFormData({ ...infoFormData, theme: e.target.value })}
                      className="sr-only"
                    />
                    <span className="font-bold text-sm">{theme.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="info_is_visible"
                checked={infoFormData.is_visible}
                onChange={(e) => setInfoFormData({ ...infoFormData, is_visible: e.target.checked })}
                className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="info_is_visible" className="text-sm font-bold text-gray-700">
                Show on homepage
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Info Section
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetInfoForm}
                className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-500">No sections created yet. Add your first section to get started.</p>
          </div>
        ) : (
          sections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(section)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, section)}
              className={`bg-white rounded-xl p-6 border-2 transition-all cursor-move ${
                draggedSection?.id === section.id 
                  ? 'opacity-50 border-blue-500' 
                  : dropIndicator === index
                  ? 'border-green-500 bg-green-50'
                  : section.is_visible 
                  ? 'border-teal-200' 
                  : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-gray-400 cursor-grab active:cursor-grabbing mt-1 text-xl">
                    ⋮⋮
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                    {section.is_default && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Default
                      </span>
                    )}
                    {!section.is_visible && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  {section.subtitle && (
                    <p className="text-gray-600 mb-3">{section.subtitle}</p>
                  )}
                  {(section as any).type === 'marquee' && (
                    <div className="space-y-3">
                      <p className="text-gray-700 font-medium">{(section as any).text}</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 font-bold rounded-full">
                          Marquee
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold rounded-full">
                          Speed: {(section as any).speed}
                        </span>
                        <span
                          className="px-3 py-1 font-bold rounded-full"
                          style={{
                            backgroundColor: (section as any).bg_color,
                            color: (section as any).text_color
                          }}
                        >
                          Colors
                        </span>
                      </div>
                    </div>
                  )}
                  {!section.is_default && (section as any).type !== 'marquee' && (
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 font-bold rounded-full">
                        {section.content_type === 'product' ? 'Products' : 'Categories'}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full">
                        {section.display_type.charAt(0).toUpperCase() + section.display_type.slice(1)}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 font-bold rounded-full">
                        {(section.selected_items || []).length} items
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveSection(section, 'up')}
                      disabled={section.order_index === 0}
                      className="p-2 text-gray-600 hover:text-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => moveSection(section, 'down')}
                      disabled={section.order_index === sections.length - 1}
                      className="p-2 text-gray-600 hover:text-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => toggleVisibility(section)}
                    className="p-3 text-gray-600 hover:text-teal-600 transition-colors"
                    title={section.is_visible ? 'Hide section' : 'Show section'}
                  >
                    {section.is_visible ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                  {!section.is_default && (
                    <>
                      <button
                        onClick={() => handleEdit(section)}
                        className="p-3 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Edit section"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(section.id)}
                        className="p-3 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete section"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

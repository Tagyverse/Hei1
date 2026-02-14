import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown, Image as ImageIcon, Eye, EyeOff, Palette } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set, remove } from 'firebase/database';
import ImageUpload from '../ImageUpload';
import LazyImage from '../LazyImage';

interface CarouselImage {
  id: string;
  url: string;
  title: string;
  description: string;
  order: number;
  isVisible: boolean;
}

interface CarouselSettings {
  is_visible: boolean;
  autoplay: boolean;
  interval: number;
  show_indicators: boolean;
  show_navigation: boolean;
}

interface CarouselTheme {
  name: string;
  description: string;
  settings: {
    autoplay: boolean;
    interval: number;
    show_indicators: boolean;
    show_navigation: boolean;
  };
}

const CAROUSEL_THEME_PRESETS: Record<string, CarouselTheme> = {
  classic: {
    name: 'Classic',
    description: 'Traditional carousel with all controls',
    settings: {
      autoplay: true,
      interval: 5000,
      show_indicators: true,
      show_navigation: true
    }
  },
  minimal: {
    name: 'Minimal',
    description: 'Clean look with dots only',
    settings: {
      autoplay: true,
      interval: 4000,
      show_indicators: true,
      show_navigation: false
    }
  },
  modern: {
    name: 'Modern',
    description: 'Auto-play with arrows only',
    settings: {
      autoplay: true,
      interval: 6000,
      show_indicators: false,
      show_navigation: true
    }
  },
  simple: {
    name: 'Simple',
    description: 'No controls, auto-play only',
    settings: {
      autoplay: true,
      interval: 5000,
      show_indicators: false,
      show_navigation: false
    }
  },
  interactive: {
    name: 'Interactive',
    description: 'Manual control with all options',
    settings: {
      autoplay: false,
      interval: 5000,
      show_indicators: true,
      show_navigation: true
    }
  },
  fast: {
    name: 'Fast',
    description: 'Quick transitions',
    settings: {
      autoplay: true,
      interval: 3000,
      show_indicators: true,
      show_navigation: true
    }
  },
  slow: {
    name: 'Slow',
    description: 'Long display time',
    settings: {
      autoplay: true,
      interval: 8000,
      show_indicators: true,
      show_navigation: true
    }
  },
  manual: {
    name: 'Manual',
    description: 'User controlled only',
    settings: {
      autoplay: false,
      interval: 5000,
      show_indicators: false,
      show_navigation: true
    }
  }
};

export default function CarouselManager() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [formData, setFormData] = useState({ url: '', title: '', description: '', isVisible: true });
  const [carouselSettings, setCarouselSettings] = useState<CarouselSettings>({
    is_visible: true,
    autoplay: true,
    interval: 5000,
    show_indicators: true,
    show_navigation: true
  });

  useEffect(() => {
    loadImages();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsRef = ref(db, 'carousel_settings');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        setCarouselSettings(snapshot.val());
      }
    } catch (error) {
      console.error('Error loading carousel settings:', error);
    }
  };

  const saveSettings = async (newSettings: CarouselSettings) => {
    try {
      const settingsRef = ref(db, 'carousel_settings');
      await set(settingsRef, newSettings);
      setCarouselSettings(newSettings);
    } catch (error) {
      console.error('Error saving carousel settings:', error);
      alert('Failed to save settings');
    }
  };

  const loadImages = async () => {
    try {
      const imagesRef = ref(db, 'carousel_images');
      const snapshot = await get(imagesRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const imagesArray = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setImages(imagesArray.sort((a, b) => a.order - b.order));
      } else {
        const defaultImages: CarouselImage[] = [
          {
            id: 'img1',
            url: 'https://images.pexels.com/photos/3992850/pexels-photo-3992850.jpeg?auto=compress&cs=tinysrgb&w=1200',
            title: 'Beautiful Hair Accessories',
            description: 'Discover our collection',
            order: 1,
            isVisible: true
          },
          {
            id: 'img2',
            url: 'https://images.pexels.com/photos/3992851/pexels-photo-3992851.jpeg?auto=compress&cs=tinysrgb&w=1200',
            title: 'Handcrafted with Love',
            description: 'Premium quality guaranteed',
            order: 2,
            isVisible: true
          },
          {
            id: 'img3',
            url: 'https://images.pexels.com/photos/3992856/pexels-photo-3992856.jpeg?auto=compress&cs=tinysrgb&w=1200',
            title: 'Perfect for Every Occasion',
            description: 'Shop our latest styles',
            order: 3,
            isVisible: true
          }
        ];

        const imagesData: any = {};
        defaultImages.forEach(img => {
          imagesData[img.id] = img;
        });
        await set(imagesRef, imagesData);
        setImages(defaultImages);
      }
    } catch (error) {
      console.error('Error loading carousel images:', error);
    }
  };

  const saveImage = async () => {
    try {
      if (!formData.url) {
        alert('Please provide an image URL');
        return;
      }

      const imagesData: any = {};

      if (editingImage) {
        const updatedImages = images.map(img =>
          img.id === editingImage.id
            ? { ...img, ...formData }
            : img
        );
        updatedImages.forEach(img => {
          imagesData[img.id] = img;
        });
        setImages(updatedImages);
      } else {
        const newId = `img_${Date.now()}`;
        const newImage: CarouselImage = {
          id: newId,
          url: formData.url,
          title: formData.title,
          description: formData.description,
          order: images.length + 1,
          isVisible: formData.isVisible
        };
        const updatedImages = [...images, newImage];
        updatedImages.forEach(img => {
          imagesData[img.id] = img;
        });
        setImages(updatedImages);
      }

      await set(ref(db, 'carousel_images'), imagesData);

      setShowForm(false);
      setEditingImage(null);
      setFormData({ url: '', title: '', description: '', isVisible: true });
    } catch (error) {
      console.error('Error saving carousel image:', error);
      alert('Failed to save image');
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await remove(ref(db, `carousel_images/${id}`));
      setImages(images.filter(img => img.id !== id));
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

    newImages.forEach((img, idx) => {
      img.order = idx + 1;
    });

    setImages(newImages);

    const imagesData: any = {};
    newImages.forEach(img => {
      imagesData[img.id] = img;
    });
    await set(ref(db, 'carousel_images'), imagesData);
  };

  const startEdit = (image: CarouselImage) => {
    setEditingImage(image);
    setFormData({
      url: image.url,
      title: image.title,
      description: image.description,
      isVisible: image.isVisible
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingImage(null);
    setFormData({ url: '', title: '', description: '', isVisible: true });
  };

  const applyThemePreset = async (presetKey: string) => {
    if (!confirm('This will update the carousel theme settings. Continue?')) return;

    try {
      const preset = CAROUSEL_THEME_PRESETS[presetKey];
      if (!preset) return;

      const newSettings = {
        is_visible: carouselSettings.is_visible,
        ...preset.settings
      };

      await saveSettings(newSettings);
      setShowPresets(false);
      alert(`${preset.name} theme applied successfully!`);
    } catch (error) {
      console.error('Error applying preset:', error);
      alert('Failed to apply preset');
    }
  };

  const toggleCarouselVisibility = async () => {
    try {
      const newSettings = { ...carouselSettings, is_visible: !carouselSettings.is_visible };
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error toggling carousel visibility:', error);
      alert('Failed to toggle carousel visibility');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border-2 border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Carousel Settings</h3>
          <button
            onClick={toggleCarouselVisibility}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              carouselSettings.is_visible
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {carouselSettings.is_visible ? (
              <>
                <Eye className="w-4 h-4" />
                Visible
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Hidden
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={carouselSettings.autoplay}
              onChange={(e) => saveSettings({ ...carouselSettings, autoplay: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Autoplay</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={carouselSettings.show_indicators}
              onChange={(e) => saveSettings({ ...carouselSettings, show_indicators: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Dots</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={carouselSettings.show_navigation}
              onChange={(e) => saveSettings({ ...carouselSettings, show_navigation: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Arrows</span>
          </label>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Interval (ms)</label>
            <input
              type="number"
              value={carouselSettings.interval}
              onChange={(e) => saveSettings({ ...carouselSettings, interval: Math.max(1000, parseInt(e.target.value) || 5000) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              min="1000"
              step="1000"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Carousel Images</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Palette className="w-4 h-4" />
            {showPresets ? 'Hide Theme Presets' : 'Theme Presets'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Image
          </button>
        </div>
      </div>

      {showPresets && (
        <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Apply Theme Preset</h4>
          <p className="text-sm text-gray-600 mb-4">Select a theme to apply predefined carousel settings</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(CAROUSEL_THEME_PRESETS).map(([presetKey, preset]) => (
              <button
                key={presetKey}
                onClick={() => applyThemePreset(presetKey)}
                className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-left"
              >
                <Palette className="w-6 h-6 mb-2 text-blue-600" />
                <div className="text-sm font-bold text-gray-900">{preset.name}</div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{preset.description}</div>
                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                  <div className="text-xs text-gray-600">
                    {preset.settings.autoplay ? '▶️ Auto-play' : '⏸️ Manual'}
                  </div>
                  <div className="text-xs text-gray-600">
                    ⏱️ {preset.settings.interval / 1000}s interval
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h4 className="font-medium text-gray-900">
            {editingImage ? 'Edit Image' : 'Add New Image'}
          </h4>

          <div>
            <ImageUpload
              label="Carousel Image"
              value={formData.url}
              onChange={(url) => setFormData({ ...formData, url })}
            />
            <p className="mt-2 text-xs text-gray-500">
              Upload an image or paste a URL. Recommended size: 1200x400px
            </p>
          </div>

          {formData.url && (
            <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
              <LazyImage
                src={formData.url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Image title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Image description"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVisible}
                onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Visible in carousel</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveImage}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Save className="w-4 h-4" />
              Save Image
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            No carousel images yet. Click "Add Image" to create your first one.
          </div>
        ) : (
          images.map((image, index) => (
            <div key={image.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="relative h-40 bg-gray-100">
                <LazyImage
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                {!image.isVisible && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="px-3 py-1 bg-white text-gray-900 text-sm font-medium rounded">
                      Hidden
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    {image.title && (
                      <h4 className="font-medium text-gray-900 truncate">{image.title}</h4>
                    )}
                    {image.description && (
                      <p className="text-sm text-gray-600 truncate">{image.description}</p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => moveImage(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveImage(index, 'down')}
                      disabled={index === images.length - 1}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(image)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteImage(image.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

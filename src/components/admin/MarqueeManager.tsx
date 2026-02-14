import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set, update } from 'firebase/database';

export default function MarqueeManager() {
  const [marqueeData, setMarqueeData] = useState({
    text: '',
    isVisible: true,
    backgroundColor: '#f59e0b',
    textColor: '#ffffff'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMarqueeData();
  }, []);

  const loadMarqueeData = async () => {
    try {
      const marqueeRef = ref(db, 'site_content/top_banner');
      const snapshot = await get(marqueeRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.value) {
          setMarqueeData(data.value);
        }
      }
    } catch (error) {
      console.error('Error loading marquee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const marqueeRef = ref(db, 'site_content/top_banner');
      await update(marqueeRef, {
        value: marqueeData,
        updated_at: new Date().toISOString()
      });

      alert('Marquee settings updated successfully!');
    } catch (error) {
      console.error('Error saving marquee settings:', error);
      alert('Failed to save marquee settings. Please check your permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        <p className="text-gray-600 mt-4">Loading marquee settings...</p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-teal-50 rounded-2xl p-6 border-2 border-teal-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Top Banner Marquee</h3>
          <p className="text-sm text-gray-600 mb-6">
            Customize the scrolling text banner that appears at the top of your site
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Marquee Text
              </label>
              <input
                type="text"
                value={marqueeData.text}
                onChange={(e) => setMarqueeData({ ...marqueeData, text: e.target.value })}
                placeholder="🎉 Grand Opening Sale! Get 20% OFF on all items!"
                className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This text will scroll continuously across the top of your site
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={marqueeData.backgroundColor}
                    onChange={(e) => setMarqueeData({ ...marqueeData, backgroundColor: e.target.value })}
                    className="h-12 w-20 rounded-xl border-2 border-teal-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={marqueeData.backgroundColor}
                    onChange={(e) => setMarqueeData({ ...marqueeData, backgroundColor: e.target.value })}
                    className="flex-1 px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="#f59e0b"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Text Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={marqueeData.textColor || '#ffffff'}
                    onChange={(e) => setMarqueeData({ ...marqueeData, textColor: e.target.value })}
                    className="h-12 w-20 rounded-xl border-2 border-teal-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={marqueeData.textColor || '#ffffff'}
                    onChange={(e) => setMarqueeData({ ...marqueeData, textColor: e.target.value })}
                    className="flex-1 px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer bg-white px-4 py-3 rounded-xl border-2 border-teal-200">
                <input
                  type="checkbox"
                  checked={marqueeData.isVisible}
                  onChange={(e) => setMarqueeData({ ...marqueeData, isVisible: e.target.checked })}
                  className="w-5 h-5 text-teal-500 border-2 border-teal-200 rounded focus:ring-2 focus:ring-teal-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {marqueeData.isVisible ? (
                      <Eye className="w-4 h-4 text-teal-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-semibold text-gray-700">Show Marquee Banner</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Toggle the visibility of the top banner on your site
                  </p>
                </div>
              </label>
            </div>
          </div>

          {marqueeData.text && (
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preview
              </label>
              <div
                className="rounded-xl overflow-hidden border-2 border-teal-200"
                style={{ backgroundColor: marqueeData.backgroundColor }}
              >
                <div className="py-2 overflow-hidden">
                  <div className="animate-marquee whitespace-nowrap inline-block">
                    <span className="text-sm font-semibold mx-8" style={{ color: marqueeData.textColor || '#ffffff' }}>{marqueeData.text}</span>
                    <span className="text-sm font-semibold mx-8" style={{ color: marqueeData.textColor || '#ffffff' }}>{marqueeData.text}</span>
                    <span className="text-sm font-semibold mx-8" style={{ color: marqueeData.textColor || '#ffffff' }}>{marqueeData.text}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-teal-500 text-white py-4 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Marquee Settings'}
        </button>
      </form>
    </div>
  );
}

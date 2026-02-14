import { useState, useEffect } from 'react';
import { Save, Wrench, AlertCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set } from 'firebase/database';

export default function MaintenanceManager() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [title, setTitle] = useState('Under Maintenance');
  const [message, setMessage] = useState("We're currently performing scheduled maintenance to improve your experience.");
  const [estimatedTime, setEstimatedTime] = useState("We'll be back shortly");
  const [contactEmail, setContactEmail] = useState('support@example.com');
  const [contactPhone, setContactPhone] = useState('+919876543210');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsRef = ref(db, 'maintenance_settings');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setIsEnabled(data.is_enabled || false);
        setTitle(data.title || 'Under Maintenance');
        setMessage(data.message || "We're currently performing scheduled maintenance to improve your experience.");
        setEstimatedTime(data.estimated_time || "We'll be back shortly");
        setContactEmail(data.contact_email || 'support@example.com');
        setContactPhone(data.contact_phone || '+919876543210');
      }
    } catch (error) {
      console.error('Error loading maintenance settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsRef = ref(db, 'maintenance_settings');
      await set(settingsRef, {
        is_enabled: isEnabled,
        title,
        message,
        estimated_time: estimatedTime,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        updated_at: new Date().toISOString()
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving maintenance settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
          <Wrench className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Mode</h2>
          <p className="text-sm text-gray-600">Control site maintenance mode</p>
        </div>
      </div>

      {isEnabled && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Maintenance Mode Active</p>
            <p className="text-sm text-red-700">
              Your site is currently showing the maintenance page to all visitors (except admins)
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-semibold text-gray-900">Enable Maintenance Mode</p>
            <p className="text-sm text-gray-600">Show maintenance page to visitors</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
            />
            <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Page Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
            placeholder="Under Maintenance"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all resize-none"
            placeholder="Enter maintenance message..."
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">{message.length}/1000 characters</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Estimated Time
          </label>
          <input
            type="text"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
            placeholder="We'll be back shortly"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              placeholder="support@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              placeholder="+919876543210"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {showSuccess && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-center">
            <p className="text-green-800 font-semibold">Settings saved successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
}

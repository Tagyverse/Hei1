import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown, Video, Eye, EyeOff } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set, remove } from 'firebase/database';

interface VideoItem {
  id: string;
  url: string;
  title: string;
  description: string;
  order: number;
  isVisible: boolean;
}

interface VideoSectionSettings {
  is_visible: boolean;
  section_title: string;
  section_subtitle: string;
}

export default function VideoSectionManager() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ url: '', title: '', description: '', isVisible: true });
  const [settings, setSettings] = useState<VideoSectionSettings>({
    is_visible: true,
    section_title: 'Watch Our Videos',
    section_subtitle: 'Explore our collection'
  });

  useEffect(() => {
    loadVideos();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsRef = ref(db, 'video_section_settings');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        setSettings(snapshot.val());
      }
    } catch (error) {
      console.error('Error loading video section settings:', error);
    }
  };

  const saveSettings = async (newSettings: VideoSectionSettings) => {
    try {
      const settingsRef = ref(db, 'video_section_settings');
      await set(settingsRef, newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving video section settings:', error);
      alert('Failed to save settings');
    }
  };

  const loadVideos = async () => {
    try {
      const videosRef = ref(db, 'video_sections');
      const snapshot = await get(videosRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const videosArray = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setVideos(videosArray.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const getEmbedUrl = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be')
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : new URLSearchParams(url.split('?')[1]).get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }

    return url;
  };

  const saveVideo = async () => {
    try {
      if (!formData.url) {
        alert('Please provide a video URL');
        return;
      }

      const videosData: any = {};

      if (editingVideo) {
        const updatedVideos = videos.map(vid =>
          vid.id === editingVideo.id
            ? { ...vid, ...formData }
            : vid
        );
        updatedVideos.forEach(vid => {
          const { id, title, description, ...baseData } = vid;
          videosData[id] = {
            ...baseData,
            ...(title && { title }),
            ...(description && { description })
          };
        });
        setVideos(updatedVideos);
      } else {
        const newId = `video_${Date.now()}`;
        const newVideo: VideoItem = {
          id: newId,
          url: formData.url,
          title: formData.title,
          description: formData.description,
          order: videos.length + 1,
          isVisible: formData.isVisible
        };
        const updatedVideos = [...videos, newVideo];
        updatedVideos.forEach(vid => {
          const { id, title, description, ...baseData } = vid;
          videosData[id] = {
            ...baseData,
            ...(title && { title }),
            ...(description && { description })
          };
        });
        setVideos(updatedVideos);
      }

      console.log('Saving videos data:', videosData);
      await set(ref(db, 'video_sections'), videosData);

      setShowForm(false);
      setEditingVideo(null);
      setFormData({ url: '', title: '', description: '', isVisible: true });
      alert('Video saved successfully!');
    } catch (error: any) {
      console.error('Full error details:', error);
      const errorMessage = error?.message || error?.code || 'Unknown error';
      alert(`Failed to save video: ${errorMessage}\n\n${error?.code === 'PERMISSION_DENIED' ? 'Please make sure you are logged in as admin.' : 'Check console for details.'}`);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      await remove(ref(db, `video_sections/${id}`));
      setVideos(videos.filter(vid => vid.id !== id));
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  };

  const moveVideo = async (index: number, direction: 'up' | 'down') => {
    const newVideos = [...videos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newVideos.length) return;

    [newVideos[index], newVideos[targetIndex]] = [newVideos[targetIndex], newVideos[index]];

    newVideos.forEach((vid, idx) => {
      vid.order = idx + 1;
    });

    setVideos(newVideos);

    const videosData: any = {};
    newVideos.forEach(vid => {
      const { id, title, description, ...baseData } = vid;
      videosData[id] = {
        ...baseData,
        ...(title && { title }),
        ...(description && { description })
      };
    });
    await set(ref(db, 'video_sections'), videosData);
  };

  const startEdit = (video: VideoItem) => {
    setEditingVideo(video);
    setFormData({
      url: video.url,
      title: video.title,
      description: video.description,
      isVisible: video.isVisible
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingVideo(null);
    setFormData({ url: '', title: '', description: '', isVisible: true });
  };

  const toggleSectionVisibility = async () => {
    try {
      const newSettings = { ...settings, is_visible: !settings.is_visible };
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error toggling section visibility:', error);
      alert('Failed to toggle section visibility');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Video Section Settings</h3>
          <button
            onClick={toggleSectionVisibility}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              settings.is_visible
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {settings.is_visible ? (
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={settings.section_title}
              onChange={(e) => saveSettings({ ...settings, section_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Watch Our Videos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Subtitle
            </label>
            <input
              type="text"
              value={settings.section_subtitle}
              onChange={(e) => saveSettings({ ...settings, section_subtitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Explore our collection"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Video List</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Video
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h4 className="font-medium text-gray-900">
            {editingVideo ? 'Edit Video' : 'Add New Video'}
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="YouTube, Vimeo, or direct video URL"
            />
            <p className="mt-2 text-xs text-gray-500">
              Supported: YouTube, Vimeo, or direct video file URLs (.mp4, .webm)
            </p>
          </div>

          {formData.url && (
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={getEmbedUrl(formData.url)}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
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
              placeholder="Video title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Video description"
              rows={3}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVisible}
                onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Visible on homepage</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveVideo}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              <Save className="w-4 h-4" />
              Save Video
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            No videos yet. Click "Add Video" to create your first one.
          </div>
        ) : (
          videos.map((video, index) => (
            <div key={video.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="relative bg-gray-100" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={getEmbedUrl(video.url)}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {!video.isVisible && (
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
                    {video.title && (
                      <h4 className="font-medium text-gray-900 truncate">{video.title}</h4>
                    )}
                    {video.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => moveVideo(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveVideo(index, 'down')}
                      disabled={index === videos.length - 1}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(video)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteVideo(video.id)}
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

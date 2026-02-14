import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set, update, remove, push } from 'firebase/database';

interface VideoOverlay {
  id: string;
  video_url: string;
  overlay_text: string;
  overlay_subtext: string;
  order: number;
  isVisible: boolean;
}

interface VideoOverlaySection {
  id: string;
  title: string;
  subtitle: string;
  videos: string[];
  is_visible: boolean;
  order_index: number;
}

export default function VideoOverlayManager() {
  const [sections, setSections] = useState<VideoOverlaySection[]>([]);
  const [allVideos, setAllVideos] = useState<VideoOverlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingSection, setEditingSection] = useState<VideoOverlaySection | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoOverlay | null>(null);
  const [saving, setSaving] = useState(false);

  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    subtitle: '',
    videos: [] as string[],
    is_visible: true
  });

  const [videoFormData, setVideoFormData] = useState({
    video_url: '',
    overlay_text: '',
    overlay_subtext: '',
    isVisible: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const videosSnapshot = await get(ref(db, 'video_overlay_items'));
      const videosData: VideoOverlay[] = [];
      if (videosSnapshot.exists()) {
        const data = videosSnapshot.val();
        Object.entries(data).forEach(([id, videoData]: [string, any]) => {
          videosData.push({ id, ...videoData });
        });
        videosData.sort((a, b) => a.order - b.order);
      }
      setAllVideos(videosData);

      const sectionsSnapshot = await get(ref(db, 'video_overlay_sections'));
      const sectionsData: VideoOverlaySection[] = [];
      if (sectionsSnapshot.exists()) {
        const data = sectionsSnapshot.val();
        Object.entries(data).forEach(([id, sectionData]: [string, any]) => {
          sectionsData.push({ id, ...sectionData });
        });
        sectionsData.sort((a, b) => a.order_index - b.order_index);
      }
      setSections(sectionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const videoData = {
        video_url: videoFormData.video_url,
        overlay_text: videoFormData.overlay_text,
        overlay_subtext: videoFormData.overlay_subtext,
        isVisible: videoFormData.isVisible,
        order: editingVideo ? editingVideo.order : allVideos.length,
        created_at: editingVideo ? editingVideo.id : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingVideo) {
        const videoRef = ref(db, `video_overlay_items/${editingVideo.id}`);
        await update(videoRef, videoData);
      } else {
        const videosRef = ref(db, 'video_overlay_items');
        await push(videosRef, videoData);
      }

      await fetchData();
      resetVideoForm();
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const sectionData = {
        title: sectionFormData.title,
        subtitle: sectionFormData.subtitle,
        videos: sectionFormData.videos,
        is_visible: sectionFormData.is_visible,
        order_index: editingSection ? editingSection.order_index : sections.length,
        updated_at: new Date().toISOString()
      };

      if (editingSection) {
        const sectionRef = ref(db, `video_overlay_sections/${editingSection.id}`);
        await update(sectionRef, sectionData);
      } else {
        const sectionsRef = ref(db, 'video_overlay_sections');
        await push(sectionsRef, {
          ...sectionData,
          created_at: new Date().toISOString()
        });
      }

      await fetchData();
      resetSectionForm();
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const videoRef = ref(db, `video_overlay_items/${id}`);
      await remove(videoRef);
      await fetchData();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const sectionRef = ref(db, `video_overlay_sections/${id}`);
      await remove(sectionRef);
      await fetchData();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const toggleVideoVisibility = async (video: VideoOverlay) => {
    try {
      const videoRef = ref(db, `video_overlay_items/${video.id}`);
      await update(videoRef, { isVisible: !video.isVisible });
      await fetchData();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to update visibility');
    }
  };

  const toggleSectionVisibility = async (section: VideoOverlaySection) => {
    try {
      const sectionRef = ref(db, `video_overlay_sections/${section.id}`);
      await update(sectionRef, { is_visible: !section.is_visible });
      await fetchData();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to update visibility');
    }
  };

  const moveVideo = async (video: VideoOverlay, direction: 'up' | 'down') => {
    const currentIndex = video.order;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= allVideos.length) return;

    const targetVideo = allVideos.find(v => v.order === targetIndex);
    if (!targetVideo) return;

    try {
      const updates: Record<string, any> = {};
      updates[`video_overlay_items/${video.id}/order`] = targetIndex;
      updates[`video_overlay_items/${targetVideo.id}/order`] = currentIndex;
      await update(ref(db), updates);
      await fetchData();
    } catch (error) {
      console.error('Error moving video:', error);
      alert('Failed to reorder video');
    }
  };

  const moveSection = async (section: VideoOverlaySection, direction: 'up' | 'down') => {
    const currentIndex = section.order_index;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const targetSection = sections.find(s => s.order_index === targetIndex);
    if (!targetSection) return;

    try {
      const updates: Record<string, any> = {};
      updates[`video_overlay_sections/${section.id}/order_index`] = targetIndex;
      updates[`video_overlay_sections/${targetSection.id}/order_index`] = currentIndex;
      await update(ref(db), updates);
      await fetchData();
    } catch (error) {
      console.error('Error moving section:', error);
      alert('Failed to reorder section');
    }
  };

  const resetVideoForm = () => {
    setVideoFormData({
      video_url: '',
      overlay_text: '',
      overlay_subtext: '',
      isVisible: true
    });
    setEditingVideo(null);
    setShowVideoForm(false);
  };

  const resetSectionForm = () => {
    setSectionFormData({
      title: '',
      subtitle: '',
      videos: [],
      is_visible: true
    });
    setEditingSection(null);
    setShowSectionForm(false);
  };

  const handleEditVideo = (video: VideoOverlay) => {
    setEditingVideo(video);
    setVideoFormData({
      video_url: video.video_url,
      overlay_text: video.overlay_text,
      overlay_subtext: video.overlay_subtext,
      isVisible: video.isVisible
    });
    setShowVideoForm(true);
  };

  const handleEditSection = (section: VideoOverlaySection) => {
    setEditingSection(section);
    setSectionFormData({
      title: section.title,
      subtitle: section.subtitle,
      videos: section.videos || [],
      is_visible: section.is_visible
    });
    setShowSectionForm(true);
  };

  const toggleVideoSelection = (videoId: string) => {
    setSectionFormData(prev => ({
      ...prev,
      videos: prev.videos.includes(videoId)
        ? prev.videos.filter(id => id !== videoId)
        : [...prev.videos, videoId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Video Library</h2>
          <button
            onClick={() => {
              setShowVideoForm(!showVideoForm);
              setShowSectionForm(false);
            }}
            className="flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600"
          >
            {showVideoForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showVideoForm ? 'Cancel' : 'Add Video'}
          </button>
        </div>

        {showVideoForm && (
          <form onSubmit={handleVideoSubmit} className="bg-teal-50 rounded-2xl p-6 border-2 border-teal-200 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingVideo ? 'Edit Video' : 'Add New Video'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Video URL (YouTube Embed URL) *
                </label>
                <input
                  type="url"
                  required
                  value={videoFormData.video_url}
                  onChange={(e) => setVideoFormData({ ...videoFormData, video_url: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                />
                <p className="text-xs text-gray-500 mt-1">Use YouTube embed URL format</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Overlay Title *
                </label>
                <input
                  type="text"
                  required
                  value={videoFormData.overlay_text}
                  onChange={(e) => setVideoFormData({ ...videoFormData, overlay_text: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  placeholder="e.g., Product Showcase"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Overlay Subtitle
                </label>
                <input
                  type="text"
                  value={videoFormData.overlay_subtext}
                  onChange={(e) => setVideoFormData({ ...videoFormData, overlay_subtext: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  placeholder="e.g., Watch our latest collection"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="video_visible"
                  checked={videoFormData.isVisible}
                  onChange={(e) => setVideoFormData({ ...videoFormData, isVisible: e.target.checked })}
                  className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="video_visible" className="text-sm font-bold text-gray-700">
                  Video is visible
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
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
                      {editingVideo ? 'Update' : 'Save'} Video
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetVideoForm}
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
          {allVideos.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-500">No videos created yet. Add your first video to get started.</p>
            </div>
          ) : (
            allVideos.map((video) => (
              <div
                key={video.id}
                className={`bg-white rounded-xl p-6 border-2 ${
                  video.isVisible ? 'border-teal-200' : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{video.overlay_text}</h3>
                    {video.overlay_subtext && (
                      <p className="text-gray-600 mb-3">{video.overlay_subtext}</p>
                    )}
                    <p className="text-sm text-gray-500 break-all">{video.video_url}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveVideo(video, 'up')}
                        disabled={video.order === 0}
                        className="p-2 text-gray-600 hover:text-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => moveVideo(video, 'down')}
                        disabled={video.order === allVideos.length - 1}
                        className="p-2 text-gray-600 hover:text-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => toggleVideoVisibility(video)}
                      className="p-3 text-gray-600 hover:text-teal-600 transition-colors"
                      title={video.isVisible ? 'Hide video' : 'Show video'}
                    >
                      {video.isVisible ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditVideo(video)}
                      className="p-3 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Edit video"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="p-3 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete video"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t-4 border-gray-200 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Video Overlay Sections</h2>
          <button
            onClick={() => {
              setShowSectionForm(!showSectionForm);
              setShowVideoForm(false);
            }}
            className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors border-2 border-blue-600"
          >
            {showSectionForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showSectionForm ? 'Cancel' : 'Add Section'}
          </button>
        </div>

        {showSectionForm && (
          <form onSubmit={handleSectionSubmit} className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingSection ? 'Edit Section' : 'Add New Section'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Section Title *
                </label>
                <input
                  type="text"
                  required
                  value={sectionFormData.title}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Featured Videos"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={sectionFormData.subtitle}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Watch our latest videos"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Select Videos *
                </label>
                <div className="border-2 border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {allVideos.filter(v => v.isVisible).length === 0 ? (
                    <p className="text-gray-500 text-center">No videos available</p>
                  ) : (
                    allVideos.filter(v => v.isVisible).map((video) => (
                      <label
                        key={video.id}
                        className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={sectionFormData.videos.includes(video.id)}
                          onChange={() => toggleVideoSelection(video.id)}
                          className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="block text-gray-900 font-medium">{video.overlay_text}</span>
                          {video.overlay_subtext && (
                            <span className="block text-sm text-gray-500">{video.overlay_subtext}</span>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {sectionFormData.videos.length}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="section_visible"
                  checked={sectionFormData.is_visible}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, is_visible: e.target.checked })}
                  className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="section_visible" className="text-sm font-bold text-gray-700">
                  Show on homepage
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving || sectionFormData.videos.length === 0}
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
                      {editingSection ? 'Update' : 'Save'} Section
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetSectionForm}
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
            sections.map((section) => (
              <div
                key={section.id}
                className={`bg-white rounded-xl p-6 border-2 ${
                  section.is_visible ? 'border-blue-200' : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{section.title}</h3>
                    {section.subtitle && (
                      <p className="text-gray-600 mb-3">{section.subtitle}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full">
                        {section.videos.length} videos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveSection(section, 'up')}
                        disabled={section.order_index === 0}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => moveSection(section, 'down')}
                        disabled={section.order_index === sections.length - 1}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => toggleSectionVisibility(section)}
                      className="p-3 text-gray-600 hover:text-blue-600 transition-colors"
                      title={section.is_visible ? 'Hide section' : 'Show section'}
                    >
                      {section.is_visible ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditSection(section)}
                      className="p-3 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Edit section"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="p-3 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete section"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

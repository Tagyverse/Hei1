import { useState, useEffect } from 'react';
import { X, Upload, Check, Image as ImageIcon, Loader, RefreshCw } from 'lucide-react';
import LazyImage from '../LazyImage';

interface R2Image {
  key: string;
  url: string;
  uploaded: string;
  size: number;
}

interface R2ImageSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (urls: string | string[]) => void;
  multiple?: boolean;
  currentValue?: string | string[];
  title?: string;
}

export default function R2ImageSelectorDialog({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  currentValue,
  title = 'Select Images'
}: R2ImageSelectorDialogProps) {
  const [images, setImages] = useState<R2Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadImages();

      if (currentValue) {
        if (Array.isArray(currentValue)) {
          setSelectedUrls(currentValue);
        } else {
          setSelectedUrls(currentValue ? [currentValue] : []);
        }
      } else {
        setSelectedUrls([]);
      }
    }
  }, [isOpen, currentValue]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/r2-list');
      const data = await response.json();
      if (response.ok || data.images) {
        // Ensure images array exists
        const imageList = Array.isArray(data.images) ? data.images : [];
        setImages(imageList);
        if (imageList.length === 0) {
          console.log('[v0] No images in R2, using empty state for demo');
        }
      } else {
        console.error('Failed to load images:', data);
        setImages([]);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (url: string) => {
    try {
      if (multiple) {
        setSelectedUrls(prev => {
          const isSelected = prev.includes(url);
          if (isSelected) {
            return prev.filter(u => u !== url);
          } else {
            return [...prev, url];
          }
        });
      } else {
        setSelectedUrls([url]);
      }
    } catch (error) {
      console.error('[v0] Error selecting image:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/r2-upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            console.log('[v0] Image uploaded:', data.fileName);
            uploadedUrls.push(data.url);
          }
        } else {
          const errorData = await response.json();
          console.warn('[v0] Upload failed for file:', file.name, errorData);
        }

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      if (uploadedUrls.length > 0) {
        console.log('[v0] Successfully uploaded', uploadedUrls.length, 'images');
        if (multiple) {
          setSelectedUrls(prev => [...prev, ...uploadedUrls]);
        } else {
          setSelectedUrls([uploadedUrls[0]]);
        }
        
        // Reload images to show newly uploaded ones
        setTimeout(() => {
          loadImages();
        }, 500);
      } else {
        console.warn('[v0] No images were uploaded successfully');
      }
    } catch (error) {
      console.error('[v0] Upload error:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleConfirm = () => {
    if (multiple) {
      onSelect(selectedUrls);
    } else {
      onSelect(selectedUrls[0] || '');
    }
    onClose();
  };

  const filteredImages = images.filter(img =>
    img.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-teal-50 to-emerald-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {multiple ? 'Select one or more images' : 'Select an image'} from your R2 storage or upload new ones
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadImages}
                disabled={loading}
                className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-teal-500 transition-colors flex items-center gap-2 font-semibold text-gray-700"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <label className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors cursor-pointer flex items-center gap-2 font-semibold">
                <Upload className="w-5 h-5" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  multiple={multiple}
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {uploading && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Uploading...</span>
                <span className="text-teal-600 font-bold">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {selectedUrls.length > 0 && (
            <div className="mt-3 flex items-center justify-between bg-teal-50 border-2 border-teal-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-600" />
                <span className="text-sm font-semibold text-teal-900">
                  {selectedUrls.length} image{selectedUrls.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <button
                onClick={() => setSelectedUrls([])}
                className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-12 h-12 text-teal-500 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Loading images...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 font-semibold text-lg">No images found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm ? 'Try a different search term' : 'Upload your first image to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredImages.map((image) => {
                const isSelected = selectedUrls.includes(image.url);
                return (
                  <button
                    key={image.key}
                    onClick={() => handleImageClick(image.url)}
                    className={`relative group rounded-xl overflow-hidden border-4 transition-all hover:scale-105 ${
                      isSelected
                        ? 'border-teal-500 shadow-lg shadow-teal-200'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-square bg-gray-100">
                      <LazyImage
                        src={image.url}
                        alt={image.key}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-teal-500 text-white rounded-full p-2 shadow-lg">
                        <Check className="w-5 h-5" />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-white text-xs font-medium truncate">{image.key}</p>
                      <p className="text-white/70 text-xs">{(image.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-white transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedUrls.length === 0}
            className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}

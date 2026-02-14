import React, { useState, useEffect } from 'react';
import { Image, Upload, Trash2, RefreshCw, Check, X, Download, Info } from 'lucide-react';

interface R2Image {
  key: string;
  size: number;
  uploaded: string;
  url: string;
}

interface GalleryManagerProps {
  onSelectImages?: (urls: string[]) => void;
  selectionMode?: boolean;
  maxSelections?: number;
}

export default function R2GalleryManager({
  onSelectImages,
  selectionMode = false,
  maxSelections = 10
}: GalleryManagerProps) {
  const [images, setImages] = useState<R2Image[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/r2-list?prefix=images/&limit=100');
      if (!response.ok) throw new Error('Failed to load images');

      const data = await response.json();

      // Check if in dev mode
      if (data.devMode) {
        setIsDevMode(true);
      }

      setImages(data.images || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const uploadPromises = Array.from(files).map(async (file) => {
      if (!file.type.startsWith('image/')) {
        throw new Error(`${file.name} is not an image`);
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error(`${file.name} is larger than 2MB`);
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/r2-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      return await response.json();
    });

    try {
      await Promise.all(uploadPromises);
      setSuccess(`Successfully uploaded ${files.length} image(s)`);
      await loadImages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toggleSelection = (key: string) => {
    const newSelection = new Set(selectedImages);

    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      if (newSelection.size >= maxSelections) {
        setError(`Maximum ${maxSelections} images can be selected`);
        setTimeout(() => setError(null), 3000);
        return;
      }
      newSelection.add(key);
    }

    setSelectedImages(newSelection);

    if (selectionMode && onSelectImages) {
      const selectedUrls = images
        .filter(img => newSelection.has(img.key))
        .map(img => img.url);
      
      // Ensure we pass the URLs correctly
      if (maxSelections === 1) {
        onSelectImages(selectedUrls.length > 0 ? [selectedUrls[selectedUrls.length - 1]] : []);
      } else {
        onSelectImages(selectedUrls);
      }
    }
  };

  const selectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
      if (selectionMode && onSelectImages) onSelectImages([]);
    } else {
      const allKeys = new Set(images.slice(0, maxSelections).map(img => img.key));
      setSelectedImages(allKeys);
      if (selectionMode && onSelectImages) {
        const selectedUrls = images
          .filter(img => allKeys.has(img.key))
          .map(img => img.url);
        onSelectImages(selectedUrls);
      }
    }
  };

  const deleteSelected = async () => {
    if (selectedImages.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedImages.size} image(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/r2-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: Array.from(selectedImages) }),
      });

      if (!response.ok) throw new Error('Failed to delete images');

      const data = await response.json();
      setSuccess(data.message);
      setSelectedImages(new Set());
      await loadImages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteSingle = async (key: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this image?');
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/r2-delete?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete image');

      setSuccess('Image deleted successfully');
      await loadImages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
            <Image className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">R2 Image Gallery</h2>
            <p className="text-sm text-black font-medium">
              {images.length} image(s) stored
              {selectedImages.size > 0 && ` • ${selectedImages.size} selected`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadImages}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#B5E5CF] border-2 border-black rounded-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-black ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-black">Refresh</span>
          </button>
        </div>
      </div>

      {isDevMode && (
        <div className="bg-yellow-100 border-2 border-yellow-600 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-yellow-900">R2 Storage Not Connected</p>
            <p className="text-sm text-yellow-800 mb-2">
              R2 bucket binding is not configured. Image upload is currently unavailable.
            </p>
            <p className="text-sm text-yellow-900 font-semibold mb-1">To fix this:</p>
            <ol className="text-sm text-yellow-800 list-decimal list-inside space-y-1">
              <li>Go to Cloudflare Dashboard → R2 → Create bucket named "pixie-blooms-images"</li>
              <li>Go to Workers & Pages → Your Project → Settings → Functions</li>
              <li>Add R2 bucket binding: Variable name = "R2_BUCKET", Bucket = "pixie-blooms-images"</li>
              <li>Save and redeploy your site</li>
            </ol>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-2 border-red-600 rounded-lg p-4 flex items-start gap-3">
          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900">Error</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-2 border-green-600 rounded-lg p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-green-900">Success</p>
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border-4 border-black p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-black">Upload Images</h3>
          <label className="flex items-center gap-2 px-4 py-2 bg-black text-white border-2 border-black rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">
              {uploading ? 'Uploading...' : 'Choose Files'}
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-black font-medium">
          Select one or multiple images (max 2MB each, JPG/PNG)
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-4 border-black p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-black">Gallery</h3>
          <div className="flex items-center gap-2">
            {images.length > 0 && (
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-sm font-medium text-black border-2 border-black rounded-lg hover:bg-[#B5E5CF] transition-colors"
              >
                {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
            {selectedImages.size > 0 && (
              <button
                onClick={deleteSelected}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white border-2 border-black rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Delete ({selectedImages.size})</span>
              </button>
            )}
          </div>
        </div>

        {loading && images.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-black animate-spin mx-auto mb-4" />
            <p className="text-black font-medium">Loading images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-black font-medium">No images uploaded yet</p>
            <p className="text-sm text-gray-600 mt-2">Upload some images to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.key}
                className={`relative group bg-gray-50 border-2 rounded-lg overflow-hidden transition-all ${
                  selectedImages.has(image.key)
                    ? 'border-black ring-4 ring-black'
                    : 'border-gray-300 hover:border-black'
                }`}
              >
                <div
                  className="aspect-square cursor-pointer"
                  onClick={() => toggleSelection(image.key)}
                >
                  <img
                    src={image.url}
                    alt={image.key}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {selectedImages.has(image.key) && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-black border-2 border-white rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-75 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate" title={image.key}>
                        {image.key.split('/').pop()}
                      </p>
                      <p className="text-xs text-gray-300">{formatFileSize(image.size)}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <a
                        href={image.url}
                        download
                        className="p-1.5 bg-white rounded hover:bg-gray-200 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-3.5 h-3.5 text-black" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSingle(image.key);
                        }}
                        className="p-1.5 bg-red-500 rounded hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  className="absolute top-2 right-2 p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                  title={`Uploaded: ${formatDate(image.uploaded)}\nSize: ${formatFileSize(image.size)}\nKey: ${image.key}`}
                >
                  <Info className="w-4 h-4 text-black" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectionMode && (
        <div className="bg-[#B5E5CF] border-2 border-black rounded-lg p-4">
          <p className="text-sm font-medium text-black">
            Selection Mode: Click images to select them for use. Maximum {maxSelections} images.
          </p>
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { Upload, X, Loader, Zap, Image as ImageIcon } from 'lucide-react';
import { compressImage, formatFileSize } from '../utils/imageOptimization';
import LazyImage from './LazyImage';
import R2ImageSelectorDialog from './admin/R2ImageSelectorDialog';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export default function ImageUpload({ value, onChange, label = 'Image', className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError('Image size must be less than 2MB');
      return;
    }

    setError(null);
    setCompressionInfo(null);
    setUploading(true);

    try {
      const originalSize = file.size;
      const isPNG = file.type === 'image/png';

      const compressedBlob = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
      });

      const compressedSize = compressedBlob.size;
      const savedPercent = Math.round(((originalSize - compressedSize) / originalSize) * 100);

      setCompressionInfo(
        `Optimized: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${savedPercent}% saved)${isPNG ? ' (PNG transparency preserved)' : ''}`
      );

      const formData = new FormData();
      const compressedFile = new File([compressedBlob], file.name, { type: compressedBlob.type });
      formData.append('file', compressedFile);

      const response = await fetch('/api/r2-upload', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Upload failed');
      }

      if (!responseData.url) {
        console.warn('[v0] Upload response missing URL:', responseData);
        throw new Error('Upload returned no URL');
      }

      console.log('[v0] Image uploaded successfully:', responseData.fileName);
      onChange(responseData.url);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>

      <div className="space-y-3">
        {value ? (
          <div className="relative inline-block">
            <LazyImage
              src={value}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-xl border-2 border-teal-200"
            />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id={`file-upload-${label}`}
            />
            <label
              htmlFor={`file-upload-${label}`}
              className={`inline-flex items-center px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors cursor-pointer ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </label>
            <button
              type="button"
              onClick={() => setShowGallery(true)}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 bg-white border-2 border-teal-500 text-teal-600 rounded-xl hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Browse Gallery
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Upload new image or select from existing R2 gallery
          </p>
        </div>

        {compressionInfo && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <Zap className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700">{compressionInfo}</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {value && (
          <div className="mt-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
              placeholder="Or paste image URL directly"
            />
          </div>
        )}
      </div>

      <R2ImageSelectorDialog
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={(url) => {
          if (typeof url === 'string') {
            onChange(url);
          }
        }}
        multiple={false}
        currentValue={value}
        title={`Select ${label}`}
      />
    </div>
  );
}

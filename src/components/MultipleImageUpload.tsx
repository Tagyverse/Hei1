import { useState } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import LazyImage from './LazyImage';
import R2ImageSelectorDialog from './admin/R2ImageSelectorDialog';
import ImageUpload from './ImageUpload';

interface MultipleImageUploadProps {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
}

export default function MultipleImageUpload({ label, images, onChange }: MultipleImageUploadProps) {
  const [showGallery, setShowGallery] = useState(false);

  const handleAddImages = (urls: string | string[]) => {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    onChange([...images, ...urlArray]);
  };

  const handleUpdateImage = (index: number, url: string) => {
    const newImages = [...images];
    newImages[index] = url;
    onChange(newImages);
  };

  const handleRemoveImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>

      <div className="space-y-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="flex gap-3 items-start">
            <div className="flex-1">
              <ImageUpload
                label={`Image ${index + 1}`}
                value={imageUrl}
                onChange={(url) => handleUpdateImage(index, url)}
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="mt-8 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange([...images, ''])}
            className="flex-1 px-4 py-3 border-2 border-dashed border-teal-300 rounded-xl text-teal-600 hover:border-teal-500 hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Single Image
          </button>
          <button
            type="button"
            onClick={() => setShowGallery(true)}
            className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <ImageIcon className="w-5 h-5" />
            Select from Gallery
          </button>
        </div>
      </div>

      <R2ImageSelectorDialog
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={handleAddImages}
        multiple={true}
        currentValue={images}
        title="Select Gallery Images"
      />
    </div>
  );
}

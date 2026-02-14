import { Check } from 'lucide-react';

interface ColorPickerProps {
  selectedColors: string[];
  onChange: (colors: string[]) => void;
}

const PRESET_COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Beige', hex: '#D4C5B9' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Lime', hex: '#84CC16' },
];

export default function ColorPicker({ selectedColors, onChange }: ColorPickerProps) {
  const toggleColor = (colorName: string) => {
    if (selectedColors.includes(colorName)) {
      onChange(selectedColors.filter(c => c !== colorName));
    } else {
      onChange([...selectedColors, colorName]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Available Colors (Optional)
        {selectedColors.length > 0 && (
          <span className="ml-2 text-teal-600">({selectedColors.length} selected)</span>
        )}
      </label>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
        {PRESET_COLORS.map((color) => {
          const isSelected = selectedColors.includes(color.name);
          const isWhiteOrLight = ['#FFFFFF', '#FFFDD0', '#D4C5B9'].includes(color.hex);

          return (
            <button
              key={color.name}
              type="button"
              onClick={() => toggleColor(color.name)}
              className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-teal-600 ring-2 ring-teal-200 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {isWhiteOrLight && (
                    <div className="absolute inset-0 rounded-full border border-gray-300"></div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-teal-600 rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <span className={`text-xs font-medium text-center ${
                isSelected ? 'text-teal-600' : 'text-gray-600'
              }`}>
                {color.name}
              </span>
            </button>
          );
        })}
      </div>
      {selectedColors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Selected:</span>
          {selectedColors.map((color) => (
            <span
              key={color}
              className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              {color}
              <button
                type="button"
                onClick={() => toggleColor(color)}
                className="hover:text-teal-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

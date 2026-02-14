import { X } from 'lucide-react';
import { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-md rounded-2xl max-h-[80vh] flex flex-col animate-scale-in overflow-hidden border-4 border-black">
        <div className="flex items-center justify-between p-5 border-b-4 border-black bg-[#B5E5CF]">
          <h2 className="text-lg font-semibold text-black">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white hover:bg-gray-100 transition-all duration-200 hover:scale-110 hover:rotate-90 border-2 border-black"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-[#B5E5CF]">
          <div className="prose prose-sm prose-gray max-w-none text-black">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

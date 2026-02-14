import { X, XCircle } from 'lucide-react';

interface PaymentCancelledDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export default function PaymentCancelledDialog({
  isOpen,
  onClose,
  onRetry
}: PaymentCancelledDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto w-full border-t-4 border-black animate-slide-up max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-[#B5E5CF] p-6 relative border-b-4 border-black rounded-t-3xl flex-shrink-0">
          <div className="w-12 h-1.5 bg-black rounded-full mx-auto mb-4"></div>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-black hover:bg-gray-100 transition-all hover:scale-110"
          >
            <X className="w-5 h-5 text-black" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 border-2 border-black">
              <XCircle className="w-6 h-6 md:w-7 md:h-7 text-black" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-black">Payment Cancelled</h2>
          </div>
        </div>

        <div className="space-y-4 p-6 bg-white overflow-y-auto flex-1">
          <p className="text-sm md:text-base text-black font-medium">
            You cancelled the payment process. Your order has not been placed yet.
          </p>

          <div className="bg-white border-2 border-black rounded-xl p-3 md:p-4">
            <p className="text-xs md:text-sm text-black font-bold">
              No charges were made to your account.
            </p>
          </div>

          <div className="bg-white rounded-xl p-3 md:p-4 border-2 border-black">
            <p className="text-xs md:text-sm text-black">
              <span className="font-bold">What would you like to do?</span>
            </p>
            <ul className="text-xs md:text-sm text-black space-y-1 list-disc list-inside mt-2 font-medium">
              <li>Try again with a different payment method</li>
              <li>Review your cart and shipping details</li>
              <li>Continue shopping for more items</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="w-full bg-[#B5E5CF] text-black py-3 md:py-4 rounded-xl font-bold text-sm md:text-base hover:bg-white transition-colors border-2 border-black"
            >
              Try Payment Again
            </button>
            <button
              onClick={onClose}
              className="w-full bg-white text-black py-3 md:py-4 rounded-xl font-bold text-sm md:text-base hover:bg-gray-100 transition-colors border-2 border-black"
            >
              Back to Cart
            </button>
          </div>

          <p className="text-xs md:text-sm text-black text-center mt-4 md:mt-6 font-medium">
            Your items are still in your cart
          </p>
        </div>
      </div>
    </div>
  );
}

import { CheckCircle, Package, X } from 'lucide-react';
import { useEffect } from 'react';

interface OrderConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails?: {
    orderId: string;
    totalAmount: number;
    customerName: string;
  };
}

export default function OrderConfirmationDialog({ isOpen, onClose, orderDetails }: OrderConfirmationDialogProps) {
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
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto w-full border-t-4 border-black animate-slide-up">
        <div className="bg-[#B5E5CF] p-6 relative border-b-4 border-black rounded-t-3xl">
          <div className="w-12 h-1.5 bg-black rounded-full mx-auto mb-4"></div>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-black hover:bg-gray-100 transition-all hover:scale-110"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        <div className="p-8 text-center bg-white">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="relative bg-white rounded-full p-4 border-3 border-black">
                <CheckCircle className="w-16 h-16 text-black" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-black mb-3">
            Thank You!
          </h2>

          <p className="text-lg text-black mb-2 font-semibold">
            Your order is on the way
          </p>

          <p className="text-black mb-8 font-medium">
            We've received your order and will process it shortly. You'll receive a confirmation email soon.
          </p>

          {orderDetails && (
            <div className="bg-white rounded-2xl p-6 mb-6 border-3 border-black">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Package className="w-5 h-5 text-black" />
                <h3 className="font-bold text-black">Order Details</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-black font-medium">Order ID:</span>
                  <span className="font-semibold text-black">{orderDetails.orderId.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black font-medium">Total Amount:</span>
                  <span className="font-bold text-black">₹{orderDetails.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black font-medium">Customer:</span>
                  <span className="font-semibold text-black">{orderDetails.customerName}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-[#B5E5CF] text-black py-4 rounded-xl font-bold text-lg hover:bg-white transition-all border-2 border-black"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

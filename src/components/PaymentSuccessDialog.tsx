import { useState, useEffect } from 'react';
import { X, CheckCircle, Download, File } from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';

interface PaymentSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails?: {
    orderId: string;
    totalAmount: number;
    customerName: string;
    paymentId: string;
  };
}

export default function PaymentSuccessDialog({
  isOpen,
  onClose,
  orderDetails
}: PaymentSuccessDialogProps) {
  const [billImageUrl, setBillImageUrl] = useState<string | null>(null);
  const [loadingBill, setLoadingBill] = useState(false);

  useEffect(() => {
    if (isOpen && orderDetails?.orderId) {
      loadBillImage();
    }
  }, [isOpen, orderDetails?.orderId]);

  const loadBillImage = async () => {
    if (!orderDetails?.orderId) return;
    
    setLoadingBill(true);
    try {
      const orderRef = ref(db, `orders/${orderDetails.orderId}`);
      const snapshot = await get(orderRef);
      
      if (snapshot.exists()) {
        const orderData = snapshot.val();
        if (orderData.bill_image_url) {
          setBillImageUrl(orderData.bill_image_url);
          console.log('[v0] Bill image loaded from Firebase');
        }
      }
    } catch (error) {
      console.error('[v0] Error loading bill image:', error);
    } finally {
      setLoadingBill(false);
    }
  };

  if (!isOpen) {
    return null;
  }

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
              <CheckCircle className="w-6 h-6 md:w-7 md:h-7 text-black" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-black">Payment Successful</h2>
          </div>
        </div>

        <div className="space-y-4 p-6 bg-white overflow-y-auto flex-1">
          <div className="bg-white rounded-xl p-4 md:p-6 border-2 border-black">
            <p className="text-xs md:text-sm text-black mb-2 font-medium">Order ID</p>
            <p className="text-lg md:text-xl font-bold text-black font-mono break-all">
              #{orderDetails?.orderId?.slice(-8).toUpperCase()}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm md:text-base text-black font-medium">Customer Name</span>
              <span className="font-semibold text-sm md:text-base text-black text-right">{orderDetails?.customerName}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm md:text-base text-black font-medium">Amount Paid</span>
              <span className="font-bold text-black text-lg md:text-xl">
                ₹{orderDetails?.totalAmount.toFixed(2)}
              </span>
            </div>
            {orderDetails?.paymentId && (
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm md:text-base text-black flex-shrink-0 font-medium">Payment ID</span>
                <span className="font-mono text-xs text-black break-all text-right">
                  {orderDetails.paymentId.slice(0, 20)}...
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-3 md:p-4 border-2 border-black">
            <p className="text-xs md:text-sm text-black font-bold text-center">
              Your order has been confirmed and is being processed!
            </p>
          </div>

          {billImageUrl && (
            <div className="bg-white rounded-xl border-2 border-black overflow-hidden">
              <div className="p-3 md:p-4 border-b-2 border-black flex items-center gap-2">
                <File className="w-4 h-4 md:w-5 md:h-5 text-black" />
                <p className="text-xs md:text-sm text-black font-bold">Order Invoice</p>
              </div>
              <img 
                src={billImageUrl} 
                alt="Order Invoice" 
                className="w-full h-auto max-h-64 md:max-h-96 object-cover"
              />
            </div>
          )}

          {loadingBill && (
            <div className="bg-white rounded-xl p-4 border-2 border-black flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
              <span className="text-xs md:text-sm text-black font-medium ml-2">Loading invoice...</span>
            </div>
          )}

          <div className="bg-white rounded-xl p-3 md:p-4 border-2 border-black">
            <p className="text-xs md:text-sm text-black font-medium">
              <span className="font-bold">What's next?</span>
              <br />
              You'll receive an order confirmation email shortly. Track your order status from your orders page.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onClose}
              className="w-full bg-[#B5E5CF] text-black py-3 md:py-4 rounded-xl font-bold text-sm md:text-base hover:bg-white transition-colors border-2 border-black"
            >
              Continue Shopping
            </button>
          </div>

          <p className="text-xs md:text-sm text-black text-center mt-4 md:mt-6 font-medium">
            Thank you for shopping with us!
          </p>
        </div>
      </div>
    </div>
  );
}

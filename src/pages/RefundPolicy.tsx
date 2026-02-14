import { ArrowLeft } from 'lucide-react';

interface RefundPolicyProps {
  onBack: () => void;
}

export default function RefundPolicy({ onBack }: RefundPolicyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-mint-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 lg:p-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Refund & Cancellation Policy</h1>

          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="text-base leading-relaxed">
              All orders placed with Pixie Blooms are final. We do not accept order cancellations or returns once an order is confirmed. Refunds are applicable only in case of damage during transit. To be eligible for a refund, customers must provide a clear full opening video from start to end showing the package and the damaged product. No refund requests will be accepted without an opening video. Minor color variations or damages caused after delivery are not eligible for a refund. Approved refunds will be processed after verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

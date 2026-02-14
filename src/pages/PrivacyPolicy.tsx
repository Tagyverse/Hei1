import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p className="text-lg leading-relaxed">
              At Pixie Blooms, we truly value your trust and are committed to protecting your personal information. When you shop with us, we collect only the essential details, such as your name, phone number, email, and address, to process your orders smoothly and keep you updated. Your payment information is never stored or viewed by us, as all transactions are handled securely through trusted payment gateways. We use your data only to fulfil your orders, improve your experience, and provide customer support, and we share it solely with our delivery partners when required. We do not sell, rent, or misuse your information under any circumstances. Our website may use basic cookies to help us understand your preferences and offer a better browsing experience. Your data is always handled with care, confidentiality, and respect. By using our website, you agree to this Privacy Policy, and you can contact us anytime if you want your information updated or removed.
            </p>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

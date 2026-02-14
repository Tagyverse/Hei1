import { useState } from 'react';
import { X, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import BottomSheet from './BottomSheet';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-3xl border-4 border-black w-full max-w-md">
        <div className="bg-[#B5E5CF] p-6 sm:p-8 text-black relative overflow-hidden rounded-t-3xl border-b-4 border-black">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-all hover:scale-110 z-10 border-2 border-black"
          >
            <X className="w-5 h-5 text-black" />
          </button>

          <div className="relative">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-black flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-black" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 text-black">
                  Welcome Back
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </h2>
              </div>
            </div>
            <p className="text-black text-xs sm:text-sm leading-relaxed font-medium">
              Sign in securely with your Google account
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all border-2 border-gray-300 hover:border-teal-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              {loading && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-200 overflow-hidden">
                  <div className="h-full bg-gray-900 animate-progress"></div>
                </div>
              )}
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="group-hover:text-gray-900">
                    Continue with Google
                  </span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-black leading-relaxed font-medium">
              By continuing, you agree to our{' '}
              <button
                onClick={() => setShowTerms(true)}
                className="text-black font-bold hover:text-gray-800 underline"
              >
                Terms & Conditions
              </button> and{' '}
              <button
                onClick={() => setShowPrivacy(true)}
                className="text-black font-bold hover:text-gray-800 underline"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>

      <BottomSheet isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms & Conditions">
        <div className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            By using the Pixie Blooms website and placing an order, you agree to our terms and conditions. All our products are handmade, so slight variations in colour, size, or design may occur, and product photos are for reference only. Once an order is placed and processing has started, it cannot be cancelled, especially for customised items. Prices shown on the website may change anytime, but the amount displayed at checkout is the final price you will pay. All payments are processed securely through trusted gateways, and we do not store or access any of your payment details. We ship across India through reliable couriers, but delivery delays due to courier issues, weather, or incorrect addresses are beyond our control. We do not accept returns or exchanges unless the product is damaged on arrival, and such issues must be reported within 24 hours with clear photo and video proof. All designs, photos, and content belong to Pixie Blooms and cannot be copied or reused without permission. By continuing to use our website, you agree to follow these terms, and you can contact us anytime at pixieblooms2512@gmail.com for any queries.
          </p>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Policy">
        <div className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            At Pixie Blooms, we truly value your trust and are committed to protecting your personal information. When you shop with us, we collect only the essential details, such as your name, phone number, email, and address, to process your orders smoothly and keep you updated. Your payment information is never stored or viewed by us, as all transactions are handled securely through trusted payment gateways. We use your data only to fulfil your orders, improve your experience, and provide customer support, and we share it solely with our delivery partners when required. We do not sell, rent, or misuse your information under any circumstances. Our website may use basic cookies to help us understand your preferences and offer a better browsing experience. Your data is always handled with care, confidentiality, and respect. By using our website, you agree to this Privacy Policy, and you can contact us anytime if you want your information updated or removed.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}

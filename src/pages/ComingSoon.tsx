import { Sparkles, Clock } from 'lucide-react';

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-purple-200">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6 animate-pulse">
            <Sparkles className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Coming Soon
          </h1>

          <p className="text-xl text-gray-700 mb-6">
            Our store is being prepared with amazing products just for you!
          </p>

          <div className="bg-purple-50 rounded-2xl p-6 mb-8 border-2 border-purple-200">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Clock className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-semibold text-purple-800">We're Almost Ready</span>
            </div>
            <p className="text-gray-600">
              Our team is working hard to bring you the best shopping experience. Check back soon!
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              Follow us on social media to stay updated on our launch
            </p>
            
            <div className="flex justify-center gap-4">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <p className="text-sm text-gray-500">
              Thank you for your patience. Something special is on the way! ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ArrowLeft, Mail, Phone } from 'lucide-react';

interface ContactProps {
  onBack: () => void;
}

export default function Contact({ onBack }: ContactProps) {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-8 border-2 border-teal-200">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Phone</h3>
                  <a href="tel:+919345259073" className="text-2xl text-teal-600 font-bold hover:text-teal-700 transition-colors">
                    +919345259073
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-8 border-2 border-teal-200">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Email</h3>
                  <a href="mailto:pixieblooms2512@gmail.com" className="text-xl text-teal-600 font-bold hover:text-teal-700 transition-colors break-all">
                    pixieblooms2512@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

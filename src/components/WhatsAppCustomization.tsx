import { MessageCircle, Sparkles } from 'lucide-react';

export default function WhatsAppCustomization() {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Hi! I would like to customize an accessory. Can you help me with custom designs?');
    const whatsappNumber = '919345259073';
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-mint-600 rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-teal-200 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-mint-400/20 rounded-full blur-2xl"></div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">Want Something Custom?</h3>
        </div>

        <p className="text-white/95 mb-5 leading-relaxed">
          Create unique, personalized accessories tailored to your style. From custom colors to special designs, we'll craft the perfect piece just for you!
        </p>

        <button
          onClick={handleWhatsAppClick}
          className="w-full bg-white text-teal-600 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
          WhatsApp Us for Customization
        </button>

        <div className="mt-4 flex items-start gap-2 text-white/90 text-sm">
          <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Get personalized design consultation, exclusive custom pieces, and expert craftsmanship guidance
          </p>
        </div>
      </div>
    </div>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  );
}

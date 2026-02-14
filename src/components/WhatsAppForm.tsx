import { useState } from 'react';
import { MessageCircle, Send, RotateCcw } from 'lucide-react';

export default function WhatsAppForm() {
  const [name, setName] = useState('');
  const [doubt, setDoubt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !doubt.trim()) {
      alert('Please fill in both fields');
      return;
    }

    const message = `Hi, I'm ${name}. ${doubt}`;
    const whatsappNumber = '919345259073';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');

    setName('');
    setDoubt('');
  };

  const handleClear = () => {
    setName('');
    setDoubt('');
  };

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-[#075E54] p-3 sm:p-4 flex items-center gap-3 border-b border-gray-200">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center p-1.5 border-2 border-white">
              <img
                src="https://res.cloudinary.com/ds7pknmvg/image/upload/v1770820147/logo-pixieblooms_e09fgp.png"
                alt="Store"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Customer Support
              </h2>
              <p className="text-xs text-emerald-100">
                Online - Ready to help
              </p>
            </div>
          </div>

          <div className="bg-[#ECE5DD] p-4 sm:p-6 min-h-[200px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSIjZjBmMGYwIi8+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0iI2Y1ZjVmNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')]">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200 p-1">
                  <img
                    src="https://res.cloudinary.com/ds7pknmvg/image/upload/v1770820147/logo-pixieblooms_e09fgp.png"
                    alt="Store"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-[85%] border border-gray-200">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    Hi! Welcome to our store. How can I help you today?
                  </p>
                  <span className="text-xs text-gray-400 mt-1 block">Just now</span>
                </div>
              </div>

              {(name || doubt) && (
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-3 max-w-[85%] border border-emerald-200">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {name && <span className="font-medium">Hi, I'm {name}.</span>}
                      {doubt && <span className="ml-1">{doubt}</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-[#F0F0F0] p-3 sm:p-4 space-y-3 border-t border-gray-200">
            <div className="space-y-2">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name..."
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-full focus:border-[#075E54] focus:outline-none transition-all bg-white text-gray-900 placeholder-gray-500"
                required
              />
              <textarea
                id="doubt"
                value={doubt}
                onChange={(e) => setDoubt(e.target.value)}
                placeholder="Type your message..."
                rows={2}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-2xl focus:border-[#075E54] focus:outline-none transition-all bg-white text-gray-900 placeholder-gray-500 resize-none"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-full transition-all flex items-center justify-center gap-2 border border-gray-300 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold py-2.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 border border-[#20BA5A] text-sm"
              >
                <Send className="w-4 h-4" />
                Send on WhatsApp
              </button>
            </div>

            <p className="text-xs text-gray-600 text-center">
              Opens WhatsApp with your message
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

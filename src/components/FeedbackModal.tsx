'use client';

import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const emojiRatings = [
  { emoji: '😢', label: 'Very Bad', value: 1 },
  { emoji: '😕', label: 'Bad', value: 2 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '😊', label: 'Good', value: 4 },
  { emoji: '😍', label: 'Excellent', value: 5 }
];

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);

  const handleSendToWhatsApp = () => {
    if (!feedback.trim() && rating === null) {
      alert('Please add a rating or feedback');
      return;
    }

    const ratingText = rating ? emojiRatings.find(r => r.value === rating)?.emoji : '';
    const message = `*Feedback from Website*\n\n*Rating:* ${ratingText} ${rating ? emojiRatings.find(r => r.value === rating)?.label : 'No rating'}\n\n*Message:* ${feedback || 'No additional comments'}`;
    const whatsappUrl = `https://wa.me/919345259073?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    setFeedback('');
    setRating(null);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
          <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 p-4 sm:p-5 flex items-center justify-between text-white rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <h2 className="text-lg font-bold">Feedback</h2>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-2 rounded-full transition-colors active:scale-90"
              aria-label="Close feedback"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            <p className="text-gray-600 text-sm">
              Share your thoughts with us!
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                How was your experience?
              </label>
              <div className="flex justify-between gap-2">
                {emojiRatings.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setRating(item.value)}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all transform hover:scale-110 ${
                      rating === item.value
                        ? 'bg-emerald-50 border-2 border-emerald-400 scale-110'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                    title={item.label}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none"
              />
            </div>

            <button
              onClick={handleSendToWhatsApp}
              className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-500 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm active:scale-95"
            >
              <Send className="w-4 h-4" />
              Send Feedback
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

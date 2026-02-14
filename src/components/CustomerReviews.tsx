import { useEffect, useState } from 'react';
import { Quote, Star } from 'lucide-react';

const STATIC_REVIEWS = [
  {
    id: '1',
    review_text: 'Hi ma. My mom received the parcel and she said, it looks like real malli poo.. romba nalla panirukenga ma 😊 seriously worth the money sonnanga.. I saw many insta pages and didn\'t buy as those are expensive for the size they are giving.. neenga reasonable price and good quality. Will definitely refer you to my friends and will order more..🥰',
    customer_name: 'Jawahar',
  },
  {
    id: '2',
    review_text: 'Beautiful loved it thankyou so much🥰',
    customer_name: 'Deepthi',
  },
  {
    id: '3',
    review_text: 'Got the flowers, thank u for on time delivery 😊',
    customer_name: 'Andal Srinivasan',
  }
];

export default function CustomerReviews() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % STATIC_REVIEWS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-16 bg-gradient-to-br from-teal-50 to-mint-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 text-lg">
            Real reviews from real customers
          </p>
        </div>

        <div className="relative">
          <div className="p-1 bg-gradient-to-br from-teal-400 via-emerald-400 to-teal-500 rounded-3xl transition-all duration-300 hover:scale-[1.02]">
            <div className="bg-white rounded-3xl p-8 sm:p-12 min-h-[280px] flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-6 left-6 opacity-10">
                <div className="relative">
                  <Quote className="w-20 h-20 text-teal-500" />
                  <div className="absolute inset-0 blur-xl bg-gradient-to-br from-teal-400 to-emerald-400 opacity-50"></div>
                </div>
              </div>

              <div className="absolute top-6 right-6 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <div className="relative z-10">
                {STATIC_REVIEWS.map((review, index) => (
                  <div
                    key={review.id}
                    className={`transition-all duration-700 ${
                      index === currentIndex
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 absolute inset-0 translate-y-4'
                    }`}
                  >
                    <p className="text-gray-700 text-lg sm:text-xl leading-relaxed mb-8 italic">
                      "{review.review_text}"
                    </p>
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-lg">{review.customer_name}</p>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <p className="text-sm text-gray-500">Verified Customer</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {STATIC_REVIEWS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 w-10 h-3'
                    : 'bg-gray-300 hover:bg-teal-300 w-3 h-3'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

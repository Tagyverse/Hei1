import { useState, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  isVisible: boolean;
}

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadFAQs() {
      try {
        const faqsRef = ref(db, 'faqs');
        const snapshot = await get(faqsRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const faqsArray = Object.keys(data)
            .map(key => ({ ...data[key], id: key }))
            .filter((faq: FAQItem) => faq.isVisible)
            .sort((a: FAQItem, b: FAQItem) => a.order - b.order);
          setFaqs(faqsArray);
        }
      } catch (error) {
        console.error('Error loading FAQs:', error);
      }
    }

    loadFAQs();
  }, []);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 sm:mb-16 gap-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal text-gray-900">
            Frequently asked questions
          </h2>
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Looking for something?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 text-sm border-b-2 border-gray-200 focus:border-gray-900 outline-none transition-colors bg-transparent"
            />
            <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="space-y-0">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200">
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full px-0 py-6 flex items-center justify-between text-left group"
                >
                  <span className="text-base sm:text-lg text-gray-900 pr-8 font-normal">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-900 flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'max-h-96 pb-6' : 'max-h-0'
                  }`}
                >
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed pr-8">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">No questions found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

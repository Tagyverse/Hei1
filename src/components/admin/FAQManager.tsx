import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set, remove } from 'firebase/database';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  isVisible: boolean;
}

export default function FAQManager() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ question: '', answer: '', isVisible: true });

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const faqsRef = ref(db, 'faqs');
      const snapshot = await get(faqsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const faqsArray = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setFaqs(faqsArray.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
    }
  };

  const saveFAQ = async () => {
    try {
      if (!formData.question || !formData.answer) {
        alert('Please fill in all fields');
        return;
      }

      const faqsData: any = {};

      if (editingFaq) {
        const updatedFaqs = faqs.map(faq =>
          faq.id === editingFaq.id
            ? { ...faq, question: formData.question, answer: formData.answer, isVisible: formData.isVisible }
            : faq
        );
        updatedFaqs.forEach(faq => {
          faqsData[faq.id] = faq;
        });
        setFaqs(updatedFaqs);
      } else {
        const newId = `faq_${Date.now()}`;
        const newFaq: FAQ = {
          id: newId,
          question: formData.question,
          answer: formData.answer,
          order: faqs.length + 1,
          isVisible: formData.isVisible
        };
        const updatedFaqs = [...faqs, newFaq];
        updatedFaqs.forEach(faq => {
          faqsData[faq.id] = faq;
        });
        setFaqs(updatedFaqs);
      }

      await set(ref(db, 'faqs'), faqsData);

      setShowForm(false);
      setEditingFaq(null);
      setFormData({ question: '', answer: '', isVisible: true });
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('Failed to save FAQ');
    }
  };

  const deleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      await remove(ref(db, `faqs/${id}`));
      setFaqs(faqs.filter(faq => faq.id !== id));
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Failed to delete FAQ');
    }
  };

  const moveFAQ = async (index: number, direction: 'up' | 'down') => {
    const newFaqs = [...faqs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newFaqs.length) return;

    [newFaqs[index], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[index]];

    newFaqs.forEach((faq, idx) => {
      faq.order = idx + 1;
    });

    setFaqs(newFaqs);

    const faqsData: any = {};
    newFaqs.forEach(faq => {
      faqsData[faq.id] = faq;
    });
    await set(ref(db, 'faqs'), faqsData);
  };

  const startEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({ question: faq.question, answer: faq.answer, isVisible: faq.isVisible });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingFaq(null);
    setFormData({ question: '', answer: '', isVisible: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">FAQ Management</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h4 className="font-medium text-gray-900">
            {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question
            </label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter question"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter answer"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVisible}
                onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Visible on website</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveFAQ}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Save className="w-4 h-4" />
              Save FAQ
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 divide-y">
        {faqs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No FAQs yet. Click "Add FAQ" to create your first one.
          </div>
        ) : (
          faqs.map((faq, index) => (
            <div key={faq.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-2">
                  <button
                    onClick={() => moveFAQ(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveFAQ(index, 'down')}
                    disabled={index === faqs.length - 1}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-sm text-gray-600">{faq.answer}</p>
                      {!faq.isVisible && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          Hidden
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(faq)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFAQ(faq.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

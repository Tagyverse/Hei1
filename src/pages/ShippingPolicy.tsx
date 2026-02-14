import { ArrowLeft } from 'lucide-react';

interface ShippingPolicyProps {
  onBack: () => void;
}

export default function ShippingPolicy({ onBack }: ShippingPolicyProps) {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Shipping Policy</h1>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p className="text-lg leading-relaxed">
              Thank you for shopping with us! We take great care in packing and delivering your handmade floral headbands, clips, and accessories. Please read our shipping policy below.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Time</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All products are handmade and require time to prepare.</li>
                <li>Orders are processed within 7 to 10 business days.</li>
                <li>During peak seasons or sale days, processing may take a little longer.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping Time</h2>
              <p className="mb-2">Once shipped, orders usually take:</p>
              <p className="font-semibold">3–7 business days within India</p>
              <p className="mt-2">Delivery timelines may vary based on your location and courier service speed.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping Charges</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Shipping charges are calculated at checkout based on your location and order weight.</li>
                <li>Free shipping offers (if any) will be clearly mentioned on the website or product page.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Tracking</h2>
              <p>
                After dispatch, we will provide a tracking number via email/WhatsApp/SMS so you can follow your package.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Incorrect Address</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Please ensure your address, phone number, and pin code are correct.</li>
                <li>We are not responsible for delays or lost packages due to incorrect address details.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delays</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Sometimes courier delays happen due to weather, festivals, or unexpected situations.</li>
                <li>These delays are beyond our control, but we will assist you in tracking your parcel.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Returns / Exchanges / Refunds</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Since all items are custom-made & handmade, we do not accept returns or exchanges.</li>
                <li>Refunds are only applicable if the product is damaged during transit.</li>
                <li>You must inform us within 24 hours of delivery with an unboxing video.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Lost or Damaged Parcels</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>If your parcel is lost or damaged, please contact us with your order details and proof.</li>
                <li>We will coordinate with the courier to resolve the issue.</li>
              </ul>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

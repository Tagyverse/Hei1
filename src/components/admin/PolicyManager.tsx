import { useState, useEffect } from 'react';
import { Save, FileText } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, get, set, update } from 'firebase/database';

interface Policy {
  key: string;
  title: string;
  content: string;
  isEnabled: boolean;
}

export default function PolicyManager() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [saving, setSaving] = useState(false);

  const defaultPolicies: Policy[] = [
    {
      key: 'shipping_policy',
      title: 'Shipping Policy',
      content: `# Shipping Policy

Thank you for shopping with us! We take great care in packing and delivering your handmade floral headbands, clips, and accessories. Please read our shipping policy below.

## Processing Time
- All products are handmade and require time to prepare
- Orders are processed within 7 to 10 business days
- During peak seasons or sale days, processing may take a little longer

## Shipping Time
- Once shipped, orders usually take 3–7 business days within India
- Delivery timelines may vary based on your location and courier service speed

## Shipping Charges
- Shipping charges are calculated at checkout based on your location and order weight
- Free shipping offers (if any) will be clearly mentioned on the website or product page

## Order Tracking
- After dispatch, we will provide a tracking number via email/WhatsApp/SMS so you can follow your package

## Incorrect Address
- Please ensure your address, phone number, and pin code are correct
- We are not responsible for delays or lost packages due to incorrect address details

## Delays
- Sometimes courier delays happen due to weather, festivals, or unexpected situations
- These delays are beyond our control, but we will assist you in tracking your parcel

## Returns / Exchanges / Refunds
- Since all items are custom-made & handmade, we do not accept returns or exchanges
- Refunds are only applicable if the product is damaged during transit
- You must inform us within 24 hours of delivery with an unboxing video

## Lost or Damaged Parcels
- If your parcel is lost or damaged, please contact us with your order details and proof
- We will coordinate with the courier to resolve the issue`,
      isEnabled: true
    },
    {
      key: 'privacy_policy',
      title: 'Privacy Policy',
      content: `# Privacy Policy

At Pixie Blooms, we truly value your trust and are committed to protecting your personal information.

## Information We Collect
When you shop with us, we collect only the essential details:
- Name, phone number, email
- Shipping address
- Order history and preferences

## Payment Security
- Your payment information is never stored or viewed by us
- All transactions are handled securely through trusted payment gateways

## How We Use Your Information
We use your data only to:
- Fulfill your orders
- Improve your experience
- Provide customer support
- Send order updates

## Information Sharing
- We share information only with our delivery partners when required
- We do not sell, rent, or misuse your information under any circumstances

## Cookies
- Our website may use basic cookies to help us understand your preferences
- This helps us offer a better browsing experience

## Data Security
- Your data is always handled with care, confidentiality, and respect
- We implement security measures to protect your information

## Your Rights
By using our website, you agree to this Privacy Policy. You can contact us anytime if you want your information updated or removed.

## Contact Us
For privacy concerns, contact us at pixieblooms2512@gmail.com`,
      isEnabled: true
    },
    {
      key: 'about_us',
      title: 'About Us',
      content: `# About Pixie Blooms

Welcome to Pixie Blooms, where elegance meets craftsmanship.

We specialize in handcrafted floral baby headbands, hair clips, and custom accessories designed to add a magical touch to every little moment.

Pixie Blooms began as a small passion for flower art and has now grown into a brand loved by moms and little ones across India. Every design is made with love, care, and attention to detail, because we believe the sweetest moments deserve something crafted with heart.

## Our Story
I am Moomin, an artist and a mom who loves creating unique floral accessories. What started as a creative hobby slowly transformed into Pixie Blooms when people appreciated my work and requested custom pieces. Today, Pixie Blooms proudly offers soft, comfortable, and long-lasting accessories for babies, toddlers, and girls.

## What Makes Pixie Blooms Special
- **Handmade with love** – Each flower is carefully shaped, painted, and assembled by hand
- **Premium-quality materials** – Skin-friendly, lightweight, and safe for delicate little heads
- **Customization available** – We craft pieces that match your outfits, themes, and special celebrations
- **Made to last** – Beautiful designs perfect for everyday wear and cherished occasions

## Our Mission
To create beautiful, handcrafted floral accessories that make every child feel special, confident, and joyful.

## For Customization
WhatsApp us for custom designs and special requests!`,
      isEnabled: true
    },
    {
      key: 'terms_conditions',
      title: 'Terms & Conditions',
      content: `# Terms & Conditions

By using the Pixie Blooms website and placing an order, you agree to our terms and conditions.

## Product Information
- All our products are handmade
- Slight variations in colour, size, or design may occur
- Product photos are for reference only

## Orders
- Once an order is placed and processing has started, it cannot be cancelled
- This especially applies to customised items
- Prices shown may change anytime, but the amount at checkout is final

## Payments
- All payments are processed securely through trusted gateways
- We do not store or access any of your payment details

## Shipping
- We ship across India through reliable couriers
- Delivery delays due to courier issues, weather, or incorrect addresses are beyond our control

## Returns & Refunds
- We do not accept returns or exchanges unless the product is damaged on arrival
- Issues must be reported within 24 hours with clear photo and video proof

## Intellectual Property
- All designs, photos, and content belong to Pixie Blooms
- Cannot be copied or reused without permission

## Contact
For any queries, contact us at pixieblooms2512@gmail.com

By continuing to use our website, you agree to follow these terms.`,
      isEnabled: true
    }
  ];

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const policiesRef = ref(db, 'policies');
      const snapshot = await get(policiesRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const policiesArray = Object.keys(data).map(key => ({
          ...data[key],
          key
        }));
        setPolicies(policiesArray);
      } else {
        const policiesData: any = {};
        defaultPolicies.forEach(policy => {
          policiesData[policy.key] = {
            title: policy.title,
            content: policy.content,
            isEnabled: policy.isEnabled
          };
        });
        await set(policiesRef, policiesData);
        setPolicies(defaultPolicies);
      }
    } catch (error) {
      console.error('Error loading policies:', error);
      setPolicies(defaultPolicies);
    }
  };

  const savePolicies = async () => {
    setSaving(true);
    try {
      const policiesData: any = {};
      policies.forEach(policy => {
        policiesData[policy.key] = {
          title: policy.title,
          content: policy.content,
          isEnabled: policy.isEnabled
        };
      });

      await update(ref(db, 'policies'), policiesData);
      alert('Policies saved successfully!');
    } catch (error) {
      console.error('Error saving policies:', error);
      alert('Failed to save policies');
    } finally {
      setSaving(false);
    }
  };

  const updatePolicy = (key: string, updates: Partial<Policy>) => {
    setPolicies(policies.map(policy =>
      policy.key === key ? { ...policy, ...updates } : policy
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Policy Management</h3>
        <button
          onClick={savePolicies}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Policies'}
        </button>
      </div>

      <div className="space-y-6">
        {policies.map((policy) => (
          <div key={policy.key} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-teal-600" />
                <input
                  type="text"
                  value={policy.title}
                  onChange={(e) => updatePolicy(policy.key, { title: e.target.value })}
                  className="text-lg font-semibold text-gray-900 border-b-2 border-transparent hover:border-gray-300 focus:border-teal-500 outline-none transition-colors"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.isEnabled}
                  onChange={(e) => updatePolicy(policy.key, { isEnabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">Show on website</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content (Markdown supported)
              </label>
              <textarea
                value={policy.content}
                onChange={(e) => updatePolicy(policy.key, { content: e.target.value })}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter policy content..."
              />
              <p className="mt-2 text-xs text-gray-500">
                Use # for headings, ## for subheadings, - for bullet points
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Usage Information</h4>
        <p className="text-sm text-blue-800">
          These policies will appear as bottom sheets when users click on the policy links in the footer.
          Use markdown formatting for better readability. Make sure to save after making changes.
        </p>
      </div>
    </div>
  );
}

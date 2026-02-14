import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Loader, Truck, Tag, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { db } from '../lib/firebase';
import { ref, push, update, get, query, orderByChild, equalTo, set } from 'firebase/database';
import PaymentSuccessDialog from '../components/PaymentSuccessDialog';
import PaymentFailedDialog from '../components/PaymentFailedDialog';
import PaymentCancelledDialog from '../components/PaymentCancelledDialog';
import LazyImage from '../components/LazyImage';
import type { Coupon } from '../types';

interface CheckoutProps {
  onBack: () => void;
  onLoginClick: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout({ onBack, onLoginClick }: CheckoutProps) {
  const { items, subtotal, shippingCharge, taxAmount, total, clearCart, getItemPrice, taxSettings } = useCart();
  const { user } = useAuth();
  const { data: publishedData } = usePublishedData();
  const siteSettings = publishedData?.site_settings ? Object.values(publishedData.site_settings)[0] : null;
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [dispatchDetails, setDispatchDetails] = useState('');
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    totalAmount: number;
    customerName: string;
    paymentId: string;
  } | undefined>();
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const savedData = localStorage.getItem('checkoutFormData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData({
        name: user?.displayName || parsed.name || '',
        email: user?.email || parsed.email || '',
        phone: parsed.phone || '',
        address: parsed.address || '',
        city: parsed.city || '',
        state: parsed.state || '',
        pincode: parsed.pincode || ''
      });
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('checkoutFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
  }, [showSuccess]);

  useEffect(() => {
    const fetchDispatchDetails = async () => {
      try {
        const settingsRef = ref(db, 'site_settings');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const settingsId = Object.keys(data)[0];
          if (data[settingsId]?.dispatch_details) {
            setDispatchDetails(data[settingsId].dispatch_details);
          }
        }
      } catch (error) {
        console.error('Error fetching dispatch details:', error);
      }
    };
    fetchDispatchDetails();
  }, []);

  useEffect(() => {
    if (appliedCoupon) {
      calculateDiscount();
    }
  }, [appliedCoupon, subtotal]);

  const calculateDiscount = () => {
    if (!appliedCoupon) {
      setDiscount(0);
      return;
    }

    let calculatedDiscount = 0;
    if (appliedCoupon.discount_type === 'percentage') {
      calculatedDiscount = (subtotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount && calculatedDiscount > appliedCoupon.max_discount) {
        calculatedDiscount = appliedCoupon.max_discount;
      }
    } else {
      calculatedDiscount = appliedCoupon.discount_value;
    }

    setDiscount(Math.min(calculatedDiscount, subtotal));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const couponsRef = ref(db, 'coupons');
      const snapshot = await get(couponsRef);

      if (!snapshot.exists()) {
        setCouponError('Invalid coupon code');
        setCouponLoading(false);
        return;
      }

      const coupons = snapshot.val();
      const couponEntry = Object.entries(coupons).find(
        ([_, coupon]: [string, any]) =>
          coupon.code.toUpperCase() === couponCode.toUpperCase().trim()
      );

      if (!couponEntry) {
        setCouponError('Invalid coupon code');
        setCouponLoading(false);
        return;
      }

      const [couponId, couponData] = couponEntry;
      const coupon = { id: couponId, ...couponData } as Coupon;

      if (!coupon.is_active) {
        setCouponError('This coupon is no longer active');
        setCouponLoading(false);
        return;
      }

      if (coupon.valid_from) {
        const validFrom = new Date(coupon.valid_from);
        if (new Date() < validFrom) {
          setCouponError('This coupon is not yet valid');
          setCouponLoading(false);
          return;
        }
      }

      if (coupon.valid_until) {
        const validUntil = new Date(coupon.valid_until);
        if (new Date() > validUntil) {
          setCouponError('This coupon has expired');
          setCouponLoading(false);
          return;
        }
      }

      if (coupon.usage_limit && coupon.usage_count && coupon.usage_count >= coupon.usage_limit) {
        setCouponError('This coupon has reached its usage limit');
        setCouponLoading(false);
        return;
      }

      if (coupon.min_purchase && subtotal < coupon.min_purchase) {
        setCouponError(`Minimum purchase of ₹${coupon.min_purchase} required`);
        setCouponLoading(false);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponError('');
      setCouponLoading(false);
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Failed to apply coupon');
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setDiscount(0);
    setCouponError('');
  };

  const finalTotal = total - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const shippingAddress = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      };

      const orderItems = items.map(item => {
        const itemPrice = getItemPrice(item);
        return {
          product_id: item.id,
          product_name: item.name,
          product_price: itemPrice,
          quantity: item.quantity,
          subtotal: itemPrice * item.quantity,
          selected_size: item.selectedSize || null,
          selected_color: item.selectedColor || null,
          product_image: item.image_url || null
        };
      });

      const orderData = {
        user_id: user?.uid || null,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: shippingAddress,
        total_amount: finalTotal,
        subtotal: subtotal,
        shipping_charge: shippingCharge,
        tax_amount: taxAmount,
        tax_percentage: taxSettings?.tax_percentage || 0,
        tax_label: taxSettings?.tax_label || null,
        gst_number: taxSettings?.gst_number || null,
        discount: discount,
        coupon_code: appliedCoupon?.code || null,
        coupon_discount_type: appliedCoupon?.discount_type || null,
        coupon_discount_value: appliedCoupon?.discount_value || null,
        payment_status: 'pending',
        order_status: 'pending',
        created_at: new Date().toISOString(),
        order_items: orderItems,
        dispatch_details: ''
      };

      // Generate Amazon-style alphanumeric order ID with brand name
      const generateOrderId = () => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        // Get brand name from site settings or use default
        const brandName = siteSettings?.site_name?.toUpperCase().replace(/\s+/g, '') || 'PIXIEBLOOMS';
        return `${brandName}-${timestamp}-${random}`;
      };

      const orderId = generateOrderId();
      const orderData_withId = { ...orderData, id: orderId };

      // Save order with custom alphanumeric ID as Firebase key
      const ordersRef = ref(db, `orders/${orderId}`);
      await set(ordersRef, orderData_withId);

      const apiUrl = '/api/create-payment-session';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: finalTotal,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment session error:', errorText);
        throw new Error(`Failed to create payment session: ${errorText}`);
      }

      const paymentData = await response.json();

      const { order_id: razorpayOrderId, amount, currency, key_id } = paymentData;

      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: 'Pixie Blooms',
        description: 'Hair Accessories Order',
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          setLoading(true);

          try {
            const verifyUrl = '/api/verify-payment';

            const verifyResponse = await fetch(verifyUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              })
            });

            let verifyData;
            try {
              verifyData = await verifyResponse.json();
            } catch (jsonError) {
              console.error('[CHECKOUT] Failed to parse verify response:', jsonError);
              throw new Error('Invalid verification response from server');
            }

            if (verifyResponse.ok && verifyData.verified) {
              try {
                const orderRef = ref(db, `orders/${orderId}`);
                await update(orderRef, {
                  payment_status: 'completed',
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  order_status: 'processing',
                  updatedAt: new Date().toISOString()
                });

                if (appliedCoupon) {
                  const couponRef = ref(db, `coupons/${appliedCoupon.id}`);
                  const couponSnapshot = await get(couponRef);
                  if (couponSnapshot.exists()) {
                    const currentUsageCount = couponSnapshot.val().usage_count || 0;
                    await update(couponRef, {
                      usage_count: currentUsageCount + 1
                    });
                  }
                }
              } catch (firebaseError) {
                console.error('[CHECKOUT] Firebase update error:', firebaseError);
                throw firebaseError;
              }

              const details = {
                orderId: orderId || '',
                totalAmount: finalTotal,
                customerName: formData.name,
                paymentId: response.razorpay_payment_id
              };

              setOrderDetails(details);
              setLoading(false);
              setShowSuccess(true);
            } else {
              console.error('[CHECKOUT] Verification failed:', {
                status: verifyResponse.status,
                statusText: verifyResponse.statusText,
                data: verifyData
              });

              const orderRef = ref(db, `orders/${orderId}`);
              await update(orderRef, {
                payment_status: 'verification_failed',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                verification_error: verifyData.error || 'Unknown error',
                updatedAt: new Date().toISOString()
              });

              let errorMessage = verifyData.error || 'Payment verification failed.';
              if (verifyData.debug) {
                errorMessage += ` (${verifyData.debug})`;
              }
              errorMessage += ' Your payment ID is ' + response.razorpay_payment_id + '. Please contact support.';

              setPaymentError(errorMessage);
              setShowFailed(true);
            }
          } catch (error) {
            console.error('[CHECKOUT] Exception during verification:', error);

            const orderRef = ref(db, `orders/${orderId}`);
            await update(orderRef, {
              payment_status: 'verification_error',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              verification_error: error instanceof Error ? error.message : 'Unknown error',
              updatedAt: new Date().toISOString()
            });

            setPaymentError(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}. Your payment ID is ${response.razorpay_payment_id}. Please contact support.`);
            setShowFailed(true);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#14b8a6'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setShowCancelled(true);
          }
        }
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response);
        const errorMsg = response.error?.description || 'Payment was declined. Please try again with a different payment method.';
        setPaymentError(errorMsg);
        setShowFailed(true);
        setLoading(false);
      });

      razorpay.open();
      setLoading(false);
    } catch (error: any) {
      console.error('Error processing order:', error);
      setLoading(false);
    }
  };

  const handleCloseSuccess = async () => {
    await clearCart();
    localStorage.removeItem('checkoutFormData');
    setShowSuccess(false);
    onBack();
  };

  const handleCloseFailed = () => {
    setShowFailed(false);
  };

  const handleRetryPayment = () => {
    setShowFailed(false);
    setPaymentError('');
  };

  const handleCloseCancelled = () => {
    setShowCancelled(false);
  };

  const handleRetryAfterCancel = () => {
    setShowCancelled(false);
    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.click();
    }
  };

  if (!user && !showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-mint-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 border-2 border-teal-200 text-center max-w-md">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to continue with checkout</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onBack}
              className="flex-1 bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors border-2 border-gray-300"
            >
              Go Back
            </button>
            <button
              onClick={onLoginClick}
              className="flex-1 bg-teal-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600"
            >
              Login Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-mint-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some products to checkout</p>
          <button
            onClick={onBack}
            className="bg-teal-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PaymentSuccessDialog
        isOpen={showSuccess}
        onClose={handleCloseSuccess}
        orderDetails={orderDetails}
      />

      <PaymentFailedDialog
        isOpen={showFailed}
        onClose={handleCloseFailed}
        onRetry={handleRetryPayment}
        errorMessage={paymentError}
      />

      <PaymentCancelledDialog
        isOpen={showCancelled}
        onClose={handleCloseCancelled}
        onRetry={handleRetryAfterCancel}
      />

      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-mint-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 font-semibold mb-8 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Shop
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border-2 border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Shipping Details</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!!user?.email}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {dispatchDetails && (
                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Dispatch Information</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{dispatchDetails}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-600 transition-colors border-2 border-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 h-fit">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.cart_item_id} className="flex gap-4 pb-4 border-b border-gray-200">
                  <LazyImage
                    src={item.image_url}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    {(item.selectedSize || item.selectedColor) && (
                      <div className="flex gap-2 mt-1">
                        {item.selectedSize && (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
                            {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
                            {item.selectedColor}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ₹{(getItemPrice(item) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-900">Have a Coupon?</h3>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border-2 border-green-300">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-bold text-green-700">{appliedCoupon.code}</p>
                      {appliedCoupon.description && (
                        <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponError('');
                    }}
                    placeholder="Enter coupon code"
                    className="flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase transition-all"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {couponLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-spin">⟳</span>
                        Applying...
                      </span>
                    ) : (
                      'Apply'
                    )}
                  </button>
                </div>
              )}

              {couponError && (
                <p className="mt-2 text-sm text-red-600 font-medium">{couponError}</p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span className={`font-semibold ${shippingCharge === 0 && subtotal >= 2000 ? 'text-green-600' : ''}`}>
                  {shippingCharge === 0 && subtotal >= 2000 ? (
                    <span className="flex items-center gap-1">
                      FREE <span className="text-xs">🎉</span>
                    </span>
                  ) : (
                    `₹${shippingCharge.toFixed(2)}`
                  )}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span className="font-semibold">Discount</span>
                  <span className="font-bold">-₹{discount.toFixed(2)}</span>
                </div>
              )}
              {taxSettings?.is_enabled && !taxSettings?.include_in_price && taxAmount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>{taxSettings.tax_label} ({taxSettings.tax_percentage}%)</span>
                  <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
                </div>
              )}
              {taxSettings?.is_enabled && taxSettings?.include_in_price && items.length > 0 && (
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Inclusive of {taxSettings.tax_label} ({taxSettings.tax_percentage}%)</span>
                  <span className="font-semibold">₹{(subtotal - (subtotal / (1 + taxSettings.tax_percentage / 100))).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-teal-200 pt-3 flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span className="text-teal-600">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {subtotal >= 2000 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl border-2 border-green-300">
                <p className="text-sm font-bold text-green-700 text-center">
                  You're getting FREE shipping on this order!
                </p>
              </div>
            )}

            <div className="bg-teal-50 rounded-2xl p-4 border-2 border-teal-200">
              <p className="text-sm text-gray-700">
                <span className="font-bold">Payment Method:</span> Razorpay Payment Gateway
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Secure payment processing via Razorpay
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

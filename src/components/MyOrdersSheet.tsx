import { useState, useEffect } from 'react';
import { X, Package, CheckCircle, Clock, Truck, Loader, Download, Printer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import { downloadBillAsPDF, downloadBillAsJPG, printBill, fetchDeliveryCharge } from '../utils/billGenerator';
import { trackBillDownload } from '../utils/analytics';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  total_amount: number;
  payment_status: string;
  payment_id: string;
  order_status: string;
  created_at: string;
  order_items: OrderItem[];
  user_id: string;
  dispatch_details?: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  selected_size?: string | null;
  selected_color?: string | null;
  product_image?: string | null;
}

interface MyOrdersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

export default function MyOrdersSheet({ isOpen, onClose, onLoginClick }: MyOrdersSheetProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingJPG, setDownloadingJPG] = useState(false);
  const [billSettings, setBillSettings] = useState<any>(null);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);

  useEffect(() => {
    if (isOpen && user) {
      fetchOrders();
      loadBillSettings();
      loadDeliveryCharge();
    }
  }, [isOpen, user]);

  const loadBillSettings = () => {
    try {
      const saved = localStorage.getItem('billSettings');
      if (saved) {
        setBillSettings(JSON.parse(saved));
      } else {
        // Set to null so billGenerator uses its default settings
        // But we need to ensure images show - explicitly enable them
        setBillSettings({ show_product_images: true });
      }
    } catch (error) {
      console.error('Error loading bill settings:', error);
      // On error, use minimal settings that enable images
      setBillSettings({ show_product_images: true });
    }
  };

  const loadDeliveryCharge = async () => {
    try {
      const charge = await fetchDeliveryCharge(db);
      setDeliveryCharge(charge);
      console.log('[v0] Delivery charge loaded:', charge);
    } catch (error) {
      console.warn('[v0] Could not load delivery charge:', error);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const ordersRef = ref(db, 'orders');
      const ordersSnapshot = await get(ordersRef);

      const ordersData: Order[] = [];
      if (ordersSnapshot.exists()) {
        const data = ordersSnapshot.val();
        Object.keys(data).forEach(key => {
          // The key itself is now the custom alphanumeric order ID
          if (data[key].user_id === user.uid && data[key].payment_status === 'completed') {
            ordersData.push({ id: key, ...data[key] });
          }
        });
        ordersData.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
      }
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'in_transit':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'in_transit':
        return 'bg-amber-100 text-amber-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'In Transit';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedOrder) return;
    setDownloadingPDF(true);
    try {
      await downloadBillAsPDF(selectedOrder, { site_name: 'Hei', contact_email: '', contact_phone: '' }, deliveryCharge, billSettings);
      // Track download (fire and forget - don't block UI)
      trackBillDownload(selectedOrder.id, 'pdf');
    } catch (error) {
      console.error('[v0] Error downloading PDF:', error);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadJPG = async () => {
    if (!selectedOrder) return;
    setDownloadingJPG(true);
    try {
      await downloadBillAsJPG(selectedOrder, { site_name: 'Hei', contact_email: '', contact_phone: '' }, deliveryCharge, billSettings);
      // Track download (fire and forget - don't block UI)
      trackBillDownload(selectedOrder.id, 'jpg');
    } catch (error) {
      console.error('[v0] Error downloading JPG:', error);
    } finally {
      setDownloadingJPG(false);
    }
  };

  const handlePrint = () => {
    if (!selectedOrder) return;
    printBill(selectedOrder, { site_name: 'Hei', contact_email: '', contact_phone: '' }, deliveryCharge, billSettings);
    // Track download (fire and forget - don't block UI)
    trackBillDownload(selectedOrder.id, 'print');
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-50 transition-opacity" onClick={onClose}></div>
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
          <div className="p-6 text-center">
            <div className="flex justify-end mb-4">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please log in to view your orders</p>
            <button
              onClick={() => {
                onClose();
                onLoginClick();
              }}
              className="bg-teal-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 transition-opacity" onClick={onClose}></div>
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
                <p className="text-sm text-gray-600">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600 text-sm mb-6">Start shopping to see your orders here</p>
              <button
                onClick={onClose}
                className="bg-teal-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-teal-600 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : selectedOrder ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-teal-600 font-semibold text-sm hover:text-teal-700 mb-2"
              >
                ← Back to Orders
              </button>

              <div className="bg-gradient-to-br from-teal-50 to-mint-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Order ID</p>
                    <p className="text-lg font-bold text-gray-900">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedOrder.order_status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.order_status)}`}>
                      {getStatusText(selectedOrder.order_status)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(selectedOrder.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-teal-600" />
                  Order Items
                </h4>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item, index) => (
                    <div key={index} className="bg-white rounded-xl p-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{item.product_name}</p>
                          {(item.selected_size || item.selected_color) && (
                            <div className="flex gap-2 mt-1">
                              {item.selected_size && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                  Size: {item.selected_size}
                                </span>
                              )}
                              {item.selected_color && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                  Color: {item.selected_color}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="font-bold text-teal-600 ml-2">₹{Number(item.subtotal).toFixed(2)}</p>
                      </div>
                      <p className="text-xs text-gray-600">Qty: {item.quantity} × ₹{Number(item.product_price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-bold text-gray-900 mb-3 text-sm">Shipping Address</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>{selectedOrder.shipping_address.address}</p>
                  <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                  <p>PIN: {selectedOrder.shipping_address.pincode}</p>
                </div>
              </div>

              {selectedOrder.dispatch_details && selectedOrder.dispatch_details.trim() !== '' && (
                <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
                  <h4 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    Dispatch Details
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedOrder.dispatch_details}</p>
                </div>
              )}

              <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-4 text-white">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">Total Amount</p>
                  <p className="text-2xl font-bold">₹{Number(selectedOrder.total_amount).toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Download or Print Bill</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl transition-colors font-semibold text-sm sm:text-base"
                  >
                    {downloadingPDF ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  <button
                    onClick={handleDownloadJPG}
                    disabled={downloadingJPG}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl transition-colors font-semibold text-sm sm:text-base"
                  >
                    {downloadingJPG ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">JPG</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-colors font-semibold text-sm sm:text-base"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(order.order_status)}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(order.order_status)}`}>
                          {getStatusText(order.order_status)}
                        </span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-teal-600">₹{Number(order.total_amount).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <p>{order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}</p>
                    <p>
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

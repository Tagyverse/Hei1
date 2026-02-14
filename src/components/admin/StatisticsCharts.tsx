import { useMemo } from 'react';
import { TrendingUp, ShoppingBag, Package, Truck, CheckCircle, Calendar, IndianRupee } from 'lucide-react';

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
}

interface StatisticsChartsProps {
  orders: Order[];
}

export default function StatisticsCharts({ orders }: StatisticsChartsProps) {
  const stats = useMemo(() => {
    const today = new Date();
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedOrders = orders.filter(o => o.payment_status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    const ordersLast30Days = orders.filter(o => new Date(o.created_at) >= last30Days);
    const revenueLast30Days = ordersLast30Days
      .filter(o => o.payment_status === 'completed')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    const ordersLast7Days = orders.filter(o => new Date(o.created_at) >= last7Days);
    const revenueLast7Days = ordersLast7Days
      .filter(o => o.payment_status === 'completed')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    const statusCounts = {
      pending: orders.filter(o => o.order_status === 'pending').length,
      processing: orders.filter(o => o.order_status === 'processing').length,
      in_transit: orders.filter(o => o.order_status === 'in_transit').length,
      completed: orders.filter(o => o.order_status === 'completed').length,
    };

    const dailyRevenue: { [key: string]: number } = {};
    const dailyOrders: { [key: string]: number } = {};

    ordersLast30Days.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('en-IN');
      dailyOrders[date] = (dailyOrders[date] || 0) + 1;
      if (order.payment_status === 'completed') {
        dailyRevenue[date] = (dailyRevenue[date] || 0) + Number(order.total_amount);
      }
    });

    const sortedDates = Object.keys(dailyOrders).sort((a, b) =>
      new Date(a.split('/').reverse().join('-')).getTime() -
      new Date(b.split('/').reverse().join('-')).getTime()
    );

    const productSales: { [key: string]: { count: number; revenue: number } } = {};
    completedOrders.forEach(order => {
      order.order_items.forEach(item => {
        if (!productSales[item.product_name]) {
          productSales[item.product_name] = { count: 0, revenue: 0 };
        }
        productSales[item.product_name].count += item.quantity;
        productSales[item.product_name].revenue += Number(item.subtotal);
      });
    });

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);

    const avgOrderValue = completedOrders.length > 0
      ? totalRevenue / completedOrders.length
      : 0;

    return {
      totalRevenue,
      revenueLast30Days,
      revenueLast7Days,
      statusCounts,
      dailyRevenue,
      dailyOrders,
      sortedDates,
      topProducts,
      avgOrderValue,
      completedOrdersCount: completedOrders.length,
    };
  }, [orders]);

  const maxDailyRevenue = Math.max(...Object.values(stats.dailyRevenue), 1);
  const maxDailyOrders = Math.max(...Object.values(stats.dailyOrders), 1);

  const statusColors = {
    pending: { bg: 'bg-amber-500', text: 'text-amber-500' },
    processing: { bg: 'bg-blue-500', text: 'text-blue-500' },
    in_transit: { bg: 'bg-purple-500', text: 'text-purple-500' },
    completed: { bg: 'bg-green-500', text: 'text-green-500' },
  };

  const totalOrders = Object.values(stats.statusCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">₹{stats.totalRevenue.toFixed(2)}</p>
          <p className="text-xs opacity-80 mt-2">From {stats.completedOrdersCount} completed orders</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Last 30 Days</p>
          <p className="text-3xl font-bold">₹{stats.revenueLast30Days.toFixed(2)}</p>
          <p className="text-xs opacity-80 mt-2">{orders.filter(o => new Date(o.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} orders</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Last 7 Days</p>
          <p className="text-3xl font-bold">₹{stats.revenueLast7Days.toFixed(2)}</p>
          <p className="text-xs opacity-80 mt-2">{orders.filter(o => new Date(o.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} orders</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Avg Order Value</p>
          <p className="text-3xl font-bold">₹{stats.avgOrderValue.toFixed(2)}</p>
          <p className="text-xs opacity-80 mt-2">Per completed order</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-teal-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            Revenue Trend (Last 30 Days)
          </h3>
          {stats.sortedDates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No data available
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-64 flex items-end gap-1 bg-gradient-to-b from-gray-50 to-white rounded-lg p-4 border border-gray-100">
                {stats.sortedDates.slice(-15).map((date) => {
                  const revenue = stats.dailyRevenue[date] || 0;
                  const height = (revenue / maxDailyRevenue) * 100;
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full flex items-end justify-center h-full">
                        <div
                          className="w-full rounded-t-lg transition-all duration-300 shadow-sm"
                          style={{
                            height: `${height}%`,
                            minHeight: revenue > 0 ? '8px' : '0px',
                            background: revenue > 0 ? 'linear-gradient(to top, #14b8a6, #2dd4bf)' : 'transparent'
                          }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity z-10">
                            ₹{revenue.toFixed(0)}
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                        {date.split('/').slice(0, 2).join('/')}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-2 pt-4 border-t-2 border-gray-100">
                <div className="w-3 h-3 bg-teal-500 rounded"></div>
                <span className="text-xs text-gray-600">Daily Revenue</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            Order Status Distribution
          </h3>
          {totalOrders === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No orders yet
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {(() => {
                      let currentAngle = 0;
                      return Object.entries(stats.statusCounts).map(([status, count]) => {
                        const percentage = (count / totalOrders) * 100;
                        const angle = (percentage / 100) * 360;
                        const startAngle = currentAngle;
                        currentAngle += angle;

                        const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                        const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                        const endX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                        const endY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                        const largeArc = angle > 180 ? 1 : 0;

                        const colors = {
                          pending: '#f59e0b',
                          processing: '#3b82f6',
                          in_transit: '#a855f7',
                          completed: '#22c55e',
                        };

                        return (
                          <path
                            key={status}
                            d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                            fill={colors[status as keyof typeof colors]}
                            className="hover:opacity-80 transition-opacity"
                          />
                        );
                      });
                    })()}
                    <circle cx="50" cy="50" r="20" fill="white" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(stats.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                    <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors].bg}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-500">
                      {((count / totalOrders) * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {stats.topProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            Top 5 Products by Revenue
          </h3>
          <div className="space-y-3">
            {stats.topProducts.map(([productName, data], index) => {
              const maxRevenue = stats.topProducts[0][1].revenue;
              const percentage = (data.revenue / maxRevenue) * 100;
              return (
                <div key={productName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{productName}</p>
                        <p className="text-xs text-gray-600">{data.count} units sold</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-purple-600 ml-4">₹{data.revenue.toFixed(2)}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats.sortedDates.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-green-600" />
            </div>
            Daily Orders (Last 30 Days)
          </h3>
          <div className="space-y-2">
            <div className="h-48 flex items-end gap-1 bg-gradient-to-b from-gray-50 to-white rounded-lg p-4 border border-gray-100">
              {stats.sortedDates.slice(-15).map((date) => {
                const orderCount = stats.dailyOrders[date] || 0;
                const height = (orderCount / maxDailyOrders) * 100;
                return (
                  <div key={date} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full flex items-end justify-center h-full">
                      <div
                        className="w-full rounded-t-lg transition-all duration-300 shadow-sm"
                        style={{
                          height: `${height}%`,
                          minHeight: orderCount > 0 ? '8px' : '0px',
                          background: orderCount > 0 ? 'linear-gradient(to top, #22c55e, #4ade80)' : 'transparent'
                        }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity z-10">
                          {orderCount} orders
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                      {date.split('/').slice(0, 2).join('/')}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-2 pt-4 border-t-2 border-gray-100">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">Orders Per Day</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

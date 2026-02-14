import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface OrderItem {
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  selected_size?: string | null;
  selected_color?: string | null;
  product_image?: string | null;
}

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
  subtotal?: number;
  shipping_charge?: number;
  tax_amount?: number;
  payment_status: string;
  payment_id: string;
  order_status: string;
  created_at: string;
  order_items: OrderItem[];
  dispatch_details?: string;
}

interface SiteSettings {
  site_name: string;
  contact_email: string;
  contact_phone: string;
}

interface BillSettings {
  logo_url?: string;
  company_name?: string;
  company_tagline?: string;
  company_address?: string;
  company_email?: string;
  company_phone?: string;
  company_gst?: string;
  theme?: 'professional' | 'modern' | 'classic' | 'minimal';
  layout_style?: 'modern' | 'classic' | 'minimal' | 'detailed';
  show_product_images?: boolean;
  show_shipping_label?: boolean;
  show_cut_line?: boolean;
  primary_color?: string;
  secondary_color?: string;
  header_bg_color?: string;
  table_header_color?: string;
  font_family?: string;
  header_font_size?: number;
  body_font_size?: number;
  footer_text?: string;
  thank_you_message?: string;
  from_name?: string;
  from_address?: string;
  from_city?: string;
  from_state?: string;
  from_pincode?: string;
  from_phone?: string;
  free_delivery_minimum_amount?: number;
  show_free_delivery_badge?: boolean;
}

// Preset themes for bill design
export const BILL_THEMES = {
  professional: {
    primary_color: '#1a1a1a',
    secondary_color: '#666666',
    header_bg_color: '#1a1a1a',
    table_header_color: '#1a1a1a',
    font_family: 'Arial, sans-serif',
    header_font_size: 32,
    body_font_size: 12,
  },
  modern: {
    primary_color: '#2563eb',
    secondary_color: '#64748b',
    header_bg_color: '#2563eb',
    table_header_color: '#2563eb',
    font_family: 'Segoe UI, Tahoma, sans-serif',
    header_font_size: 36,
    body_font_size: 13,
  },
  classic: {
    primary_color: '#c41e3a',
    secondary_color: '#333333',
    header_bg_color: '#c41e3a',
    table_header_color: '#c41e3a',
    font_family: 'Georgia, serif',
    header_font_size: 34,
    body_font_size: 12,
  },
  minimal: {
    primary_color: '#000000',
    secondary_color: '#777777',
    header_bg_color: '#ffffff',
    table_header_color: '#f0f0f0',
    font_family: 'Helvetica, Arial, sans-serif',
    header_font_size: 28,
    body_font_size: 11,
  },
};

const defaultBillSettings: BillSettings = {
  logo_url: '',
  company_name: 'Hei',
  company_tagline: 'Quality Fashion & Accessories',
  company_address: 'Atchukattu Street, Thiruppathur',
  company_email: 'support@hei.com',
  company_phone: '+91 9876543210',
  company_gst: '',
  theme: 'professional',
  layout_style: 'modern',
  show_product_images: true,
  show_shipping_label: true,
  show_cut_line: false,
  ...BILL_THEMES.professional,
  footer_text: 'Thank you for your order!',
  thank_you_message: 'We appreciate your business.',
  from_name: 'Hei',
  from_address: 'Atchukattu Street',
  from_city: 'Thiruppathur',
  from_state: 'Tamil Nadu',
  from_pincode: '635601',
  from_phone: '+91 9876543210',
  free_delivery_minimum_amount: 0,
  show_free_delivery_badge: false,
};

export function generateBillHTML(order: Order, siteSettings: SiteSettings, shippingCharge: number = 0, customSettings?: BillSettings): string {
  const s = { ...defaultBillSettings, ...customSettings };
  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subtotal = order.order_items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const total = subtotal + shippingCharge;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 16px;
      background: #f5f5f5;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: ${s.body_font_size}px;
      color: ${s.secondary_color};
      margin-bottom: 8px;
      font-weight: 600;
    }

    .order-date {
      font-size: ${s.body_font_size}px;
      color: #888888;
      margin-bottom: 10px;
    }

    .company-info {
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }

    .company-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }

    .company-name {
      font-size: ${s.header_font_size}px;
      font-weight: bold;
      color: ${s.primary_color};
      margin-bottom: 5px;
    }

    .company-tagline {
      font-size: ${s.body_font_size}px;
      color: ${s.secondary_color};
      margin-bottom: 5px;
    }

    .company-details {
      font-size: ${s.body_font_size - 1}px;
      color: ${s.secondary_color};
      line-height: 1.5;
    }

    .invoice-title {
      text-align: left;
    }

    @media screen and (min-width: 768px) {
      .invoice-title {
        text-align: right;
      }
    }

    .invoice-title h1 {
      font-size: 28px;
      color: ${s.primary_color};
      margin-bottom: 5px;
    }

    .invoice-number {
      font-size: ${s.body_font_size}px;
      color: ${s.secondary_color};
      margin-bottom: 5px;
    }

    .order-date {
      font-size: ${s.body_font_size}px;
      color: #666666;
      margin-top: 5px;
    }

    .item-details {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      width: 100%;
    }

    .product-image {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      background: #f9f9f9;
      display: block;
      flex-shrink: 0;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      font-size: ${s.body_font_size}px;
    }

    .items-table thead {
      background: ${s.table_header_color};
      color: white;
    }

    .items-table th {
      padding: 14px 10px;
      text-align: left;
      font-size: ${s.body_font_size}px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: none;
    }

    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
    }

    .items-table tbody tr {
      border-bottom: 1px solid #e8e8e8;
      transition: background 0.2s ease;
    }

    .items-table tbody tr:last-child {
      border-bottom: 2px solid ${s.primary_color};
    }

    .items-table td {
      padding: 14px 10px;
      font-size: ${s.body_font_size}px;
      color: ${s.secondary_color};
      vertical-align: middle;
    }

    .item-details {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .item-info strong {
      font-weight: 700;
      color: ${s.primary_color};
      margin-bottom: 4px;
    }

    .item-info span {
      font-size: ${s.body_font_size - 1}px;
      color: #999;
    }

    .items-table tbody tr:hover {
      background: #f9f9f9;
    }

    .totals {
      margin-left: auto;
      width: 100%;
      max-width: 250px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: ${s.body_font_size}px;
    }

    .total-row.subtotal {
      color: ${s.secondary_color};
      border-bottom: 1px solid #cccccc;
    }

    .total-row.tax {
      color: ${s.secondary_color};
      border-bottom: 1px solid #cccccc;
    }

    .total-row.grand-total {
      background: ${s.primary_color};
      color: white;
      padding: 12px 15px;
      margin-top: 8px;
      border-radius: 0;
      font-size: 16px;
      font-weight: bold;
    }

    .payment-status {
      display: inline-block;
      padding: 4px 10px;
      border: 2px solid ${s.primary_color};
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 5px;
      background: white;
      color: ${s.primary_color};
    }

    .payment-status.completed {
      background: #e5e5e5;
      color: ${s.primary_color};
      border-color: ${s.primary_color};
    }

    .payment-status.pending {
      background: #f5f5f5;
      color: ${s.secondary_color};
      border-color: #666666;
    }

    .payment-status.failed {
      background: #cccccc;
      color: ${s.primary_color};
      border-color: ${s.primary_color};
    }

    .footer {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid ${s.primary_color};
      text-align: center;
      font-size: 10px;
      color: ${s.secondary_color};
    }

    .footer p {
      margin-bottom: 3px;
    }

    .thank-you {
      margin-top: 20px;
      text-align: center;
      font-size: 14px;
      color: ${s.primary_color};
      font-weight: 600;
    }

    .cut-line {
      margin: 20px 0 15px 0;
      border-top: 2px dashed #666666;
      position: relative;
      text-align: center;
    }

    .cut-line::before {
      content: '✂ CUT HERE ✂';
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 0 12px;
      font-size: 10px;
      color: ${s.primary_color};
      font-weight: 700;
      letter-spacing: 1px;
    }

    .shipping-labels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 30px;
    }

    @media screen and (max-width: 768px) {
      .shipping-labels {
        grid-template-columns: 1fr;
      }
    }

    .label-box {
      border: 2px solid ${s.primary_color};
      padding: 20px;
      background: #ffffff;
      border-radius: 4px;
    }

    .label-box h3 {
      font-size: 13px;
      color: ${s.primary_color};
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 15px;
      font-weight: 700;
      border-bottom: 2px solid ${s.primary_color};
      padding-bottom: 10px;
    }

    .label-box p {
      font-size: 12px;
      color: ${s.secondary_color};
      line-height: 1.8;
      margin: 0 0 6px 0;
    }

    .label-box strong {
      color: ${s.primary_color};
      font-weight: 700;
      display: block;
      margin-top: 2px;
    }

    @media screen and (max-width: 768px) {
      .invoice-container {
        padding: 16px 20px;
        border: 2px solid ${s.primary_color};
      }

      .header {
        flex-direction: column;
        gap: 20px;
        padding-bottom: 20px;
        margin-bottom: 25px;
      }

      .company-info {
        width: 100%;
      }

      .company-logo {
        width: 70px;
        height: 70px;
      }

      .company-name {
        font-size: 22px;
      }

      .invoice-title {
        text-align: left;
        width: 100%;
        min-width: auto;
      }

      .invoice-title h1 {
        font-size: 24px;
        margin-bottom: 6px;
      }

      .items-table {
        font-size: 12px;
        margin: 20px 0;
      }

      .items-table th {
        padding: 12px 8px;
        font-size: 11px;
      }

      .items-table td {
        padding: 12px 8px;
        font-size: 12px;
      }

      .product-image {
        width: 50px;
        height: 50px;
      }

      .item-details {
        gap: 10px;
      }

      .item-info strong {
        margin-bottom: 3px;
      }

      .totals {
        max-width: 100%;
        margin-top: 20px;
      }

      .total-row {
        padding: 10px 0;
        font-size: 13px;
      }

      .total-row.grand-total {
        padding: 12px 15px;
        font-size: 15px;
      }

      .thank-you {
        margin-top: 20px;
        font-size: 13px;
      }

      .shipping-labels {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-top: 25px;
      }

      .label-box {
        padding: 16px;
      }

      .label-box h3 {
        font-size: 12px;
        margin-bottom: 12px;
      }

      .label-box p {
        font-size: 11px;
        line-height: 1.7;
        margin: 0 0 5px 0;
      }

      .footer {
        margin-top: 20px;
        padding-top: 15px;
        font-size: 10px;
      }

      .cut-line {
        margin: 20px 0 15px 0;
      }
    }

    @media screen and (max-width: 480px) {
      .invoice-container {
        padding: 12px 16px;
        border: 1px solid ${s.primary_color};
      }

      .header {
        gap: 16px;
        padding-bottom: 16px;
        margin-bottom: 20px;
      }

      .company-logo {
        width: 60px;
        height: 60px;
      }

      .company-name {
        font-size: 18px;
      }

      .company-details {
        font-size: 10px;
      }

      .invoice-title h1 {
        font-size: 20px;
      }

      .invoice-number {
        font-size: 11px;
      }

      .items-table {
        font-size: 10px;
        margin: 15px 0;
      }

      .items-table th {
        padding: 10px 6px;
        font-size: 9px;
        letter-spacing: 0.5px;
      }

      .items-table td {
        padding: 10px 6px;
        font-size: 10px;
      }

      .product-image {
        width: 45px;
        height: 45px;
      }

      .item-details {
        gap: 8px;
      }

      .item-info strong {
        font-size: 10px;
      }

      .item-info span {
        font-size: 9px;
      }

      .totals {
        margin-top: 15px;
      }

      .total-row {
        padding: 8px 0;
        font-size: 11px;
      }

      .total-row.grand-total {
        padding: 10px 12px;
        font-size: 12px;
      }

      .thank-you {
        margin-top: 15px;
        font-size: 11px;
      }

      .shipping-labels {
        gap: 12px;
        margin-top: 18px;
      }

      .label-box {
        padding: 12px;
      }

      .label-box h3 {
        font-size: 11px;
        margin-bottom: 10px;
      }

      .label-box p {
        font-size: 10px;
        line-height: 1.6;
        margin: 0 0 3px 0;
      }

      .footer {
        margin-top: 15px;
        padding-top: 12px;
        font-size: 9px;
      }

      .cut-line {
        margin: 15px 0 12px 0;
      }
    }

      .header {
        flex-direction: column;
        gap: 12px;
        padding-bottom: 12px;
        margin-bottom: 15px;
      }

      .company-info {
        width: 100%;
      }

      .invoice-title {
        text-align: left;
        width: 100%;
      }

      .invoice-title h1 {
        font-size: 20px;
        margin-bottom: 3px;
      }

      .items-table {
        font-size: 11px;
        margin-bottom: 15px;
      }

      .items-table th {
        padding: 8px 4px;
        font-size: 10px;
      }

      .items-table td {
        padding: 8px 4px;
        font-size: 11px;
      }

      .product-image {
        width: 40px;
        height: 40px;
      }

      .item-details {
        gap: 8px;
      }

      .item-info {
        font-size: 11px;
      }

      .totals {
        max-width: 100%;
        margin-top: 10px;
      }

      .total-row {
        padding: 6px 0;
        font-size: 12px;
      }

      .total-row.grand-total {
        padding: 10px 12px;
        font-size: 14px;
      }

      .thank-you {
        margin-top: 12px;
        font-size: 12px;
      }

      .shipping-labels {
        flex-direction: column;
        gap: 12px;
        margin-top: 12px;
      }

      .label-box {
        padding: 12px;
      }

      .label-box h3 {
        font-size: 11px;
        margin-bottom: 8px;
      }

      .label-box p {
        font-size: 10px;
        margin-bottom: 3px;
      }

      .footer {
        margin-top: 12px;
        padding-top: 10px;
        font-size: 9px;
      }

      .cut-line {
        margin: 12px 0 10px 0;
      }
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }

      .invoice-container {
        box-shadow: none;
        width: 210mm;
        min-height: 297mm;
      }

      .header {
        flex-direction: row;
      }

      .invoice-title {
        text-align: right;
      }

      .shipping-labels {
        flex-direction: row;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" class="company-logo" crossorigin="anonymous" />` : ''}
        <div>
          <div class="company-name">${s.company_name}</div>
          ${s.company_tagline ? `<div class="company-tagline">${s.company_tagline}</div>` : ''}
          <div class="company-details">
            <p>${s.company_email}</p>
            <p>${s.company_phone}</p>
            ${s.company_gst ? `<p>GST: ${s.company_gst}</p>` : ''}
          </div>
        </div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p class="invoice-number">Order #${order.id.slice(0, 8).toUpperCase()}</p>
        <p class="order-date">${orderDate}</p>
        <div class="payment-status ${order.payment_status}">
          ${order.payment_status}
        </div>
      </div>
    </div>

    ${order.dispatch_details && order.dispatch_details.trim() !== '' ? `
    <div style="background: #e0f2fe; border: 2px solid #0ea5e9; border-radius: 6px; padding: 12px; margin: 15px 0;">
      <h3 style="margin: 0 0 8px 0; color: #0369a1; font-size: 12px;">Dispatch Details</h3>
      <p style="margin: 0; white-space: pre-wrap; color: #334155; font-size: 11px;">${order.dispatch_details}</p>
    </div>
    ` : ''}

    <table class="items-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${order.order_items.map(item => {
          const details = [];
          if (item.selected_size) details.push(`Size: ${item.selected_size}`);
          if (item.selected_color) details.push(`Color: ${item.selected_color}`);
          const detailsHTML = details.length > 0 ? `<span>${details.join(' • ')}</span>` : '';
          
          // Build image HTML with CORS support and proper error handling
          let imageHTML = '';
          // Always try to show images by default (show_product_images defaults to true)
          const shouldShowImages = s.show_product_images !== false; // Default true if not explicitly false
          if (shouldShowImages && item.product_image) {
            try {
              // Encode URL to handle special characters
              let encodedImageUrl = item.product_image.includes('blob:') 
                ? item.product_image 
                : encodeURI(item.product_image);
              
              // If it's an R2 image via our API, we might need to make it absolute for html2canvas
              if (encodedImageUrl.startsWith('/api/')) {
                encodedImageUrl = window.location.origin + encodedImageUrl;
              }
              
              imageHTML = `<img src="${encodedImageUrl}" alt="${item.product_name}" class="product-image" crossorigin="anonymous" loading="eager" onload="this.style.opacity='1'" onerror="this.parentElement.style.gap='0'; this.remove();" style="opacity: 0.8;" />`;
            } catch (e) {
              console.warn('[v0] Error encoding image URL:', e);
              // Fallback to direct URL if encoding fails
              if (item.product_image) {
                imageHTML = `<img src="${item.product_image}" alt="${item.product_name}" class="product-image" crossorigin="anonymous" loading="eager" onload="this.style.opacity='1'" onerror="this.parentElement.style.gap='0'; this.remove();" style="opacity: 0.8;" />`;
              }
            }
          }

          return `
          <tr>
            <td>
              <div class="item-details">
                ${imageHTML}
                <div class="item-info">
                  <strong>${item.product_name}</strong>
                  ${detailsHTML}
                </div>
              </div>
            </td>
            <td>${item.quantity}</td>
            <td>₹${Number(item.product_price).toFixed(2)}</td>
            <td>₹${Number(item.subtotal).toFixed(2)}</td>
          </tr>
        `;
        }).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row subtotal">
        <span>Subtotal</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
      <div class="total-row tax">
        <span>Shipping Charge</span>
        <span>₹${shippingCharge.toFixed(2)}</span>
      </div>
      <div class="total-row grand-total">
        <span>Total Amount</span>
        <span>₹${total.toFixed(2)}</span>
      </div>
    </div>

    <div class="thank-you">
      ${s.thank_you_message}
    </div>

    ${s.show_cut_line ? `<div class="cut-line"></div>` : ''}

    ${s.show_shipping_label ? `
    <div class="shipping-labels">
      <div class="label-box">
        <h3>From</h3>
        <p><strong>${s.from_name}</strong></p>
        <p>${s.from_address}</p>
        <p>${s.from_city}, ${s.from_state}</p>
        <p><strong>PIN:</strong> ${s.from_pincode}</p>
        <p><strong>Mobile:</strong> ${s.from_phone}</p>
      </div>

      <div class="label-box">
        <h3>Ship To</h3>
        <p><strong>${order.customer_name}</strong></p>
        <p>${order.shipping_address.address}</p>
        <p>${order.shipping_address.city}, ${order.shipping_address.state}</p>
        <p><strong>PIN:</strong> ${order.shipping_address.pincode}</p>
        <p><strong>Mobile:</strong> ${order.customer_phone}</p>
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <p>${s.footer_text}</p>
      <p>For any queries, please contact us at ${s.company_email}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Apply theme to settings
export function applyTheme(settings: BillSettings, themeName: keyof typeof BILL_THEMES): BillSettings {
  const theme = BILL_THEMES[themeName];
  return {
    ...settings,
    theme: themeName,
    ...theme,
  };
}

// Fetch delivery charge from database
export async function fetchDeliveryCharge(db: any): Promise<number> {
  try {
    const { ref, get } = await import('firebase/database');
    const settingsRef = ref(db, 'site_settings');
    const snapshot = await get(settingsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const settingsId = Object.keys(data)[0];
      const settings = data[settingsId];
      return settings?.delivery_charge || 0;
    }
  } catch (error) {
    console.warn('[v0] Could not fetch delivery charge:', error);
  }
  return 0;
}

async function createBillElement(order: Order, siteSettings: SiteSettings, shippingCharge: number = 0, customSettings?: BillSettings): Promise<HTMLDivElement> {
  const billHTML = generateBillHTML(order, siteSettings, shippingCharge, customSettings);

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.innerHTML = billHTML;
  document.body.appendChild(tempDiv);

  return tempDiv;
}

export async function downloadBillAsPDF(order: Order, siteSettings: SiteSettings, shippingCharge: number = 0, customSettings?: BillSettings): Promise<void> {
  try {
    // Load bill settings from localStorage or Firebase if not provided
    let billSettings = customSettings;
    if (!billSettings) {
      try {
        const saved = localStorage.getItem('billSettings');
        if (saved) {
          billSettings = JSON.parse(saved);
        } else {
          // Use default settings that ensure images show
          billSettings = { show_product_images: true };
        }
      } catch (error) {
        console.warn('Could not load bill settings:', error);
        // Fallback to ensure images show
        billSettings = { show_product_images: true };
      }
    } else if (!billSettings.show_product_images) {
      // Ensure images are shown
      billSettings.show_product_images = true;
    }

    const tempDiv = await createBillElement(order, siteSettings, shippingCharge, billSettings);
    const invoiceContainer = tempDiv.querySelector('.invoice-container') as HTMLElement;

    if (!invoiceContainer) {
      throw new Error('Invoice container not found');
    }

    // Wait for images to load
    const images = invoiceContainer.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(true);
        } else {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        }
      });
    }));

    const canvas = await html2canvas(invoiceContainer, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 5000
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`invoice-${order.id.slice(0, 8)}.pdf`);

    document.body.removeChild(tempDiv);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

export async function downloadBillAsJPG(order: Order, siteSettings: SiteSettings, shippingCharge: number = 0, customSettings?: BillSettings): Promise<void> {
  try {
    // Load bill settings from localStorage or Firebase if not provided
    let billSettings = customSettings;
    if (!billSettings) {
      try {
        const saved = localStorage.getItem('billSettings');
        if (saved) {
          billSettings = JSON.parse(saved);
        } else {
          // Use default settings that ensure images show
          billSettings = { show_product_images: true };
        }
      } catch (error) {
        console.warn('Could not load bill settings:', error);
        // Fallback to ensure images show
        billSettings = { show_product_images: true };
      }
    } else if (!billSettings.show_product_images) {
      // Ensure images are shown
      billSettings.show_product_images = true;
    }

    const tempDiv = await createBillElement(order, siteSettings, shippingCharge, billSettings);
    const invoiceContainer = tempDiv.querySelector('.invoice-container') as HTMLElement;

    if (!invoiceContainer) {
      throw new Error('Invoice container not found');
    }

    // Wait for images to load
    const images = invoiceContainer.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(true);
        } else {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        }
      });
    }));

    const canvas = await html2canvas(invoiceContainer, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 5000
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${order.id.slice(0, 8)}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      document.body.removeChild(tempDiv);
    }, 'image/jpeg', 0.95);
  } catch (error) {
    console.error('Error generating JPG:', error);
    alert('Failed to generate JPG. Please try again.');
  }
}

export function printBill(order: Order, siteSettings: SiteSettings, shippingCharge: number = 0, customSettings?: BillSettings): void {
  // Ensure images are shown in print
  let billSettings = customSettings;
  if (!billSettings) {
    try {
      const saved = localStorage.getItem('billSettings');
      if (saved) {
        billSettings = JSON.parse(saved);
      } else {
        billSettings = { show_product_images: true };
      }
    } catch (error) {
      billSettings = { show_product_images: true };
    }
  } else if (!billSettings.show_product_images) {
    billSettings.show_product_images = true;
  }

  const billHTML = generateBillHTML(order, siteSettings, shippingCharge, billSettings);

  const printWindow = window.open('', '', 'height=1000,width=800');
  if (!printWindow) return;

  printWindow.document.write(billHTML);
  printWindow.document.close();

  // Wait for images to load before printing
  const waitForImages = () => {
    const images = printWindow.document.querySelectorAll('img');
    let loadedCount = 0;
    let totalImages = images.length;

    if (totalImages === 0) {
      setTimeout(() => {
        printWindow.print();
      }, 500);
      return;
    }

    Array.from(images).forEach((img: any) => {
      if (img.complete) {
        loadedCount++;
        if (loadedCount === totalImages) {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      } else {
        img.onload = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          }
        };
      }
    });
  };

  setTimeout(waitForImages, 500);
}

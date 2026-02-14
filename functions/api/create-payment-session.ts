import type { RequestContext } from '@cloudflare/workers-types';

interface Env {
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
}

interface PaymentSessionRequest {
  order_id: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context as RequestContext<Env>;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json() as PaymentSessionRequest;
    const { order_id, amount, customer_name, customer_email, customer_phone } = body;

    console.log('[CREATE-PAYMENT] Request received:', {
      order_id,
      amount,
      customer_name,
      customer_email
    });

    const razorpayKeyId = env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('[CREATE-PAYMENT] Missing credentials');
      console.error('[CREATE-PAYMENT] Available env keys:', Object.keys(env));
      throw new Error('Razorpay credentials not configured in environment');
    }

    console.log('[CREATE-PAYMENT] Credentials found, creating Razorpay order...');

    const razorpayAmount = Math.round(amount * 100);
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const razorpayOrder = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: razorpayAmount,
        currency: 'INR',
        receipt: order_id,
        notes: {
          order_id,
          customer_name,
          customer_email,
          customer_phone,
        },
      }),
    });

    if (!razorpayOrder.ok) {
      const errorText = await razorpayOrder.text();
      console.error('[CREATE-PAYMENT] Razorpay API error:', errorText);
      throw new Error(`Failed to create Razorpay order: ${errorText}`);
    }

    const orderData = await razorpayOrder.json() as {
      id: string;
      amount: number;
      currency: string;
    };

    console.log('[CREATE-PAYMENT] Razorpay order created:', orderData.id);

    return new Response(
      JSON.stringify({
        order_id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        key_id: razorpayKeyId,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[CREATE-PAYMENT] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create payment session',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

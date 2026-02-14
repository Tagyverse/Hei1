import type { RequestContext } from '@cloudflare/workers-types';

interface Env {
  RAZORPAY_WEBHOOK_SECRET: string;
}

interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id: string | null;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status: string | null;
        captured: boolean;
        description: string | null;
        card_id: string | null;
        bank: string | null;
        wallet: string | null;
        vpa: string | null;
        email: string;
        contact: string;
        notes: Record<string, string>;
        fee: number;
        tax: number;
        error_code: string | null;
        error_description: string | null;
        error_source: string | null;
        error_step: string | null;
        error_reason: string | null;
        created_at: number;
      };
    };
  };
  created_at: number;
}

async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );

    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context as RequestContext<Env>;

  try {
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const rawBody = await request.text();
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      console.error('Available env keys:', Object.keys(env));
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const isValid = await verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const webhookData = JSON.parse(rawBody) as RazorpayWebhookEvent;

    console.log('Webhook received:', {
      event: webhookData.event,
      payment_id: webhookData.payload.payment.entity.id,
      order_id: webhookData.payload.payment.entity.order_id,
      status: webhookData.payload.payment.entity.status,
      amount: webhookData.payload.payment.entity.amount / 100,
    });

    switch (webhookData.event) {
      case 'payment.captured':
        console.log('Payment captured successfully:', {
          payment_id: webhookData.payload.payment.entity.id,
          order_id: webhookData.payload.payment.entity.order_id,
          amount: webhookData.payload.payment.entity.amount / 100,
        });
        break;

      case 'payment.failed':
        console.log('Payment failed:', {
          payment_id: webhookData.payload.payment.entity.id,
          order_id: webhookData.payload.payment.entity.order_id,
          error_code: webhookData.payload.payment.entity.error_code,
          error_description: webhookData.payload.payment.entity.error_description,
        });
        break;

      case 'order.paid':
        console.log('Order paid:', {
          payment_id: webhookData.payload.payment.entity.id,
          order_id: webhookData.payload.payment.entity.order_id,
        });
        break;

      default:
        console.log('Unhandled webhook event:', webhookData.event);
    }

    return new Response(
      JSON.stringify({ status: 'ok' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

import type { RequestContext } from '@cloudflare/workers-types';

interface Env {
  ANALYTICS_KV: KVNamespace;
}

interface TrackEvent {
  event_type: string;
  sessionId: string;
  userId?: string | null;
  timestamp: string;
  data?: Record<string, any>;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context as RequestContext<Env>;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json() as TrackEvent;
    
    const event = {
      event_type: body.event_type,
      session_id: body.sessionId,
      user_id: body.userId || null,
      timestamp: body.timestamp || new Date().toISOString(),
      data: body.data || {},
      user_agent: request.headers.get('user-agent') || 'Unknown',
      country: request.headers.get('cf-ipcountry') || 'Unknown',
    };

    const eventId = `event:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    await env.ANALYTICS_KV.put(eventId, JSON.stringify(event), {
      expirationTtl: 60 * 60 * 24 * 90, // 90 days
    });

    // Also track event count by type
    const eventTypeKey = `event_count:${body.event_type}:${new Date().toISOString().split('T')[0]}`;
    const currentCount = await env.ANALYTICS_KV.get(eventTypeKey);
    const newCount = (parseInt(currentCount || '0') + 1).toString();
    await env.ANALYTICS_KV.put(eventTypeKey, newCount, {
      expirationTtl: 60 * 60 * 24 * 90,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Failed to track event:', error);
    return new Response(JSON.stringify({ error: 'Failed to track event' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

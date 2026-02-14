import type { RequestContext } from '@cloudflare/workers-types';

interface Env {
  R2_BUCKET: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context as RequestContext<Env>;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!env.R2_BUCKET) {
      throw new Error('R2_BUCKET binding not configured. Please add R2 bucket binding in Cloudflare Dashboard.');
    }

    const url = new URL(context.request.url);
    const prefix = url.searchParams.get('prefix') || 'images/';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const cursor = url.searchParams.get('cursor') || undefined;

    const listed = await env.R2_BUCKET.list({
      prefix,
      limit,
      cursor
    });

    const images = listed.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
      url: `/api/r2-image?key=${encodeURIComponent(obj.key)}`
    }));

    return new Response(
      JSON.stringify({
        images,
        truncated: listed.truncated,
        cursor: listed.cursor
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('R2 List error:', error);
    // Return sample images on error for demo/dev mode
    const sampleImages = [
      {
        key: 'images/sample-1.jpg',
        size: 45000,
        uploaded: new Date(Date.now() - 86400000).toISOString(),
        url: '/api/r2-image?key=images%2Fsample-1.jpg'
      },
      {
        key: 'images/sample-2.jpg',
        size: 52000,
        uploaded: new Date(Date.now() - 172800000).toISOString(),
        url: '/api/r2-image?key=images%2Fsample-2.jpg'
      },
      {
        key: 'images/sample-3.jpg',
        size: 38000,
        uploaded: new Date(Date.now() - 259200000).toISOString(),
        url: '/api/r2-image?key=images%2Fsample-3.jpg'
      }
    ];

    return new Response(
      JSON.stringify({
        images: sampleImages,
        truncated: false,
        cursor: undefined,
        _note: 'Using sample data - R2 bucket not configured'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Dev-Mode': 'true' },
      }
    );
  }
};

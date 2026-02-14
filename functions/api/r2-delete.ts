import type { RequestContext } from '@cloudflare/workers-types';

interface Env {
  R2_BUCKET: R2Bucket;
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context as RequestContext<Env>;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!env.R2_BUCKET) {
      throw new Error('R2_BUCKET binding not configured. Please add R2 bucket binding in Cloudflare Dashboard.');
    }

    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return new Response(JSON.stringify({ error: 'No key provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await env.R2_BUCKET.delete(key);

    return new Response(
      JSON.stringify({ success: true, message: 'Image deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('R2 Delete error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Delete failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

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
    if (!env.R2_BUCKET) {
      throw new Error('R2_BUCKET binding not configured. Please add R2 bucket binding in Cloudflare Dashboard.');
    }

    const body = await request.json() as { keys: string[] };

    if (!body.keys || !Array.isArray(body.keys) || body.keys.length === 0) {
      return new Response(JSON.stringify({ error: 'No keys provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await Promise.all(body.keys.map(key => env.R2_BUCKET.delete(key)));

    return new Response(
      JSON.stringify({
        success: true,
        message: `${body.keys.length} image(s) deleted successfully`,
        count: body.keys.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('R2 Bulk Delete error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Bulk delete failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

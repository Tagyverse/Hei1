const onRequestGet = async (context) => {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=31536000, immutable"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (!env.R2_BUCKET) {
      throw new Error("R2_BUCKET binding not configured. Please add R2 bucket binding in Cloudflare Dashboard.");
    }
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    if (!key) {
      return new Response("Missing key parameter", {
        status: 400,
        headers: corsHeaders
      });
    }
    const object = await env.R2_BUCKET.get(key);
    if (!object) {
      return new Response("Image not found", {
        status: 404,
        headers: corsHeaders
      });
    }
    const headers = new Headers(corsHeaders);
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    return new Response(object.body, { headers });
  } catch (error) {
    console.error("R2 Image fetch error:", error);
    return new Response(
      "Failed to fetch image",
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
};
export {
  onRequestGet
};

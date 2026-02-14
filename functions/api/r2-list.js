const onRequestGet = async (context) => {
  const { env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (!env.R2_BUCKET) {
      throw new Error("R2_BUCKET binding not configured. Please add R2 bucket binding in Cloudflare Dashboard.");
    }
    const url = new URL(context.request.url);
    const prefix = url.searchParams.get("prefix") || "images/";
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const cursor = url.searchParams.get("cursor") || void 0;
    const listed = await env.R2_BUCKET.list({
      prefix,
      limit,
      cursor
    });
    const images = listed.objects.map((obj) => ({
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
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("R2 List error:", error);
    const sampleImages = [
      {
        key: "images/sample-1.jpg",
        size: 45e3,
        uploaded: new Date(Date.now() - 864e5).toISOString(),
        url: "/api/r2-image?key=images%2Fsample-1.jpg"
      },
      {
        key: "images/sample-2.jpg",
        size: 52e3,
        uploaded: new Date(Date.now() - 1728e5).toISOString(),
        url: "/api/r2-image?key=images%2Fsample-2.jpg"
      },
      {
        key: "images/sample-3.jpg",
        size: 38e3,
        uploaded: new Date(Date.now() - 2592e5).toISOString(),
        url: "/api/r2-image?key=images%2Fsample-3.jpg"
      }
    ];
    return new Response(
      JSON.stringify({
        images: sampleImages,
        truncated: false,
        cursor: void 0,
        _note: "Using sample data - R2 bucket not configured"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Dev-Mode": "true" }
      }
    );
  }
};
export {
  onRequestGet
};

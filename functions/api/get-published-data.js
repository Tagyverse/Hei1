const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60"
};
const onRequest = async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (!env.R2_BUCKET) {
      console.error("[GET-DATA] R2_BUCKET binding not configured");
      return new Response(
        JSON.stringify({ error: "R2_BUCKET binding not configured. Please add R2 bucket binding in Cloudflare Dashboard." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    const fileName = "site-data.json";
    console.log("[GET-DATA] Fetching file:", fileName);
    const fetchStart = Date.now();
    const object = await env.R2_BUCKET.get(fileName);
    const fetchTime = Date.now() - fetchStart;
    if (!object) {
      console.log("[GET-DATA] File not found in R2:", fileName);
      return new Response(JSON.stringify({ error: "No published data found", fallback: true }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const parseStart = Date.now();
    const data = await object.text();
    const parseTime = Date.now() - parseStart;
    console.log(`[GET-DATA] Successfully fetched data: size=${data.length} bytes, fetchTime=${fetchTime}ms, parseTime=${parseTime}ms`);
    try {
      JSON.parse(data);
      console.log("[GET-DATA] JSON validation passed");
    } catch (parseError) {
      console.error("[GET-DATA] Invalid JSON in R2:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid data format in R2 storage" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    return new Response(data, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[GET-DATA ERROR]", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to get published data",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};
export {
  onRequest
};

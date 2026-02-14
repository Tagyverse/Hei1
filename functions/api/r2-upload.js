const onRequestPost = async (context) => {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!file.type.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "File must be an image" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: "File size must be less than 2MB" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const fileExtension = file.type === "image/png" ? "png" : "jpg";
    const fileName = `images/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    if (!env.R2_BUCKET) {
      console.warn("R2_BUCKET binding not configured, returning demo URL");
      const demoUrl = `/api/r2-image?key=${encodeURIComponent(fileName)}&_demo=true`;
      return new Response(
        JSON.stringify({
          url: demoUrl,
          fileName,
          size: file.size,
          type: file.type,
          _note: "Demo mode - R2 not configured"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-Dev-Mode": "true" }
        }
      );
    }
    const arrayBuffer = await file.arrayBuffer();
    await env.R2_BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });
    const publicUrl = `/api/r2-image?key=${encodeURIComponent(fileName)}`;
    return new Response(
      JSON.stringify({
        url: publicUrl,
        fileName,
        size: file.size,
        type: file.type
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("R2 Upload error:", error);
    const fileExtension = request.file?.type === "image/png" ? "png" : "jpg";
    const fileName = `images/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const demoUrl = `/api/r2-image?key=${encodeURIComponent(fileName)}&_demo=true`;
    return new Response(
      JSON.stringify({
        url: demoUrl,
        fileName,
        size: 0,
        type: "image/jpeg",
        _error: error instanceof Error ? error.message : "Upload error, using demo URL"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Dev-Mode": "true" }
      }
    );
  }
};
export {
  onRequestPost
};

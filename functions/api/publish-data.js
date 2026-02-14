const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function validateData(data) {
  const warnings = [];
  const criticalSections = ["products", "categories"];
  const optionalSections = [
    "site_settings",
    "navigation_settings",
    "reviews",
    "offers",
    "carousel_images",
    "carousel_settings",
    "homepage_sections",
    "info_sections",
    "marquee_sections",
    "video_sections",
    "video_section_settings",
    "video_overlay_sections",
    "video_overlay_items",
    "default_sections_visibility",
    "card_designs",
    "coupons",
    "try_on_models",
    "tax_settings",
    "footer_settings",
    "footer_config",
    "policies",
    "settings",
    "bill_settings"
  ];
  criticalSections.forEach((section) => {
    if (!data[section] || Object.keys(data[section] || {}).length === 0) {
      warnings.push(`Warning: ${section} is empty or missing`);
    }
  });
  if (!data.navigation_settings || Object.keys(data.navigation_settings).length === 0) {
    console.log("[PUBLISH] \u2139 navigation_settings not found, applying defaults");
    data.navigation_settings = {
      background: "#ffffff",
      text: "#111827",
      activeTab: "#14b8a6",
      inactiveButton: "#f3f4f6",
      borderRadius: "full",
      buttonSize: "md",
      themeMode: "default",
      buttonLabels: {
        home: "Home",
        shop: "Shop All",
        search: "Search",
        cart: "Cart",
        myOrders: "My Orders",
        login: "Login",
        signOut: "Sign Out",
        admin: "Admin"
      }
    };
  } else {
    console.log("[PUBLISH] \u2713 navigation_settings found and published");
  }
  if (data.products && typeof data.products === "object" && Object.keys(data.products).length > 0) {
    Object.entries(data.products).forEach(([id, product]) => {
      if (!product.name) warnings.push(`Product ${id} missing name`);
      if (!product.price && product.price !== 0) warnings.push(`Product ${id} missing price`);
    });
  }
  if (data.categories && typeof data.categories === "object" && Object.keys(data.categories).length > 0) {
    Object.entries(data.categories).forEach(([id, category]) => {
      if (!category.name) warnings.push(`Category ${id} missing name`);
    });
  }
  return {
    valid: true,
    warnings
  };
}
const onRequest = async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  try {
    if (!env.R2_BUCKET) {
      console.error("R2_BUCKET binding not configured");
      return new Response(
        JSON.stringify({ error: "R2_BUCKET binding not configured. Please add R2 bucket binding in Cloudflare Dashboard." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    const body = await request.json();
    const { data } = body;
    if (!data) {
      return new Response(JSON.stringify({ error: "No data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const validation = validateData(data);
    if (validation.warnings.length > 0) {
      console.warn("[PUBLISH] Data validation warnings:", validation.warnings);
      console.warn("[PUBLISH] Warnings will be logged but publish will continue");
    }
    const publishedData = {
      ...data,
      published_at: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    };
    const jsonContent = JSON.stringify(publishedData, null, 2);
    const fileName = "site-data.json";
    console.log("[PUBLISH] Starting publish to R2");
    console.log("[PUBLISH] File:", fileName);
    console.log("[PUBLISH] Size:", jsonContent.length, "bytes");
    console.log("[PUBLISH] Data keys:", Object.keys(data));
    console.log("[PUBLISH] Products count:", Object.keys(data.products || {}).length);
    console.log("[PUBLISH] Categories count:", Object.keys(data.categories || {}).length);
    const uploadStart = Date.now();
    await env.R2_BUCKET.put(fileName, jsonContent, {
      httpMetadata: {
        contentType: "application/json",
        cacheControl: "max-age=300"
      }
    });
    const uploadTime = Date.now() - uploadStart;
    console.log(`[PUBLISH] Successfully uploaded to R2 in ${uploadTime}ms`);
    const verifyStart = Date.now();
    const verifiedObject = await env.R2_BUCKET.get(fileName);
    const verifyTime = Date.now() - verifyStart;
    if (!verifiedObject) {
      throw new Error("Failed to verify published data in R2");
    }
    const verifiedContent = await verifiedObject.text();
    const verifiedData = JSON.parse(verifiedContent);
    console.log(`[PUBLISH] Verified published data in ${verifyTime}ms`);
    console.log("[PUBLISH] Verified data keys:", Object.keys(verifiedData));
    return new Response(
      JSON.stringify({
        success: true,
        message: "Data published successfully and verified",
        published_at: publishedData.published_at,
        fileName,
        size: jsonContent.length,
        uploadTime,
        verifyTime,
        dataKeys: Object.keys(data),
        productCount: Object.keys(data.products || {}).length,
        categoryCount: Object.keys(data.categories || {}).length,
        warnings: validation.warnings
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("[PUBLISH ERROR]", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Publish failed",
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

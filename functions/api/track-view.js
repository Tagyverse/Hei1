function parseUserAgent(userAgent) {
  const ua = userAgent.toLowerCase();
  let browser = "Other";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edg")) browser = "Edge";
  let deviceType = "Desktop";
  if (ua.includes("mobile")) deviceType = "Mobile";
  else if (ua.includes("tablet")) deviceType = "Tablet";
  return { browser, deviceType };
}
const onRequest = async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const body = await request.json();
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const country = request.headers.get("cf-ipcountry") || "Unknown";
    const city = request.headers.get("cf-iplocation-city") || "Unknown";
    const { browser, deviceType } = parseUserAgent(userAgent);
    const pageView = {
      path: body.path,
      referrer: body.referrer || null,
      userAgent,
      country,
      city,
      deviceType,
      browser,
      sessionId: body.sessionId,
      timestamp: Date.now()
    };
    const viewId = `view:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    await env.ANALYTICS_KV.put(viewId, JSON.stringify(pageView), {
      expirationTtl: 60 * 60 * 24 * 90
    });
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const dailyKey = `daily:${today}`;
    const dailyCount = await env.ANALYTICS_KV.get(dailyKey);
    const newCount = (parseInt(dailyCount || "0") + 1).toString();
    await env.ANALYTICS_KV.put(dailyKey, newCount, {
      expirationTtl: 60 * 60 * 24 * 90
    });
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("Failed to track view:", error);
    return new Response(JSON.stringify({ error: "Failed to track view" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
export {
  onRequest
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};
const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};
const onRequestGet = async () => {
  return new Response(JSON.stringify({ status: "AI Assistant API is online" }), {
    status: 200,
    headers: corsHeaders
  });
};
const onRequestPost = async (context) => {
  const { request } = context;
  try {
    const requestData = await request.json();
    const { message, settings } = requestData;
    console.log("AI Assistant Request:", { hasMessage: !!message, hasSettings: !!settings, isActive: settings?.is_active });
    if (!settings || !settings.is_active) {
      return new Response(JSON.stringify({ error: "AI Assistant is disabled" }), {
        status: 400,
        headers: corsHeaders
      });
    }
    if (!settings.api_key) {
      return new Response(JSON.stringify({ error: "API key is required. Please add your Gemini API key in Settings." }), {
        status: 400,
        headers: corsHeaders
      });
    }
    if (!message || message.trim() === "") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: corsHeaders
      });
    }
    const firebaseUrl = "https://pixiebloomsin-default-rtdb.firebaseio.com";
    const [productsResponse, ordersResponse] = await Promise.all([
      fetch(`${firebaseUrl}/products.json`),
      fetch(`${firebaseUrl}/orders.json`)
    ]);
    const products = await productsResponse.json();
    const orders = await ordersResponse.json();
    const productsArray = products ? Object.values(products) : [];
    const ordersArray = orders ? Object.values(orders) : [];
    const context_data = {
      totalProducts: productsArray.length,
      totalOrders: ordersArray.length,
      totalRevenue: ordersArray.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      pendingOrders: ordersArray.filter((o) => o.order_status === "pending").length
    };
    const systemPrompt = `You are a marketing and business assistant for an e-commerce store.

Business Context:
- Total Products: ${context_data.totalProducts}
- Total Orders: ${context_data.totalOrders}
- Total Revenue: \u20B9${context_data.totalRevenue.toFixed(2)}
- Pending Orders: ${context_data.pendingOrders}

Provide actionable insights, marketing strategies, and business improvement suggestions based on this data.`;
    const geminiModel = "gemini-1.5-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${settings.api_key}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}

User Question: ${message}`
          }]
        }]
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", { status: response.status, statusText: response.statusText, error: errorText });
      throw new Error(`Gemini API error (${response.status}): ${response.statusText}. Please check your API key.`);
    }
    const data = await response.json();
    if (data.error) {
      console.error("Gemini API returned error:", data.error);
      throw new Error(data.error.message || "Error from Gemini API");
    }
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";
    console.log("AI Response generated successfully");
    return new Response(
      JSON.stringify({ response: aiResponse, context: context_data }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("AI Assistant Error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: "Check server logs for more information"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
export {
  onRequestGet,
  onRequestOptions,
  onRequestPost
};

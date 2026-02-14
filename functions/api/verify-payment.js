async function verifyPaymentSignature(orderId, paymentId, signature, secret) {
  try {
    const text = `${orderId}|${paymentId}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(text)
    );
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return expectedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}
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
    const body = await request.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
    console.log("[VERIFY-PAYMENT] Starting verification:", {
      razorpay_payment_id,
      razorpay_order_id,
      has_signature: !!razorpay_signature,
      signature_length: razorpay_signature?.length
    });
    const razorpaySecret = env.RAZORPAY_KEY_SECRET;
    console.log("[VERIFY-PAYMENT] Environment check:", {
      has_secret: !!razorpaySecret,
      secret_length: razorpaySecret?.length,
      env_keys: Object.keys(env || {})
    });
    if (!razorpaySecret) {
      console.error("[VERIFY-PAYMENT] ERROR: Razorpay secret not found in environment");
      return new Response(
        JSON.stringify({
          error: "Payment gateway not configured. Secret key missing. Please contact support.",
          debug: "RAZORPAY_KEY_SECRET missing",
          verified: false
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    console.log("[VERIFY-PAYMENT] Secret found, verifying signature...");
    const isValid = await verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpaySecret
    );
    console.log("[VERIFY-PAYMENT] Signature verification result:", isValid);
    if (!isValid) {
      console.error("[VERIFY-PAYMENT] Signature verification FAILED");
      return new Response(
        JSON.stringify({
          error: "Invalid payment signature. Payment verification failed.",
          verified: false
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    console.log("[VERIFY-PAYMENT] SUCCESS: Payment verified");
    return new Response(
      JSON.stringify({
        status: "success",
        verified: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("[VERIFY-PAYMENT] EXCEPTION:", error);
    console.error("[VERIFY-PAYMENT] Error details:", {
      message: error instanceof Error ? error.message : "Unknown",
      stack: error instanceof Error ? error.stack : void 0
    });
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Payment verification failed",
        debug: "Exception during verification"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
};
export {
  onRequestPost
};

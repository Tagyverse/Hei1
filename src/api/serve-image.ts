/**
 * API Route: GET /api/serve-image
 * Serves R2 bucket images with proper CORS headers and caching
 * 
 * Query Parameters:
 * - url: Direct R2 image URL or key to fetch
 * - width: Optional image width for optimization
 * - height: Optional image height for optimization
 * - quality: Optional image quality (1-100)
 */

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // If it's just a key, construct the R2 URL
    let finalUrl = imageUrl;
    if (!imageUrl.startsWith('http')) {
      // Assume it's an R2 key, construct full URL
      // This would be configured with your R2 bucket domain
      finalUrl = `${import.meta.env.VITE_R2_BUCKET_URL || ''}/${imageUrl}`;
    }
    
    // Fetch the image from R2
    const response = await fetch(finalUrl);
    
    if (!response.ok) {
      console.error('[v0] Failed to fetch image:', finalUrl, response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch image' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the image blob
    const imageBlob = await response.blob();
    
    // Return with proper CORS and caching headers
    return new Response(imageBlob, {
      status: 200,
      headers: {
        'Content-Type': imageBlob.type || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('[v0] Error serving image:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

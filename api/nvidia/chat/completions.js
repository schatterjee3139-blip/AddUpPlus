/**
 * Vercel serverless function to proxy NVIDIA API chat completions
 * This avoids CORS issues in production
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variable
  const apiKey = process.env.VITE_NVIDIA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'NVIDIA API key not configured. Please set VITE_NVIDIA_API_KEY in Vercel environment variables.' 
    });
  }

  const nvidiaUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';

  try {
    // Forward the request to NVIDIA API
    const response = await fetch(nvidiaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    // Check if this is a streaming response
    const contentType = response.headers.get('content-type') || '';
    const isStreaming = contentType.includes('text/event-stream') || 
                       contentType.includes('text/plain') ||
                       (req.body && req.body.stream === true);

    if (isStreaming) {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Stream the response
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).send(errorText);
      }

      // Pipe the stream chunk by chunk
      if (!response.body) {
        return res.status(500).json({ error: 'No response body' });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Use a recursive function to handle streaming
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
            
            // Flush the response (important for Vercel)
            if (typeof res.flush === 'function') {
              res.flush();
            }
          }
        } catch (streamError) {
          console.error('Streaming error:', streamError);
          res.end();
        }
      };

      pump();
      return;
    }

    // Non-streaming response (JSON)
    const data = await response.text();
    
    // Try to parse as JSON
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      // If it's not JSON, return as text
      return res.status(response.status).send(data);
    }

    // Return JSON response
    if (!response.ok) {
      return res.status(response.status).json(jsonData);
    }

    return res.status(response.status).json(jsonData);
  } catch (error) {
    console.error('NVIDIA API Proxy Error:', error);
    return res.status(500).json({ 
      error: 'Failed to proxy request to NVIDIA API',
      message: error.message 
    });
  }
}


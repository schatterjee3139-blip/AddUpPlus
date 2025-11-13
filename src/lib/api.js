// API configuration for NVIDIA services
const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY;
// Use proxy in development to avoid CORS issues, direct API in production
const USE_PROXY = import.meta.env.DEV;
const NVIDIA_API_BASE = USE_PROXY 
  ? '/api/nvidia'  // Use Vite proxy in development
  : 'https://integrate.api.nvidia.com/v1';  // Direct API in production

/**
 * Get the NVIDIA API key from environment variables
 */
export const getNvidiaApiKey = () => {
  if (!NVIDIA_API_KEY) {
    console.warn('NVIDIA API key not found. Please set VITE_NVIDIA_API_KEY in your .env file');
    return null;
  }
  return NVIDIA_API_KEY;
};

/**
 * Make a request to NVIDIA API with proper error handling
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 */
export const nvidiaApiRequest = async (endpoint, options = {}) => {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) {
    throw new Error('NVIDIA API key is not configured');
  }

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header
  if (USE_PROXY) {
    // When using proxy, pass API key in a custom header
    headers['X-NVIDIA-API-Key'] = apiKey;
  } else {
    // Direct API call uses Bearer token
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${NVIDIA_API_BASE}${endpoint}`, {
      method: options.method || 'POST',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `NVIDIA API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // Handle network errors (CORS, connectivity, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach NVIDIA API. This might be a CORS issue. Please check your API key and network connection.');
    }
    throw error;
  }
};

/**
 * Chat completion using NVIDIA API
 * @param {string} message - User message
 * @param {string} model - Model to use (default: 'meta/llama-3.1-8b-instruct')
 */
export const chatCompletion = async (message, model = 'meta/llama-3.1-8b-instruct') => {
  try {
    const response = await nvidiaApiRequest('/chat/completions', {
      method: 'POST',
      body: {
        model,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
        stream: false,
      },
    });

    return response;
  } catch (error) {
    console.error('Chat completion error:', error);
    throw error;
  }
};


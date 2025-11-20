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
    console.error('❌ NVIDIA API key is not configured. Please set VITE_NVIDIA_API_KEY in your .env file');
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
    const fetchOptions = {
      method: options.method || 'POST',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    };

    // Add signal if provided (for timeout)
    if (options.signal) {
      fetchOptions.signal = options.signal;
    }

    const response = await fetch(`${NVIDIA_API_BASE}${endpoint}`, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `NVIDIA API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      
      console.error('NVIDIA API Error:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        endpoint,
      });
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Log response structure for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log('NVIDIA API Response:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasContent: !!data.content,
        responseKeys: Object.keys(data),
      });
    }
    
    return data;
  } catch (error) {
    // Handle network errors (CORS, connectivity, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach NVIDIA API. This might be a CORS issue. Please check your API key and network connection.');
    }
    // Don't re-throw AbortError here, let it be handled by the caller
    if (error.name === 'AbortError') {
      throw error;
    }
    throw error;
  }
};

/**
 * Streaming chat completion using NVIDIA API
 * @param {string|Array} messages - Single user message string OR array of message objects with role and content
 * @param {Function} onChunk - Callback function called for each chunk: (chunk: string) => void
 * @param {Function} onComplete - Callback function called on completion: (error?: Error) => void
 * @param {string} model - Model to use (default: 'meta/llama-3.1-8b-instruct')
 * @param {object} options - Additional options (max_tokens, temperature, useNoThink, etc.)
 * @returns {AbortController} - Controller to abort the stream if needed
 */
export const chatCompletionStream = (
  messages,
  onChunk,
  onComplete,
  model = 'meta/llama-3.1-8b-instruct',
  options = {}
) => {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) {
    const error = new Error('NVIDIA API key is not configured');
    onComplete(error);
    return new AbortController();
  }

  // If messages is a string, convert it to array format
  const messageArray = typeof messages === 'string' 
    ? [{ role: 'user', content: messages }]
    : messages;

  // Validate message format
  if (!Array.isArray(messageArray) || messageArray.length === 0) {
    const error = new Error('Messages must be a non-empty array or string');
    onComplete(error);
    return new AbortController();
  }

  // Calculate max_tokens based on conversation length
  const conversationLength = messageArray.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
  const defaultMaxTokens = conversationLength > 1000 ? 2048 : 1024;
  const maxTokens = options.max_tokens || defaultMaxTokens;

  // Check if we should use /no_think for faster responses
  const useNoThink = options.useNoThink !== undefined 
    ? options.useNoThink 
    : conversationLength < 500 && messageArray.length <= 2;

  // Prepare messages array - add system message with /no_think if needed
  let finalMessages = [
    { role: 'system', content: '/no_think' },
    ...messageArray
  ];

  // Set parameters for faster responses when using no_think
  const temperature = useNoThink ? 0 : (options.temperature || 0.7);
  const topP = useNoThink ? 1 : (options.top_p || 0.9);
  const frequencyPenalty = options.frequency_penalty || 0;
  const presencePenalty = options.presence_penalty || 0;

  const requestBody = {
    model,
    messages: finalMessages,
    temperature,
    top_p: topP,
    max_tokens: maxTokens,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
    stream: true,
  };

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add authorization header
  if (USE_PROXY) {
    headers['X-NVIDIA-API-Key'] = apiKey;
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  
  // Check if message contains file content (indicated by PDF or Image markers)
  const hasFileContent = messageArray.some(msg => 
    msg.content && (
      msg.content.includes('[PDF Content') || 
      msg.content.includes('[Image:') ||
      msg.content.includes('--- Page')
    )
  );
  const timeoutDuration = hasFileContent ? 120000 : 60000; // 120 seconds for files, 60 for regular
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

  // Make streaming request
  fetch(`${NVIDIA_API_BASE}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal: controller.signal,
  })
    .then(async (response) => {
      clearTimeout(timeoutId);
      
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

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines (SSE format: "data: {...}\n\n")
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip empty lines and non-data lines
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) {
              continue;
            }

            // Extract JSON data
            const jsonStr = trimmedLine.slice(6); // Remove "data: " prefix
            
            // Skip [DONE] marker
            if (jsonStr === '[DONE]') {
              continue;
            }

            try {
              const data = JSON.parse(jsonStr);
              
              // Extract content from the response
              const content = data.choices?.[0]?.delta?.content || 
                            data.choices?.[0]?.text ||
                            data.content ||
                            '';
              
              if (content) {
                onChunk(content);
              }
            } catch (parseError) {
              // Skip invalid JSON (might be partial data)
              console.warn('Failed to parse SSE chunk:', parseError, jsonStr);
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          const trimmedLine = buffer.trim();
          if (trimmedLine.startsWith('data: ')) {
            const jsonStr = trimmedLine.slice(6);
            if (jsonStr !== '[DONE]') {
              try {
                const data = JSON.parse(jsonStr);
                const content = data.choices?.[0]?.delta?.content || 
                              data.choices?.[0]?.text ||
                              data.content ||
                              '';
                if (content) {
                  onChunk(content);
                }
              } catch (parseError) {
                // Ignore parse errors for final chunk
              }
            }
          }
        }

        onComplete();
      } catch (streamError) {
        if (streamError.name === 'AbortError') {
          onComplete(new Error('Request was aborted'));
        } else {
          onComplete(streamError);
        }
      }
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        onComplete(new Error('Request timeout: The API took too long to respond.'));
      } else {
        onComplete(error);
      }
    });

  return controller;
};

/**
 * Chat completion using NVIDIA API (non-streaming, for backward compatibility)
 * @param {string|Array} messages - Single user message string OR array of message objects with role and content
 * @param {string} model - Model to use (default: 'meta/llama-3.1-8b-instruct')
 * @param {object} options - Additional options (max_tokens, temperature, useNoThink, etc.)
 */
export const chatCompletion = async (messages, model = 'meta/llama-3.1-8b-instruct', options = {}) => {
  try {
    // If messages is a string, convert it to array format
    const messageArray = typeof messages === 'string' 
      ? [{ role: 'user', content: messages }]
      : messages;

    // Validate message format
    if (!Array.isArray(messageArray) || messageArray.length === 0) {
      throw new Error('Messages must be a non-empty array or string');
    }

    // Calculate max_tokens based on conversation length (more tokens for longer conversations)
    const conversationLength = messageArray.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
    const defaultMaxTokens = conversationLength > 1000 ? 2048 : 1024;
    const maxTokens = options.max_tokens || defaultMaxTokens;

    // Check if we should use /no_think for faster responses
    // Use it for short requests (less than 500 chars) or if explicitly requested
    const useNoThink = options.useNoThink !== undefined 
      ? options.useNoThink 
      : conversationLength < 500 && messageArray.length <= 2;

    // Prepare messages array - add system message with /no_think if needed
    let finalMessages = [...messageArray];
  
    // Insert system message at the beginning
    finalMessages = [
      { role: 'system', content: '/no_think' },
      ...messageArray
    ];

    // Set parameters for faster responses when using no_think
    const temperature = useNoThink ? 0 : (options.temperature || 0.7);
    const topP = useNoThink ? 1 : (options.top_p || 0.9);
    const frequencyPenalty = options.frequency_penalty || 0;
    const presencePenalty = options.presence_penalty || 0;

    const requestBody = {
      model,
      messages: finalMessages,
      temperature,
      top_p: topP,
      max_tokens: maxTokens,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stream: false,
    };

    // Add timeout to the fetch request (longer for file uploads)
    const controller = new AbortController();
    // Check if message contains file content (indicated by PDF or Image markers)
    const hasFileContent = messageArray.some(msg => 
      msg.content && (
        msg.content.includes('[PDF Content') || 
        msg.content.includes('[Image:') ||
        msg.content.includes('--- Page')
      )
    );
    const timeoutDuration = hasFileContent ? 120000 : 60000; // 120 seconds for files, 60 for regular
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    try {
      const response = await nvidiaApiRequest('/chat/completions', {
        method: 'POST',
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: The API took too long to respond. The PDF might be too large. Try asking about a specific section or page, or upload a smaller file.');
      }
      throw error;
    }
  } catch (error) {
    console.error('Chat completion error:', error);
    throw error;
  }
};

/**
 * YouTube API configuration
 */
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Get YouTube API key from environment variables
 */
export const getYoutubeApiKey = () => {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not found. Please set VITE_YOUTUBE_API_KEY in your .env file');
    return null;
  }
  return YOUTUBE_API_KEY;
};

/**
 * Search for YouTube videos
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results (default: 5)
 */
export const searchYouTubeVideos = async (query, maxResults = 5) => {
  const apiKey = getYoutubeApiKey();
  if (!apiKey) {
    throw new Error('YouTube API key is not configured');
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `YouTube API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    
    return data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (error) {
    console.error('YouTube search error:', error);
    throw error;
  }
};


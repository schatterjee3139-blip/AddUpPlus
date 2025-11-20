/**
 * File processing utilities for AI chatbot
 */

/**
 * Load PDF.js library dynamically
 */
const loadPDFJS = async () => {
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  // Try to load from CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      // Set worker
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
    document.head.appendChild(script);
  });
};

/**
 * Extract text from PDF file
 * @param {File} file - PDF file
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    try {
      // Try to load and use PDF.js
      const pdfjsLib = await loadPDFJS();
      
      if (pdfjsLib) {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';
        
        // Limit to first 5 pages and 8000 characters to avoid timeout
        const maxPages = Math.min(pdf.numPages, 5);
        const maxChars = 8000;
        
        for (let i = 1; i <= maxPages && fullText.length < maxChars; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          const pageContent = `\n--- Page ${i} ---\n${pageText}\n`;
          
          // Check if adding this page would exceed the limit
          if (fullText.length + pageContent.length > maxChars) {
            const remaining = maxChars - fullText.length;
            fullText += pageContent.substring(0, remaining);
            fullText += '\n[Content truncated due to length...]';
            break;
          }
          
          fullText += pageContent;
        }
        
        if (pdf.numPages > maxPages) {
          fullText += `\n[Note: PDF has ${pdf.numPages} pages. Only first ${maxPages} pages extracted. If you need more content, please ask about specific pages or sections.]`;
        }
        
        return fullText.trim() || 'Unable to extract text from PDF. Please describe the content.';
      }
    } catch (error) {
      console.warn('PDF.js extraction failed, using fallback:', error);
    }
    
    // Fallback: Return a message indicating PDF was uploaded
    return `[PDF file uploaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB). Please describe the content or ask questions about it, and I'll help you analyze it.]`;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return `[PDF file uploaded: ${file.name}. Error reading PDF. Please describe the content or ask questions about it.]`;
  }
};

/**
 * Convert image file to base64 data URL
 * @param {File} file - Image file
 * @returns {Promise<string>} Base64 data URL
 */
export const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Process uploaded file and return content
 * @param {File} file - File to process
 * @returns {Promise<{type: string, content: string, name: string, preview?: string}>}
 */
export const processFile = async (file) => {
  const fileType = file.type;
  const fileName = file.name;
  
  // Check file size (limit to 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds 10MB limit. Please upload a smaller file.`);
  }
  
  if (fileType === 'application/pdf') {
    const text = await extractTextFromPDF(file);
    return {
      type: 'pdf',
      content: text,
      name: fileName,
      preview: `📄 ${fileName}`,
    };
  } else if (fileType.startsWith('image/')) {
    const base64 = await imageToBase64(file);
    return {
      type: 'image',
      content: base64,
      name: fileName,
      preview: base64, // Use base64 as preview for images
    };
  } else {
    throw new Error(`Unsupported file type: ${fileType}. Please upload a PDF or image file.`);
  }
};

/**
 * Format file content for AI message
 * @param {object} fileData - Processed file data
 * @param {string} userMessage - User's text message
 * @returns {string} Formatted message for AI
 */
export const formatMessageWithFile = (fileData, userMessage) => {
  if (fileData.type === 'pdf') {
    return `${userMessage}\n\n[PDF Content from ${fileData.name}]:\n${fileData.content}`;
  } else if (fileData.type === 'image') {
    // For images, we'll include the base64 in the message
    // The AI model needs to support vision to process this
    return `${userMessage}\n\n[Image: ${fileData.name}]`;
  }
  return userMessage;
};


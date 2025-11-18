// Utility function to merge Tailwind classes, similar to shadcn/ui
export const cn = (...inputs) => {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ');
};

/**
 * Strip markdown formatting from text to make it display as plain text
 * Removes: **bold**, *italic*, `code`, # headers, etc.
 */
export const stripMarkdown = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // Remove bold (**text** or __text__)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Remove italic (*text* or _text_)
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove inline code (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove headers (# Header)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove strikethrough (~~text~~)
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove images ![alt](url) -> alt
    .replace(/!\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    .replace(/^\*\*\*+$/gm, '')
    // Remove blockquotes (> text)
    .replace(/^>\s+/gm, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};



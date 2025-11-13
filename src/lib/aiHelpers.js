import { chatCompletion } from './api';

/**
 * Generate flashcards from content
 */
export const generateFlashcards = async (content, count = 5) => {
  const prompt = `Generate ${count} flashcards based on this content. Format each flashcard as:
Front: [question]
Back: [answer]

Content: ${content.substring(0, 2000)}`;
  
  const response = await chatCompletion(prompt);
  return response.choices?.[0]?.message?.content || response.content || '';
};

/**
 * Summarize content
 */
export const summarizeContent = async (content) => {
  const prompt = `Summarize the following content in 3-5 bullet points:\n\n${content.substring(0, 2000)}`;
  
  const response = await chatCompletion(prompt);
  return response.choices?.[0]?.message?.content || response.content || '';
};

/**
 * Explain a concept in simple terms
 */
export const explainConcept = async (concept) => {
  const prompt = `Explain "${concept}" in simple, easy-to-understand terms. Use examples if helpful.`;
  
  const response = await chatCompletion(prompt);
  return response.choices?.[0]?.message?.content || response.content || '';
};

/**
 * Simplify content
 */
export const simplifyContent = async (content) => {
  const prompt = `Simplify and rewrite the following content to make it easier to understand:\n\n${content.substring(0, 2000)}`;
  
  const response = await chatCompletion(prompt);
  return response.choices?.[0]?.message?.content || response.content || '';
};

/**
 * Generate quiz questions from content
 */
export const generateQuizQuestions = async (content, count = 5) => {
  const prompt = `Generate ${count} quiz questions based on this content. Format as:
1. [Question]
   A) [Option 1]
   B) [Option 2]
   C) [Option 3]
   D) [Option 4]
   Correct: [Letter]

Content: ${content.substring(0, 2000)}`;
  
  const response = await chatCompletion(prompt);
  return response.choices?.[0]?.message?.content || response.content || '';
};

/**
 * Suggest related concepts for concept map
 */
export const suggestConcepts = async (currentConcepts) => {
  const prompt = `Based on these concepts: ${currentConcepts.join(', ')}, suggest 3-5 related concepts that could be added to a concept map. List them one per line.`;
  
  const response = await chatCompletion(prompt);
  return response.choices?.[0]?.message?.content || response.content || '';
};


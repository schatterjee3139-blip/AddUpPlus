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

/**
 * Generate a comprehensive study plan
 * @param {string} examDate - Exam date in YYYY-MM-DD format
 * @param {string} topics - Comma-separated list of topics
 * @param {string} stressLevel - Low, Medium, or High
 * @returns {Promise<string>} - JSON string with study plan
 */
export const generateStudyPlan = async (examDate, topics, stressLevel = 'Medium') => {
  const today = new Date();
  const exam = new Date(examDate);
  const daysUntilExam = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  
  const stressGuidance = {
    Low: 'Create a relaxed schedule with plenty of breaks and review time. Focus on understanding concepts deeply.',
    Medium: 'Create a balanced schedule with regular study sessions and adequate breaks. Mix review and new material.',
    High: 'Create an intensive schedule with focused study blocks. Prioritize high-impact topics and frequent reviews.'
  };

  const prompt = `You are an expert study planner. Create a comprehensive study schedule for an exam.

Exam Date: ${examDate}
Days Until Exam: ${daysUntilExam}
Topics to Cover: ${topics}
Stress Level: ${stressLevel}
${stressGuidance[stressLevel] || stressGuidance.Medium}

Generate a detailed study plan as a JSON array. Each item should have:
- date: YYYY-MM-DD format
- time: recommended time (e.g., "9:00 AM", "2:00 PM")
- topic: specific topic to study
- duration: study duration in minutes (30-120)
- type: "review", "new-material", "practice", "break", or "assessment"
- description: brief description of what to do

Requirements:
- Distribute topics evenly across available days
- Include regular review sessions
- Add breaks every 1-2 hours
- Include practice/assessment days before the exam
- For high stress: more frequent sessions, shorter breaks
- For low stress: fewer sessions, longer breaks
- Make the schedule realistic and achievable

Return ONLY valid JSON array, no markdown, no code blocks, no explanations. Example format:
[
  {
    "date": "2024-01-15",
    "time": "9:00 AM",
    "topic": "Algebra Basics",
    "duration": 60,
    "type": "new-material",
    "description": "Study algebraic equations and practice problems"
  }
]`;

  const response = await chatCompletion(prompt);
  const content = response.choices?.[0]?.message?.content || response.content || '';
  
  // Try to extract JSON from the response (in case it's wrapped in markdown)
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```\n?/g, '').trim();
  }
  
  return jsonStr;
};

/**
 * Analyze teacher profile from uploaded materials
 * @param {Object} teacher - Teacher object with name, subject, files
 * @param {string} content - Extracted text from all uploaded files
 * @returns {Promise<Object>} Analysis object with teacher patterns
 */
export const analyzeTeacherProfile = async (teacher, content) => {
  const prompt = `You are an expert educational analyst. Analyze the following teacher materials to learn their teaching, testing, and grading patterns.

Teacher: ${teacher.name}
Subject: ${teacher.subject || teacher.courseName}
School: ${teacher.school}

Uploaded Materials Content:
${content.substring(0, 15000)}

Analyze and return a JSON object with the following structure:
{
  "questionStyle": {
    "mcqRatio": 0.0-1.0,
    "frqRatio": 0.0-1.0,
    "trickQuestionFrequency": "low/medium/high",
    "vocabDifficulty": "low/medium/high",
    "preferredPhrasing": ["list of common phrases"],
    "distractorPatterns": "description",
    "apStyle": true/false
  },
  "difficultyLevel": "low/medium/high",
  "difficultyCharacteristics": {
    "testsObscureDetails": true/false,
    "recallVsApplication": "recall/application/balanced",
    "usesChartsMapsGraphs": true/false,
    "twoPartQuestions": true/false,
    "prioritizesReasoning": true/false,
    "recyclesQuestionTypes": true/false
  },
  "topicWeighting": {
    "highPriorityTopics": ["list of topics"],
    "recurringTopics": ["list of topics"],
    "depthByTopic": {}
  },
  "gradingStyle": {
    "strictness": "strict/lenient/moderate",
    "focusesOnKeywords": true/false,
    "penalizesMathErrors": true/false,
    "allowsPartialCredit": true/false,
    "prefersFullSentences": true/false,
    "apRubricAlignment": true/false
  },
  "explanationStyle": {
    "usesAnalogies": true/false,
    "stepByStep": true/false,
    "commonExamples": ["list of examples"],
    "teachingOrder": "description"
  },
  "strengths": ["list of strengths"],
  "weaknesses": ["list of weaknesses"],
  "likelyTestStyle": "description",
  "watchOutFor": ["list of things to watch for"]
}

Return ONLY valid JSON, no markdown, no code blocks, no explanations.`;

  const response = await chatCompletion(prompt);
  const contentStr = response.choices?.[0]?.message?.content || response.content || '';
  
  // Extract JSON
  let jsonStr = contentStr.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```\n?/g, '').trim();
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing teacher analysis:', error);
    // Return default structure if parsing fails
    return {
      questionStyle: {},
      difficultyLevel: 'medium',
      difficultyCharacteristics: {},
      topicWeighting: {},
      gradingStyle: {},
      explanationStyle: {},
      strengths: [],
      weaknesses: [],
      likelyTestStyle: '',
      watchOutFor: [],
    };
  }
};

/**
 * Generate teacher-specific content
 * @param {Object} teacher - Teacher object with analysis
 * @param {string} type - Type of content: 'practice-questions', 'study-guide', 'test-prediction', 'essay-grader'
 * @returns {Promise<string>} Generated content
 */
export const generateTeacherSpecificContent = async (teacher, type) => {
  const analysis = teacher.analysis || {};
  
  let prompt = '';
  
  switch (type) {
    case 'practice-questions':
      prompt = `Generate 10 practice questions in the style of ${teacher.name} (${teacher.subject}).

Based on the teacher's patterns:
- Question style: ${JSON.stringify(analysis.questionStyle || {})}
- Difficulty: ${analysis.difficultyLevel || 'medium'}
- Preferred phrasing: ${analysis.questionStyle?.preferredPhrasing?.join(', ') || 'standard'}

Create questions that match their exact style, tone, difficulty, and phrasing. 

IMPORTANT: Format EXACTLY as follows (one question per block):
1. [Question text here]
A) [Option A text]
B) [Option B text]
C) [Option C text]
D) [Option D text]
Correct: [A, B, C, or D]
Explanation: [Brief explanation of why this is correct]

2. [Next question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct: [Letter]
Explanation: [Explanation]

Continue this format for all 10 questions.`;
      break;
      
    case 'study-guide':
      prompt = `Create a study guide for ${teacher.name}'s ${teacher.subject} class.

Based on their teaching patterns:
- Topics they emphasize: ${analysis.topicWeighting?.highPriorityTopics?.join(', ') || 'all topics'}
- How they explain: ${JSON.stringify(analysis.explanationStyle || {})}
- What they test: ${analysis.likelyTestStyle || 'standard format'}

IMPORTANT: Format with clear sections and bullet points:

1. [Section Title]
   • [Key point 1]
   • [Key point 2]
   • [Key point 3]

2. [Next Section Title]
   • [Key point]
   • [Key point]

Use numbered sections (1., 2., 3.) and bullet points (•) for key information.`;
      break;
      
    case 'test-prediction':
      prompt = `Predict the upcoming test for ${teacher.name}'s ${teacher.subject} class.

Based on patterns:
- Topic weighting: ${JSON.stringify(analysis.topicWeighting || {})}
- Question style: ${JSON.stringify(analysis.questionStyle || {})}
- Recurring topics: ${analysis.topicWeighting?.recurringTopics?.join(', ') || 'none identified'}

IMPORTANT: Format your response with clear probability percentages for each topic/unit.

For each topic, include:
Unit [Number/Name]: [X]% probability
OR
Topic [Name]: [X]% likelihood

Example format:
Unit 1: Introduction: 85%
Unit 2: Core Concepts: 72%
Unit 3: Applications: 45%
Unit 4: Advanced Topics: 23%

Provide at least 5-8 topics with their probability percentages. Make sure to include the percentage symbol (%) after each number.`;
      break;
      
    case 'essay-grader':
      prompt = `Grade an essay like ${teacher.name} would.

Based on their grading style:
- Strictness: ${analysis.gradingStyle?.strictness || 'moderate'}
- Focus areas: ${analysis.gradingStyle?.focusesOnKeywords ? 'keywords' : 'content'}
- Partial credit: ${analysis.gradingStyle?.allowsPartialCredit ? 'yes' : 'no'}
- Format preference: ${analysis.gradingStyle?.prefersFullSentences ? 'full sentences' : 'flexible'}

IMPORTANT: Format your response clearly:

Score: [X]/[Y] or [X]% or [X] points

Strengths:
- [What was done well]
- [Specific positive feedback]

Areas for Improvement:
- [What needs work]
- [Specific suggestions]

[Additional detailed feedback paragraphs]

Use clear section headers: "Strengths:", "Areas for Improvement:", etc.`;
      break;
      
    default:
      prompt = `Generate study material for ${teacher.name}'s ${teacher.subject} class based on their teaching patterns.`;
  }
  
  const response = await chatCompletion(prompt);
  return response.choices?.[0]?.message?.content || response.content || '';
};


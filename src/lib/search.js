import { COURSE_CATALOG } from '../contexts/CourseCatalogContext';

/**
 * Search across all app content
 * @param {string} query - Search query
 * @param {object} userData - User's data from Firebase/localStorage
 * @returns {Array} Search results with type, title, description, and navigation info
 */
export const searchAppContent = (query, userData = {}) => {
  if (!query || query.trim().length < 2) return [];

  const searchTerm = query.toLowerCase().trim();
  const results = [];

  // Search courses
  COURSE_CATALOG.forEach((course) => {
    const courseText = `${course.name} ${course.summary} ${course.focus}`.toLowerCase();
    if (courseText.includes(searchTerm)) {
      results.push({
        id: `course-${course.id}`,
        type: 'course',
        title: course.name,
        description: course.summary,
        page: 'courses',
        courseId: course.id,
        icon: 'BookOpen',
      });
    }
  });

  // Search goals
  if (userData.goals && Array.isArray(userData.goals)) {
    userData.goals.forEach((goal) => {
      const goalText = `${goal.title} ${goal.target}`.toLowerCase();
      if (goalText.includes(searchTerm)) {
        results.push({
          id: `goal-${goal.id}`,
          type: 'goal',
          title: goal.title,
          description: `Target: ${goal.target}`,
          page: 'today',
          goalId: goal.id,
          icon: 'Target',
        });
      }
    });
  }

  // Search flashcards
  if (userData.flashcards && userData.flashcards.deck && Array.isArray(userData.flashcards.deck)) {
    userData.flashcards.deck.forEach((card, index) => {
      const cardText = `${card.front} ${card.back}`.toLowerCase();
      if (cardText.includes(searchTerm)) {
        results.push({
          id: `flashcard-${card.id || index}`,
          type: 'flashcard',
          title: card.front.substring(0, 50),
          description: card.back.substring(0, 100),
          page: 'flashcards',
          cardId: card.id,
          icon: 'Layers',
        });
      }
    });
  }

  // Search workspace content (course modules, lessons, etc.)
  if (userData.courses && userData.courses.courseWorkspaceData) {
    Object.entries(userData.courses.courseWorkspaceData).forEach(([courseId, workspaceData]) => {
      if (workspaceData && typeof workspaceData === 'object') {
        // Search in module content
        if (workspaceData.modules && Array.isArray(workspaceData.modules)) {
          workspaceData.modules.forEach((module, moduleIndex) => {
            const moduleText = `${module.title || ''} ${module.description || ''}`.toLowerCase();
            if (moduleText.includes(searchTerm)) {
              results.push({
                id: `workspace-module-${courseId}-${moduleIndex}`,
                type: 'workspace',
                title: module.title || 'Module',
                description: `Course: ${COURSE_CATALOG.find(c => c.id === courseId)?.name || courseId}`,
                page: 'workspace',
                courseId,
                moduleIndex,
                icon: 'Briefcase',
              });
            }
          });
        }
      }
    });
  }

  // Search workspace detailed content
  if (userData.workspace && userData.workspace.moduleDetailedContent) {
    Object.entries(userData.workspace.moduleDetailedContent).forEach(([key, content]) => {
      if (content && typeof content === 'string') {
        const contentLower = content.toLowerCase();
        if (contentLower.includes(searchTerm)) {
          const [courseId, moduleId] = key.split('-');
          results.push({
            id: `workspace-content-${key}`,
            type: 'workspace',
            title: `Module Content: ${moduleId || 'Unknown'}`,
            description: content.substring(0, 100),
            page: 'workspace',
            courseId,
            moduleId,
            icon: 'Briefcase',
          });
        }
      }
    });
  }

  // Search planner events
  if (userData.planner && userData.planner.eventsByDate) {
    Object.entries(userData.planner.eventsByDate).forEach(([date, events]) => {
      if (Array.isArray(events)) {
        events.forEach((event, index) => {
          const eventText = `${event.title || ''} ${event.notes || ''}`.toLowerCase();
          if (eventText.includes(searchTerm)) {
            results.push({
              id: `planner-${date}-${index}`,
              type: 'planner',
              title: event.title || 'Event',
              description: `Date: ${date}`,
              page: 'planner',
              date,
              eventIndex: index,
              icon: 'Calendar',
            });
          }
        });
      }
    });
  }

  // Search AI chat messages (for context)
  if (userData.aiChat && userData.aiChat.messages && Array.isArray(userData.aiChat.messages)) {
    userData.aiChat.messages.forEach((message, index) => {
      const messageText = message.content.toLowerCase();
      if (messageText.includes(searchTerm)) {
        results.push({
          id: `aichat-${index}`,
          type: 'ai',
          title: 'AI Chat Message',
          description: message.content.substring(0, 100),
          page: null, // AI chat is in sidebar
          icon: 'Sparkles',
        });
      }
    });
  }

  return results.slice(0, 10); // Limit to 10 results
};


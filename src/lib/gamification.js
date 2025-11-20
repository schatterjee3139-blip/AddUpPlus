/**
 * Gamification system: XP, Levels, and Badges
 */

// XP values for different activities
export const XP_VALUES = {
  FLASHCARD_REVIEW: 5,
  FLASHCARD_CORRECT: 10,
  QUIZ_COMPLETE: 25,
  QUIZ_PERFECT: 50, // 100% score
  STUDY_MINUTE: 1, // 1 XP per minute
  AI_INTERACTION: 3,
  DAILY_STREAK: 10, // Bonus for daily streak
};

// Level calculation: XP required for each level
// Formula: XP = 100 * level^1.5 (rounded)
export const getXPForLevel = (level) => {
  return Math.round(100 * Math.pow(level, 1.5));
};

// Calculate level from total XP
export const getLevelFromXP = (totalXP) => {
  if (totalXP < 0) return 1;
  
  let level = 1;
  while (getXPForLevel(level + 1) <= totalXP) {
    level++;
  }
  return level;
};

// Get XP progress for current level
export const getXPProgress = (totalXP) => {
  const currentLevel = getLevelFromXP(totalXP);
  const xpForCurrentLevel = getXPForLevel(currentLevel);
  const xpForNextLevel = getXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = totalXP - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  const progress = (xpInCurrentLevel / xpNeededForNext) * 100;
  
  return {
    level: currentLevel,
    currentXP: xpInCurrentLevel,
    nextLevelXP: xpNeededForNext,
    progress: Math.min(100, Math.max(0, progress)),
    totalXP,
  };
};

// Badge definitions
export const BADGES = {
  // Study time badges
  STUDY_NOVICE: {
    id: 'study_novice',
    name: 'Study Novice',
    description: 'Study for 1 hour total',
    icon: '📚',
    condition: (metrics) => metrics.studyMinutes >= 60,
  },
  STUDY_SCHOLAR: {
    id: 'study_scholar',
    name: 'Study Scholar',
    description: 'Study for 10 hours total',
    icon: '🎓',
    condition: (metrics) => metrics.studyMinutes >= 600,
  },
  STUDY_MASTER: {
    id: 'study_master',
    name: 'Study Master',
    description: 'Study for 50 hours total',
    icon: '👑',
    condition: (metrics) => metrics.studyMinutes >= 3000,
  },
  
  // Flashcard badges
  FLASHCARD_BEGINNER: {
    id: 'flashcard_beginner',
    name: 'Flashcard Beginner',
    description: 'Review 10 flashcards',
    icon: '📇',
    condition: (metrics) => metrics.flashcardsReviewed >= 10,
  },
  FLASHCARD_PRO: {
    id: 'flashcard_pro',
    name: 'Flashcard Pro',
    description: 'Review 100 flashcards',
    icon: '📊',
    condition: (metrics) => metrics.flashcardsReviewed >= 100,
  },
  FLASHCARD_MASTER: {
    id: 'flashcard_master',
    name: 'Flashcard Master',
    description: 'Review 500 flashcards',
    icon: '🏆',
    condition: (metrics) => metrics.flashcardsReviewed >= 500,
  },
  
  // Quiz badges
  QUIZ_STARTER: {
    id: 'quiz_starter',
    name: 'Quiz Starter',
    description: 'Complete 5 quizzes',
    icon: '✅',
    condition: (metrics) => metrics.quizzesCompleted >= 5,
  },
  QUIZ_CHAMPION: {
    id: 'quiz_champion',
    name: 'Quiz Champion',
    description: 'Complete 25 quizzes',
    icon: '🥇',
    condition: (metrics) => metrics.quizzesCompleted >= 25,
  },
  ZERO_MISTAKE_QUIZ: {
    id: 'zero_mistake_quiz',
    name: 'Zero Mistake Quiz',
    description: 'Get 100% on a quiz',
    icon: '💯',
    condition: (metrics, derived) => {
      if (metrics.quizzesCompleted === 0) return false;
      return derived.averageQuizScore === 100 && metrics.totalQuizQuestions > 0;
    },
  },
  
  // Subject-specific badges (example)
  MASTER_OF_DERIVATIVES: {
    id: 'master_derivatives',
    name: 'Master of Derivatives',
    description: 'Complete 10 calculus quizzes with 90%+ accuracy',
    icon: '📐',
    condition: (metrics, derived, custom) => {
      // This would need custom tracking for subject-specific achievements
      // For now, we'll use a placeholder
      return custom?.calculusQuizzes >= 10 && custom?.calculusAccuracy >= 90;
    },
  },
  
  // Streak badges
  STREAK_WARRIOR_7: {
    id: 'streak_warrior_7',
    name: '7-Day Streak Warrior',
    description: 'Study for 7 days in a row',
    icon: '🔥',
    condition: (metrics) => {
      const dailyStudyTime = metrics.dailyStudyTime || {};
      const dates = Object.keys(dailyStudyTime).sort();
      if (dates.length < 7) return false;
      
      // Check if last 7 days have study time
      const today = new Date();
      let consecutiveDays = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        if (dailyStudyTime[dateStr] && dailyStudyTime[dateStr] > 0) {
          consecutiveDays++;
        }
      }
      return consecutiveDays >= 7;
    },
  },
  STREAK_WARRIOR_30: {
    id: 'streak_warrior_30',
    name: '30-Day Streak Warrior',
    description: 'Study for 30 days in a row',
    icon: '⚡',
    condition: (metrics) => {
      const dailyStudyTime = metrics.dailyStudyTime || {};
      const dates = Object.keys(dailyStudyTime).sort();
      if (dates.length < 30) return false;
      
      const today = new Date();
      let consecutiveDays = 0;
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        if (dailyStudyTime[dateStr] && dailyStudyTime[dateStr] > 0) {
          consecutiveDays++;
        }
      }
      return consecutiveDays >= 30;
    },
  },
  
  // Grammar/Subject badges (example)
  GRAMMAR_GURU: {
    id: 'grammar_guru',
    name: 'Grammar Guru',
    description: 'Complete 20 grammar quizzes with 95%+ accuracy',
    icon: '✍️',
    condition: (metrics, derived, custom) => {
      return custom?.grammarQuizzes >= 20 && custom?.grammarAccuracy >= 95;
    },
  },
  
  // Level badges
  LEVEL_5: {
    id: 'level_5',
    name: 'Level 5 Achiever',
    description: 'Reach Level 5',
    icon: '⭐',
    condition: (metrics, derived, custom, xpProgress) => {
      return xpProgress?.level >= 5;
    },
  },
  LEVEL_10: {
    id: 'level_10',
    name: 'Level 10 Master',
    description: 'Reach Level 10',
    icon: '🌟',
    condition: (metrics, derived, custom, xpProgress) => {
      return xpProgress?.level >= 10;
    },
  },
  LEVEL_20: {
    id: 'level_20',
    name: 'Level 20 Legend',
    description: 'Reach Level 20',
    icon: '💫',
    condition: (metrics, derived, custom, xpProgress) => {
      return xpProgress?.level >= 20;
    },
  },
};

// Calculate total XP from metrics
export const calculateTotalXP = (metrics) => {
  let totalXP = 0;
  
  // XP from flashcards
  totalXP += metrics.flashcardsReviewed * XP_VALUES.FLASHCARD_REVIEW;
  totalXP += metrics.flashcardsCorrect * XP_VALUES.FLASHCARD_CORRECT;
  
  // XP from quizzes
  totalXP += metrics.quizzesCompleted * XP_VALUES.QUIZ_COMPLETE;
  
  // Check for perfect quizzes (100% accuracy)
  if (metrics.totalQuizQuestions > 0) {
    const accuracy = (metrics.totalQuizCorrect / metrics.totalQuizQuestions) * 100;
    if (accuracy === 100 && metrics.quizzesCompleted > 0) {
      totalXP += metrics.quizzesCompleted * XP_VALUES.QUIZ_PERFECT;
    }
  }
  
  // XP from study time (1 XP per minute)
  totalXP += metrics.studyMinutes * XP_VALUES.STUDY_MINUTE;
  
  // XP from AI interactions
  totalXP += metrics.aiInteractions * XP_VALUES.AI_INTERACTION;
  
  // Bonus XP for daily streaks
  const dailyStudyTime = metrics.dailyStudyTime || {};
  const dates = Object.keys(dailyStudyTime).sort();
  let consecutiveDays = 0;
  const today = new Date();
  
  for (let i = 0; i < Math.min(30, dates.length); i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    if (dailyStudyTime[dateStr] && dailyStudyTime[dateStr] > 0) {
      consecutiveDays++;
    } else {
      break;
    }
  }
  
  if (consecutiveDays >= 7) {
    totalXP += consecutiveDays * XP_VALUES.DAILY_STREAK;
  }
  
  return Math.max(0, totalXP);
};

// Check which badges the user has earned
export const checkBadges = (metrics, derived, custom = {}, xpProgress = null) => {
  const earnedBadges = [];
  
  // Calculate XP progress if not provided
  if (!xpProgress) {
    const totalXP = calculateTotalXP(metrics);
    xpProgress = getXPProgress(totalXP);
  }
  
  // Check each badge
  Object.values(BADGES).forEach((badge) => {
    try {
      if (badge.condition(metrics, derived, custom, xpProgress)) {
        earnedBadges.push(badge);
      }
    } catch (error) {
      console.warn(`Error checking badge ${badge.id}:`, error);
    }
  });
  
  return earnedBadges;
};

// Get newly earned badges (compare old and new badge lists)
export const getNewBadges = (oldBadges, newBadges) => {
  const oldBadgeIds = new Set(oldBadges.map(b => b.id));
  return newBadges.filter(badge => !oldBadgeIds.has(badge.id));
};


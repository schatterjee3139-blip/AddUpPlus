import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const defaultMetrics = {
  flashcardsReviewed: 0,
  flashcardsCorrect: 0,
  quizzesCompleted: 0,
  totalQuizQuestions: 0,
  totalQuizCorrect: 0,
  aiInteractions: 0,
  studyMinutes: 0,
};

const StudyMetricsContext = createContext(null);

export const StudyMetricsProvider = ({ children }) => {
  const [metrics, setMetrics] = useState(() => {
    try {
      const stored = localStorage.getItem('studyMetrics');
      return stored ? JSON.parse(stored) : defaultMetrics;
    } catch (error) {
      console.warn('Failed to load study metrics from storage', error);
      return defaultMetrics;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyMetrics', JSON.stringify(metrics));
    } catch (error) {
      console.warn('Failed to persist study metrics', error);
    }
  }, [metrics]);

  const recordFlashcardReview = (isCorrect) => {
    setMetrics((prev) => ({
      ...prev,
      flashcardsReviewed: prev.flashcardsReviewed + 1,
      flashcardsCorrect: prev.flashcardsCorrect + (isCorrect ? 1 : 0),
    }));
  };

  const recordQuizResult = (correctAnswers, totalQuestions) => {
    setMetrics((prev) => ({
      ...prev,
      quizzesCompleted: prev.quizzesCompleted + 1,
      totalQuizQuestions: prev.totalQuizQuestions + totalQuestions,
      totalQuizCorrect: prev.totalQuizCorrect + correctAnswers,
    }));
  };

  const recordAIInteraction = () => {
    setMetrics((prev) => ({
      ...prev,
      aiInteractions: prev.aiInteractions + 1,
    }));
  };

  const recordStudyMinutes = (minutes) => {
    if (!minutes) return;
    setMetrics((prev) => ({
      ...prev,
      studyMinutes: prev.studyMinutes + minutes,
    }));
  };

  const resetMetrics = () => {
    setMetrics(defaultMetrics);
  };

  const derived = useMemo(() => {
    const flashcardAccuracy = metrics.flashcardsReviewed
      ? Math.round((metrics.flashcardsCorrect / metrics.flashcardsReviewed) * 100)
      : 0;
    const averageQuizScore = metrics.totalQuizQuestions
      ? Math.round((metrics.totalQuizCorrect / metrics.totalQuizQuestions) * 100)
      : 0;

    return {
      flashcardAccuracy,
      averageQuizScore,
    };
  }, [metrics]);

  return (
    <StudyMetricsContext.Provider
      value={{
        metrics,
        derived,
        recordFlashcardReview,
        recordQuizResult,
        recordAIInteraction,
        recordStudyMinutes,
        resetMetrics,
      }}
    >
      {children}
    </StudyMetricsContext.Provider>
  );
};

export const useStudyMetrics = () => {
  const context = useContext(StudyMetricsContext);
  if (!context) {
    throw new Error('useStudyMetrics must be used within a StudyMetricsProvider');
  }
  return context;
};

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Edit,
  Trash2,
  Plus,
  Clock,
  BookOpen,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useStudyMetrics } from '../contexts/StudyMetricsContext.jsx';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { subscribeToUserData, updateUserData, initializeUserData } from '../lib/firestore';

const ProgressRing = ({ percentage, color, label, helper }) => (
  <div className="flex flex-col items-center space-y-2">
    <div className="relative h-24 w-24">
      <svg className="h-full w-full" viewBox="0 0 100 100">
        <circle
          className="stroke-current text-secondary"
          strokeWidth="10"
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
        />
        <motion.circle
          className={cn('stroke-current', color)}
          strokeWidth="10"
          strokeLinecap="round"
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
          strokeDasharray="251.2"
          strokeDashoffset={251.2 - (percentage / 100) * 251.2}
          initial={{ strokeDashoffset: 251.2 }}
          animate={{ strokeDashoffset: 251.2 - (percentage / 100) * 251.2 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{percentage}%</span>
      </div>
    </div>
    <span className="text-sm font-medium text-muted-foreground text-center">
      {label}
      {helper ? <span className="block text-xs text-muted-foreground/80">{helper}</span> : null}
    </span>
  </div>
);

export const Dashboard = ({ onNavigate }) => {
  const { metrics, derived } = useStudyMetrics();
  const { currentUser } = useAuth();

  // Get user's first name
  const getUserFirstName = () => {
    if (!currentUser) return 'there';
    if (currentUser.displayName) {
      return currentUser.displayName.split(' ')[0];
    }
    if (currentUser.email) {
      return currentUser.email.split('@')[0];
    }
    return 'there';
  };

  const stats = useMemo(() => {
    const reviewGoal = 20; // cards per day
    const studyGoalMinutes = 300; // 5 hours
    const weeklyGoalUnits = 30; // combination metric

    const reviewProgress = Math.min(100, Math.round((metrics.flashcardsReviewed / reviewGoal) * 100));
    const hoursStudied = metrics.studyMinutes / 60;
    const hoursProgress = Math.min(100, Math.round((metrics.studyMinutes / studyGoalMinutes) * 100));
    const weeklyProgress = Math.min(100, Math.round(((metrics.flashcardsReviewed + metrics.quizzesCompleted * 5) / weeklyGoalUnits) * 100));

    return {
      reviewProgress: isNaN(reviewProgress) ? 0 : reviewProgress,
      hoursProgress: isNaN(hoursProgress) ? 0 : hoursProgress,
      weeklyProgress: isNaN(weeklyProgress) ? 0 : weeklyProgress,
      hoursStudied: hoursStudied.toFixed(1),
    };
  }, [metrics]);

  return (
    <>
      <div className="p-4 md:p-6 space-y-6">
    {/* Hero Card */}
    <Card className="bg-gradient-to-r from-primary/10 to-transparent">
      <CardHeader>
        <CardTitle as="h1" className="text-3xl">
          Welcome back, {getUserFirstName()} 👋
        </CardTitle>
        <CardDescription>
          You're on a <strong>{metrics.quizzesCompleted || metrics.flashcardsReviewed ? metrics.quizzesCompleted + metrics.flashcardsReviewed : 0}-task streak!</strong> Keep up the great work.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Study Time</p>
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{(metrics.studyMinutes / 60).toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground mt-1">{metrics.studyMinutes} minutes</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Flashcards Reviewed</p>
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{metrics.flashcardsReviewed}</p>
              <p className="text-xs text-muted-foreground mt-1">{derived.flashcardAccuracy}% accuracy</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Quizzes Completed</p>
                <CheckCircle className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{metrics.quizzesCompleted}</p>
              <p className="text-xs text-muted-foreground mt-1">{derived.averageQuizScore}% average</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">AI Interactions</p>
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{metrics.aiInteractions}</p>
              <p className="text-xs text-muted-foreground mt-1">Questions asked</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>

    {/* Goals Section */}
    <GoalsSection currentUser={currentUser} />
  </div>
  </>
  );
};

const GoalsSection = ({ currentUser }) => {
  const { currentUser: firebaseUser } = useAuth();
  const [goals, setGoals] = useState(() => {
    if (typeof window === 'undefined') return [];
    if (!firebaseUser) {
      try {
        const stored = window.localStorage.getItem('userGoals');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalType, setNewGoalType] = useState('study'); // 'study', 'quiz', 'flashcard', 'custom'

  // Load goals from Firebase
  useEffect(() => {
    if (!firebaseUser) {
      try {
        const stored = window.localStorage.getItem('userGoals');
        if (stored) {
          setGoals(JSON.parse(stored));
        }
      } catch {
        // Ignore
      }
      return;
    }

    const initializeAndSubscribe = async () => {
      try {
        await initializeUserData(firebaseUser.uid, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });

        const unsubscribe = subscribeToUserData(firebaseUser.uid, (userData) => {
          if (userData && userData.goals) {
            setGoals(userData.goals || []);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading goals:', error);
        return () => {};
      }
    };

    let unsubscribe;
    initializeAndSubscribe().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseUser]);

  // Save goals to Firebase or localStorage
  useEffect(() => {
    if (firebaseUser) {
      updateUserData(firebaseUser.uid, { goals }).catch(console.error);
    } else {
      try {
        window.localStorage.setItem('userGoals', JSON.stringify(goals));
      } catch (error) {
        console.warn('Failed to persist goals', error);
      }
    }
  }, [goals, firebaseUser]);

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;

    const newGoal = {
      id: Date.now().toString(),
      title: newGoalTitle.trim(),
      target: newGoalTarget.trim() || 'N/A',
      type: newGoalType,
      createdAt: new Date().toISOString(),
      completed: false,
    };

    setGoals((prev) => [...prev, newGoal]);
    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalType('study');
    setIsAddingGoal(false);
  };

  const handleDeleteGoal = (goalId) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
  };

  const handleToggleGoal = (goalId) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>My Goals</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingGoal(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Goal
          </Button>
        </div>
        <CardDescription>
          Set and track your study goals to stay motivated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingGoal && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal Title</label>
                <Input
                  id="goal-title"
                  name="goal-title"
                  placeholder="e.g., Complete 10 quizzes this week"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddGoal();
                    if (e.key === 'Escape') {
                      setIsAddingGoal(false);
                      setNewGoalTitle('');
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target (optional)</label>
                <Input
                  id="goal-target"
                  name="goal-target"
                  placeholder="e.g., 10 quizzes, 50 flashcards"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddGoal();
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddGoal} className="flex-1">
                  Add Goal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingGoal(false);
                    setNewGoalTitle('');
                    setNewGoalTarget('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {goals.length === 0 && !isAddingGoal ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No goals set yet. Click "Add Goal" to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border border-border bg-card',
                  goal.completed && 'opacity-60'
                )}
              >
                <input
                  type="checkbox"
                  checked={goal.completed}
                  onChange={() => handleToggleGoal(goal.id)}
                  className="h-4 w-4 rounded border-border"
                />
                <div className="flex-1">
                  <div
                    className={cn(
                      'font-medium',
                      goal.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {goal.title}
                  </div>
                  {goal.target && goal.target !== 'N/A' && (
                    <div className="text-sm text-muted-foreground">
                      Target: {goal.target}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteGoal(goal.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


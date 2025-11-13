import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AIModal } from '../components/AIModal';
import { useStudyMetrics } from '../contexts/StudyMetricsContext.jsx';
import { cn } from '../lib/utils';

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
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const { metrics, derived } = useStudyMetrics();

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
          Welcome back, Cameron 👋
        </CardTitle>
        <CardDescription>
          You're on a <strong>{metrics.quizzesCompleted || metrics.flashcardsReviewed ? metrics.quizzesCompleted + metrics.flashcardsReviewed : 0}-task streak!</strong> Keep up the great work.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center gap-6">
        <ProgressRing
          percentage={stats.reviewProgress}
          color="text-green-500"
          label="Today's Review"
          helper={`${metrics.flashcardsReviewed} cards`}
        />
        <ProgressRing
          percentage={stats.hoursProgress}
          color="text-blue-500"
          label="Hours Studied"
          helper={`${stats.hoursStudied} hrs`}
        />
        <ProgressRing
          percentage={stats.weeklyProgress}
          color="text-yellow-500"
          label="Weekly Goal"
          helper={`${metrics.quizzesCompleted} quizzes`}
        />
      </CardContent>
    </Card>

    {/* Quick Actions */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button
        variant="outline"
        className="h-auto p-4 flex-col gap-2 text-left"
        onClick={() => onNavigate('quizzes')}
      >
        <CheckSquare className="h-6 w-6 text-primary" />
        <span className="font-semibold">Take Quiz</span>
        <span className="text-xs text-muted-foreground">{metrics.quizzesCompleted} completed</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-4 flex-col gap-2 text-left"
        onClick={() => onNavigate('notes')}
      >
        <FileText className="h-6 w-6 text-primary" />
        <span className="font-semibold">Write Note</span>
        <span className="text-xs text-muted-foreground">Organize your thoughts</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto p-4 flex-col gap-2 text-left"
        onClick={() => onNavigate('planner')}
      >
        <Clock className="h-6 w-6 text-primary" />
        <span className="font-semibold">Start Pomodoro</span>
        <span className="text-xs text-muted-foreground">25 min focus</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto p-4 flex-col gap-2 text-left"
        onClick={() => setIsAIModalOpen(true)}
      >
        <Sparkles className="h-6 w-6 text-primary" />
        <span className="font-semibold">Ask AI</span>
        <span className="text-xs text-muted-foreground">General question</span>
      </Button>
    </div>

  </div>
  
  <AIModal
    isOpen={isAIModalOpen}
    onClose={() => setIsAIModalOpen(false)}
    title="Ask AI - General Question"
  />
  </>
  );
};


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
  Award,
  TrendingUp,
  Star,
  Video,
  Calendar,
  User,
  GraduationCap,
  VideoIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { useStudyMetrics } from '../contexts/StudyMetricsContext.jsx';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { subscribeToUserData, updateUserData, initializeUserData } from '../lib/firestore';

// Local storage functions for scheduled appointments (no Firebase)
const SCHEDULED_APPOINTMENTS_KEY = 'scheduledAppointments';

const getScheduledAppointmentsLocal = () => {
  try {
    const stored = localStorage.getItem(SCHEDULED_APPOINTMENTS_KEY);
    const appointments = stored ? JSON.parse(stored) : [];
    // Filter out past appointments
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledDateTime || apt.scheduledDate);
      return aptDate >= now;
    });
  } catch (error) {
    console.error('Error loading scheduled appointments:', error);
    return [];
  }
};
import { BADGES, checkBadges } from '../lib/gamification';

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
  const [scheduledAppointments, setScheduledAppointments] = useState([]);

  const handleJoinSession = (appointment) => {
    // Check if user is a tutor (from login page)
    const isTutor = sessionStorage.getItem('isTutor') === 'true';
    
    // Whereby room URL - students join normally, tutors join as owner
    const roomUrl = isTutor 
      ? 'https://whereby.com/fbla-app?embed&owner=true'
      : 'https://whereby.com/fbla-app?embed';
    
    // Store the room URL in sessionStorage so VideoCallView can access it
    sessionStorage.setItem('wherebyRoomUrl', roomUrl);
    sessionStorage.setItem('wherebyRoomTutor', JSON.stringify({
      name: appointment.tutorName,
      subject: appointment.tutorSubject,
    }));
    
    // Navigate to video call page
    if (onNavigate) {
      onNavigate(isTutor ? 'video?tutor=true' : 'video');
    }
  };
  
  // Load scheduled appointments from localStorage
  useEffect(() => {
    const loadAppointments = () => {
      const appointments = getScheduledAppointmentsLocal();
      setScheduledAppointments(appointments || []);
    };
    
    loadAppointments();
    // Refresh appointments every minute to filter out past ones
    const interval = setInterval(loadAppointments, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Get earned badges
  const earnedBadges = useMemo(() => {
    if (!derived.xpProgress) return [];
    const earnedBadgeIds = new Set(metrics.earnedBadges || []);
    const allBadges = checkBadges(metrics, derived, {}, derived.xpProgress);
    return allBadges.filter(badge => earnedBadgeIds.has(badge.id));
  }, [metrics, derived]);
  
  // Listen for badge notifications
  useEffect(() => {
    const handleBadgeEarned = (event) => {
      const newBadges = event.detail;
      // You could show a toast notification here
      console.log('New badges earned:', newBadges);
    };
    
    window.addEventListener('badge-earned', handleBadgeEarned);
    return () => window.removeEventListener('badge-earned', handleBadgeEarned);
  }, []);

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
      <div className="p-6 md:p-8 space-y-8">
    {/* Hero Card */}
    <Card className="border-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent shadow-none">
      <CardHeader className="pb-3">
        <CardTitle as="h1" className="text-2xl font-semibold">
          Welcome back, {getUserFirstName()}
        </CardTitle>
        <CardDescription className="text-sm mt-1">
          You're on a <strong>{metrics.quizzesCompleted || metrics.flashcardsReviewed ? metrics.quizzesCompleted + metrics.flashcardsReviewed : 0}-task streak!</strong> Keep up the great work.
        </CardDescription>
      </CardHeader>
      
      {/* XP and Level Section */}
      {derived.xpProgress && (
        <CardContent className="pt-2">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-5 border-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold">Level {derived.xpProgress.level}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {derived.xpProgress.currentXP.toLocaleString()} / {derived.xpProgress.nextLevelXP.toLocaleString()} XP to Level {derived.xpProgress.level + 1}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-primary">{derived.xpProgress.totalXP.toLocaleString()} XP</p>
                <p className="text-xs text-muted-foreground">Total Experience</p>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${derived.xpProgress.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </CardContent>
      )}
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-5 rounded-lg bg-muted/30 border-0 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Study Time</p>
                <Clock className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <p className="text-2xl font-semibold mb-1">{(metrics.studyMinutes / 60).toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">{metrics.studyMinutes} min</p>
          </div>
          <div className="p-5 rounded-lg bg-muted/30 border-0 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Flashcards</p>
                <BookOpen className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <p className="text-2xl font-semibold mb-1">{metrics.flashcardsReviewed}</p>
              <p className="text-xs text-muted-foreground">{derived.flashcardAccuracy}% accuracy</p>
          </div>
          <div className="p-5 rounded-lg bg-muted/30 border-0 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quizzes</p>
                <CheckCircle className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <p className="text-2xl font-semibold mb-1">{metrics.quizzesCompleted}</p>
              <p className="text-xs text-muted-foreground">{derived.averageQuizScore}% average</p>
          </div>
          <div className="p-5 rounded-lg bg-muted/30 border-0 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Interactions</p>
                <Sparkles className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <p className="text-2xl font-semibold mb-1">{metrics.aiInteractions}</p>
              <p className="text-xs text-muted-foreground">Questions asked</p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Video Conferencing Section */}
    {scheduledAppointments.length > 0 && (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Video Conferencing</CardTitle>
          <CardDescription className="text-sm">
            Your upcoming tutor sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduledAppointments.map((appointment) => {
              const appointmentDate = new Date(appointment.scheduledDateTime || appointment.scheduledDate);
              const [hours, minutes] = (appointment.scheduledTime || '').split(':').map(Number);
              if (hours !== undefined && minutes !== undefined) {
                appointmentDate.setHours(hours, minutes, 0, 0);
              }
              
              const formattedDate = appointmentDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              
              const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

              return (
                <div key={appointment.id} className="p-4 rounded-lg bg-muted/30 border-0 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage 
                          src={appointment.tutorPhotoURL} 
                          alt={appointment.tutorName}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <AvatarFallback className="bg-primary/10">
                          <GraduationCap className="h-6 w-6 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-0.5">{appointment.tutorName}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{appointment.tutorSubject}</p>
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{formattedTime}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoinSession(appointment)}
                          className="w-full"
                        >
                          <VideoIcon className="h-3.5 w-3.5 mr-2" />
                          Join Session
                        </Button>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Badges Section */}
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Badges & Achievements</CardTitle>
        <CardDescription className="text-sm">
          Earn badges by completing challenges and reaching milestones
        </CardDescription>
      </CardHeader>
      <CardContent>
        {earnedBadges.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Award className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No badges earned yet. Start studying to earn your first badge!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {earnedBadges.map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg bg-muted/30 border-0 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{badge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{badge.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Show some available badges as locked */}
        {earnedBadges.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <h4 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">Available Badges</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.values(BADGES).slice(0, 8).map((badge) => {
                const isEarned = earnedBadges.some(b => b.id === badge.id);
                return (
                  <div
                    key={badge.id}
                    className={cn(
                      "p-3 rounded-lg text-center transition-all border-0",
                      isEarned
                        ? "bg-primary/10"
                        : "bg-muted/30 opacity-50"
                    )}
                  >
                    <div className="text-xl mb-1">{badge.icon}</div>
                    <p className="text-xs font-medium">{badge.name}</p>
                    {isEarned && (
                      <div className="mt-1">
                        <CheckCircle className="h-3 w-3 text-primary mx-auto" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
                <label htmlFor="goal-title" className="text-sm font-medium">Goal Title</label>
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
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="goal-target" className="text-sm font-medium">Target (optional)</label>
                <Input
                  id="goal-target"
                  name="goal-target"
                  placeholder="e.g., 10 quizzes, 50 flashcards"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddGoal();
                  }}
                  autoComplete="off"
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


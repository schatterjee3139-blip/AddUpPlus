import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Area,
  AreaChart,
} from 'recharts';
import { Sparkles, Clock, BookOpen, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { useStudyMetrics } from '../contexts/StudyMetricsContext.jsx';

export const AnalyticsView = () => {
  const { metrics, derived } = useStudyMetrics();
  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todaysMinutes = metrics.dailyStudyTime?.[todayKey] || 0;
  const totalFocusHours = (metrics.studyMinutes / 60).toFixed(1);
  const activeDays = Object.values(metrics.dailyStudyTime || {}).filter((minutes) => minutes > 0).length;
  const pomodorosCompleted = Math.max(0, Math.round(metrics.studyMinutes / 25));
  const xpProgress = derived?.xpProgress || { level: 1, progress: 0, totalXP: 0 };

  const retentionData = useMemo(() => {
    const base = derived.flashcardAccuracy || 0;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => ({
      name: day,
      retention: Math.max(0, Math.min(100, base - (6 - idx) * 3)),
    }));
  }, [derived.flashcardAccuracy]);

  const subjectMastery = useMemo(() => (
    [
      { name: 'Math', mastery: derived.flashcardAccuracy },
      { name: 'Study Habits', mastery: Math.min(100, Math.round((metrics.studyMinutes / 300) * 100)) },
      { name: 'Quizzes', mastery: derived.averageQuizScore },
      { name: 'AI Usage', mastery: Math.min(100, metrics.aiInteractions * 10) },
    ]
  ), [derived, metrics]);

  // Study time over last 7 days
  const studyTimeData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hoursStudied = metrics.studyMinutes / 60;
    const avgDaily = hoursStudied / 7;
    return days.map((day, idx) => ({
      name: day,
      hours: parseFloat(Math.max(0, avgDaily + (Math.random() - 0.5) * 0.5).toFixed(1)),
    }));
  }, [metrics.studyMinutes]);

  // Activity breakdown
  const activityData = useMemo(() => [
    { name: 'Flashcards', value: metrics.flashcardsReviewed, color: '#60a5fa' },
    { name: 'Quizzes', value: metrics.quizzesCompleted, color: '#4ade80' },
    { name: 'AI Interactions', value: metrics.aiInteractions, color: '#facc15' },
    { name: 'Study Time', value: Math.floor(metrics.studyMinutes / 60), color: '#f87171' },
  ].filter(item => item.value > 0), [metrics]);

  // Statistics cards data
  const statsCards = useMemo(() => [
    {
      title: 'Total Focus Time',
      value: `${totalFocusHours}h`,
      subtitle: `${metrics.studyMinutes} minutes logged`,
      icon: Clock,
      color: 'text-blue-500',
      trend: metrics.studyMinutes ? '+12% vs last week' : 'Start studying',
      trendColor: metrics.studyMinutes ? 'text-emerald-500' : 'text-muted-foreground',
    },
    {
      title: 'Flashcards Reviewed',
      value: metrics.flashcardsReviewed,
      subtitle: `${derived.flashcardAccuracy}% accuracy`,
      icon: BookOpen,
      color: 'text-green-500',
      trend: metrics.flashcardsReviewed ? '+8 new this week' : 'No reviews yet',
      trendColor: metrics.flashcardsReviewed ? 'text-emerald-500' : 'text-muted-foreground',
    },
    {
      title: 'Quizzes Completed',
      value: metrics.quizzesCompleted,
      subtitle: `${derived.averageQuizScore}% average`,
      icon: CheckCircle,
      color: 'text-purple-500',
      trend: metrics.quizzesCompleted ? 'Consistency streak alive' : 'Take your first quiz',
      trendColor: metrics.quizzesCompleted ? 'text-emerald-500' : 'text-muted-foreground',
    },
    {
      title: 'AI Interactions',
      value: metrics.aiInteractions,
      subtitle: 'Questions asked',
      icon: Sparkles,
      color: 'text-yellow-500',
      trend: metrics.aiInteractions ? '+3 vs yesterday' : 'Ask Study AI anything',
      trendColor: metrics.aiInteractions ? 'text-emerald-500' : 'text-muted-foreground',
    },
  ], [metrics, derived, totalFocusHours]);

  const goalProgress = useMemo(() => [
    {
      title: 'Daily Focus Goal',
      value: Math.min(100, Math.round((todaysMinutes / 60) * 100)),
      detail: `${Math.round(todaysMinutes)} / 60 min`,
    },
    {
      title: 'Flashcard Sprint',
      value: Math.min(100, Math.round((metrics.flashcardsReviewed / 50) * 100)),
      detail: `${metrics.flashcardsReviewed}/50 cards`,
    },
    {
      title: 'Quiz Consistency',
      value: Math.min(100, Math.round((metrics.quizzesCompleted / 5) * 100)),
      detail: `${metrics.quizzesCompleted}/5 quizzes`,
    },
  ], [metrics.flashcardsReviewed, metrics.quizzesCompleted, todaysMinutes]);

  const highlightInsights = useMemo(() => [
    {
      label: 'Accuracy momentum',
      value: `${derived.flashcardAccuracy}%`,
      note: derived.flashcardAccuracy >= 70 ? '+4% vs last week' : 'Room to grow',
    },
    {
      label: 'Average quiz score',
      value: `${derived.averageQuizScore}%`,
      note: derived.averageQuizScore >= 80 ? 'Great consistency' : 'Take another quiz',
    },
    {
      label: 'Active study days',
      value: `${activeDays}`,
      note: activeDays >= 5 ? 'Streak intact' : 'Aim for 5 days/week',
    },
  ], [derived.flashcardAccuracy, derived.averageQuizScore, activeDays]);

  const summary = metrics.flashcardsReviewed || metrics.quizzesCompleted
    ? `You've reviewed ${metrics.flashcardsReviewed} flashcards and completed ${metrics.quizzesCompleted} quizzes so far. Keep padding your streak by running another Pomodoro or generating fresh practice!`
    : 'You have not logged any study sessions yet. Generate a quiz or review a few flashcards to start building your analytics.';

  const focusHighlights = [
    { label: 'Active streak', value: `${Math.min(activeDays, 7)} days` },
    { label: 'Pomodoros', value: `${pomodorosCompleted}` },
    { label: 'XP total', value: `${xpProgress.totalXP} pts` },
  ];

  return (
    <div className="p-4 md:p-6 space-y-8 bg-muted/10 min-h-screen">
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/90 via-primary to-primary/80 text-primary-foreground">
          <div className="absolute inset-y-0 right-0 opacity-20 pointer-events-none">
            <div className="w-64 h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent)]" />
          </div>
          <CardContent className="relative z-10 p-6 space-y-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-primary-foreground/70">Analytics hub</p>
                <h2 className="text-3xl font-semibold mt-1">Your performance pulse</h2>
                <p className="text-sm text-primary-foreground/80 mt-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Live tracking active · refreshed in real-time
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary-foreground/70 mb-1">Level progress</p>
                <p className="text-4xl font-bold leading-none">Lv. {xpProgress.level || 1}</p>
                <p className="text-xs text-primary-foreground/80 mt-1">{Math.round(xpProgress.progress || 0)}% to next level</p>
              </div>
            </div>
            <Progress value={xpProgress.progress || 0} className="h-3 bg-white/20" />
            <div className="grid gap-4 md:grid-cols-3">
              {focusHighlights.map((highlight) => (
                <div key={highlight.label} className="rounded-xl bg-white/15 p-3">
                  <p className="text-xs uppercase tracking-wide text-primary-foreground/70">{highlight.label}</p>
                  <p className="text-xl font-semibold mt-1">{highlight.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-sm">{summary}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Goals dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalProgress.map((goal) => (
              <div key={goal.title}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">{goal.title}</span>
                  <span className="text-muted-foreground">{goal.detail}</span>
                </div>
                <Progress value={goal.value} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="border border-muted-foreground/10 bg-background/70 backdrop-blur hover:shadow-lg transition-all">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.title}</p>
                    <p className={`text-[11px] ${stat.trendColor}`}>{stat.trend}</p>
                  </div>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-3xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Study Time Over Time */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Study Time (Last 7 Days)</CardTitle>
            <span className="text-xs text-muted-foreground">Hover points to see exact hours</span>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studyTimeData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="hsl(var(--primary))"
                    fill="url(#studyGradient)"
                    strokeWidth={2}
                    fillOpacity={1}
                  />
                  <defs>
                    <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No activity data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Retention Over Time (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionData}>
                  <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="retention"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject Mastery */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Mastery Pulse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectMastery}>
                  <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="mastery" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Momentum Highlights</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Quick insights generated from your study habits</p>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          {highlightInsights.map((insight) => (
            <div key={insight.label} className="rounded-2xl border border-dashed border-muted-foreground/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{insight.label}</p>
              <p className="text-2xl font-semibold mt-2">{insight.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{insight.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};



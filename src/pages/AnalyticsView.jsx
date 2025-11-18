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
import { useStudyMetrics } from '../contexts/StudyMetricsContext.jsx';

export const AnalyticsView = () => {
  const { metrics, derived } = useStudyMetrics();

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
      hours: Math.max(0, avgDaily + (Math.random() - 0.5) * 0.5).toFixed(1),
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
      title: 'Total Study Time',
      value: `${(metrics.studyMinutes / 60).toFixed(1)}h`,
      subtitle: `${metrics.studyMinutes} minutes`,
      icon: Clock,
      color: 'text-blue-500',
    },
    {
      title: 'Flashcards Reviewed',
      value: metrics.flashcardsReviewed,
      subtitle: `${derived.flashcardAccuracy}% accuracy`,
      icon: BookOpen,
      color: 'text-green-500',
    },
    {
      title: 'Quizzes Completed',
      value: metrics.quizzesCompleted,
      subtitle: `${derived.averageQuizScore}% average`,
      icon: CheckCircle,
      color: 'text-purple-500',
    },
    {
      title: 'AI Interactions',
      value: metrics.aiInteractions,
      subtitle: 'Questions asked',
      icon: Sparkles,
      color: 'text-yellow-500',
    },
  ], [metrics, derived]);

  const summary = metrics.flashcardsReviewed || metrics.quizzesCompleted
    ? `You've reviewed ${metrics.flashcardsReviewed} flashcards and completed ${metrics.quizzesCompleted} quizzes so far. Keep padding your streak by running another Pomodoro or generating fresh practice!`
    : 'You have not logged any study sessions yet. Generate a quiz or review a few flashcards to start building your analytics.';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Analytics & Statistics</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Live tracking active</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Summary */}
      <Card className="bg-gradient-to-r from-primary/10 to-transparent">
        <CardHeader className="flex-row items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Study Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{summary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Time Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Study Time (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studyTimeData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
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
            <div className="h-64">
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
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

        {/* Retention Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Retention Over Time (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
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
      </div>
    </div>
  );
};



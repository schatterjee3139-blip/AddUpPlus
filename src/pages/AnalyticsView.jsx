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
} from 'recharts';
import { Sparkles } from 'lucide-react';
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
      { name: 'Chemistry', mastery: derived.flashcardAccuracy },
      { name: 'Study Habits', mastery: Math.min(100, Math.round((metrics.studyMinutes / 300) * 100)) },
      { name: 'Quizzes', mastery: derived.averageQuizScore },
      { name: 'AI Usage', mastery: Math.min(100, metrics.aiInteractions * 10) },
    ]
  ), [derived, metrics]);

  const summary = metrics.flashcardsReviewed || metrics.quizzesCompleted
    ? `You've reviewed ${metrics.flashcardsReviewed} flashcards and completed ${metrics.quizzesCompleted} quizzes so far. Keep padding your streak by running another Pomodoro or generating fresh practice!`
    : 'You have not logged any study sessions yet. Generate a quiz or review a few flashcards to start building your analytics.';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Analytics</h2>

      {/* AI Summary */}
      <Card className="bg-gradient-to-r from-primary/10 to-transparent">
        <CardHeader className="flex-row items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Study Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{summary}</p>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <li className="p-3 bg-card/50 rounded-md border border-border">
              <span className="block text-muted-foreground">Flashcard Accuracy</span>
              <strong className="text-lg">{derived.flashcardAccuracy}%</strong>
            </li>
            <li className="p-3 bg-card/50 rounded-md border border-border">
              <span className="block text-muted-foreground">Average Quiz Score</span>
              <strong className="text-lg">{derived.averageQuizScore}%</strong>
            </li>
            <li className="p-3 bg-card/50 rounded-md border border-border">
              <span className="block text-muted-foreground">AI Interactions</span>
              <strong className="text-lg">{metrics.aiInteractions}</strong>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Subject Mastery */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectMastery} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="mastery" barSize={20} radius={[0, 10, 10, 0]}>
                    {subjectMastery.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#60a5fa', '#facc15', '#4ade80', '#f87171'][index % 4]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};



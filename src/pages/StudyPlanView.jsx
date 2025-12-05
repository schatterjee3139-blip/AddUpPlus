import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Label } from '../components/ui/Label';
import { Calendar, Sparkles, Loader2, CheckCircle, AlertCircle, Clock, BookOpen } from 'lucide-react';
import { generateStudyPlan } from '../lib/aiHelpers';
import { chatCompletionStream } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { updatePlannerData } from '../lib/localStorage';
import { motion, AnimatePresence } from 'framer-motion';

export const StudyPlanView = () => {
  const { currentUser } = useAuth();
  const [examDate, setExamDate] = useState('');
  const [topics, setTopics] = useState('');
  const [stressLevel, setStressLevel] = useState('Medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyPlan, setStudyPlan] = useState(null);
  const [error, setError] = useState('');
  const [isAddingToPlanner, setIsAddingToPlanner] = useState(false);
  const [generatedText, setGeneratedText] = useState('');

  const handleGenerate = async () => {
    if (!examDate || !topics.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const today = new Date();
    const exam = new Date(examDate);
    if (exam <= today) {
      setError('Exam date must be in the future');
      return;
    }

    setIsGenerating(true);
    setError('');
    setStudyPlan(null);
    setGeneratedText('');

    try {
      // Use streaming for better UX
      let accumulatedText = '';
      
      const prompt = `You are an expert study planner. Create a comprehensive study schedule for an exam.

Exam Date: ${examDate}
Days Until Exam: ${Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24))}
Topics to Cover: ${topics}
Stress Level: ${stressLevel}
${stressLevel === 'Low' ? 'Create a relaxed schedule with plenty of breaks and review time. Focus on understanding concepts deeply.' : stressLevel === 'High' ? 'Create an intensive schedule with focused study blocks. Prioritize high-impact topics and frequent reviews.' : 'Create a balanced schedule with regular study sessions and adequate breaks. Mix review and new material.'}

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

      chatCompletionStream(
        prompt,
        (chunk) => {
          accumulatedText += chunk;
          setGeneratedText(accumulatedText);
        },
        async (streamError) => {
          if (streamError) {
            console.error('Error generating study plan:', streamError);
            setError('Failed to generate study plan. Please try again.');
            setIsGenerating(false);
            return;
          }

          // Parse the accumulated text
          try {
            let jsonStr = accumulatedText.trim();
            // Try to extract JSON from the response (in case it's wrapped in markdown)
            if (jsonStr.startsWith('```json')) {
              jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            } else if (jsonStr.startsWith('```')) {
              jsonStr = jsonStr.replace(/```\n?/g, '').trim();
            }
            
            const plan = JSON.parse(jsonStr);
            
            if (!Array.isArray(plan) || plan.length === 0) {
              throw new Error('Invalid study plan format');
            }

            setStudyPlan(plan);
            setGeneratedText('');
          } catch (parseError) {
            console.error('Error parsing study plan:', parseError);
            setError('Failed to parse study plan. Please try again.');
          } finally {
            setIsGenerating(false);
          }
        }
      );
    } catch (err) {
      console.error('Error generating study plan:', err);
      setError('Failed to generate study plan. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleAddToPlanner = async () => {
    if (!studyPlan || !currentUser) {
      setError('Please generate a study plan first and make sure you are logged in');
      return;
    }

    setIsAddingToPlanner(true);
    setError('');

    try {
      // Get existing planner data
      const { getUserData } = await import('../lib/localStorage');
      const userData = await getUserData(currentUser.uid);
      const existingEvents = userData?.planner?.eventsByDate || {};

      // Convert study plan to planner events
      const newEvents = { ...existingEvents };
      
      studyPlan.forEach((item) => {
        const dateKey = item.date;
        if (!newEvents[dateKey]) {
          newEvents[dateKey] = [];
        }

        const eventTitle = `${item.topic}${item.type === 'break' ? ' (Break)' : item.type === 'assessment' ? ' (Assessment)' : ''}`;
        const eventNotes = item.description || '';
        const eventTime = item.time || '';

        newEvents[dateKey].push({
          id: `${dateKey}-${Date.now()}-${Math.random()}`,
          title: eventTitle,
          notes: eventNotes,
          time: eventTime,
          duration: item.duration,
          type: item.type,
        });
      });

      // Update planner data
      await updatePlannerData(currentUser.uid, {
        eventsByDate: newEvents,
      }, true); // Use immediate flag for important updates

      setError('');
      alert('Study plan added to your calendar! Check the Planner view to see your schedule.');
    } catch (err) {
      console.error('Error adding to planner:', err);
      setError('Failed to add study plan to calendar. Please try again.');
    } finally {
      setIsAddingToPlanner(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'new-material':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'review':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'practice':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'assessment':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'break':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'new-material':
        return <BookOpen className="h-4 w-4" />;
      case 'review':
        return <CheckCircle className="h-4 w-4" />;
      case 'practice':
        return <Sparkles className="h-4 w-4" />;
      case 'assessment':
        return <AlertCircle className="h-4 w-4" />;
      case 'break':
        return <Clock className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">One-Click Study Plan</h1>
        <p className="text-sm text-muted-foreground">
          Let AI create a personalized study schedule based on your exam date, topics, and stress level.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Create Your Study Plan</CardTitle>
          <CardDescription className="text-sm">
            Fill in the details below and AI will generate a comprehensive study schedule for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="exam-date">Exam Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="exam-date"
                name="exam-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topics">Topics to Study *</Label>
            <Textarea
              id="topics"
              name="topics"
              placeholder="e.g., Algebra, Calculus, Geometry, Statistics, Linear Algebra"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              List all topics you need to cover, separated by commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stress-level">Stress Level</Label>
            <select
              id="stress-level"
              name="stress-level"
              value={stressLevel}
              onChange={(e) => setStressLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Low">Low - Relaxed pace with plenty of breaks</option>
              <option value="Medium">Medium - Balanced schedule</option>
              <option value="High">High - Intensive study schedule</option>
            </select>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !examDate || !topics.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Study Plan...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Study Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isGenerating && generatedText && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Generating Study Plan...</CardTitle>
            <CardDescription className="text-sm">AI is creating your personalized schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4 bg-muted/30 max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {generatedText}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {studyPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Your Study Plan</CardTitle>
                    <CardDescription className="text-sm">
                      {studyPlan.length} study sessions scheduled from {studyPlan[0]?.date} to {studyPlan[studyPlan.length - 1]?.date}
                    </CardDescription>
                  </div>
                  {currentUser && (
                    <Button
                      onClick={handleAddToPlanner}
                      disabled={isAddingToPlanner}
                      variant="outline"
                    >
                      {isAddingToPlanner ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          Add to Calendar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {studyPlan.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`rounded-lg border p-4 ${getTypeColor(item.type)}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(item.type)}
                            <span className="font-semibold">{item.topic}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-background/50">
                              {item.type.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {item.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.time}
                              </span>
                            )}
                            {item.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.duration} min
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


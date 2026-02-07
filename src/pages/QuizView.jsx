import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Trophy, TrendingUp, RotateCcw, CheckSquare, BookOpen, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SparkleButton } from '../components/ui/SparkleButton';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { generateQuizQuestions } from '../lib/aiHelpers';
import { useStudyMetrics } from '../contexts/StudyMetricsContext.jsx';
import { useCourseCatalog } from '../contexts/CourseCatalogContext.jsx';
import { chatCompletion } from '../lib/api';
import { stripMarkdown } from '../lib/utils';
import { motion } from 'framer-motion';

const parseAIQuiz = (raw) => {
  const questions = [];
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
  let current = { question: '', options: [], correctAnswer: null };

  lines.forEach((line) => {
    if (/^\d+\./.test(line)) {
      if (current.question) {
        questions.push({ ...current });
        current = { question: '', options: [], correctAnswer: null };
      }
      current.question = line.replace(/^\d+\./, '').trim();
    } else if (/^[A-Da-d][\)\.]\s*/.test(line)) {
      const optionText = line.replace(/^[A-Da-d][\)\.]\s*/, '').trim();
      current.options.push(optionText);
    } else if (/^correct[:\s]/i.test(line)) {
      const letter = line.split(':')[1]?.trim().charAt(0).toUpperCase();
      current.correctAnswer = ['A', 'B', 'C', 'D'].indexOf(letter);
    }
  });

  if (current.question) {
    questions.push({ ...current });
  }

  return questions.filter((q) => q.question && q.options.length >= 2 && q.correctAnswer !== null);
};

const fallbackQuestions = [
  {
    id: 1,
    type: 'mcq',
    question: 'What is the derivative of f(x) = x²?',
    options: ['x', '2x', 'x²', '2x²'],
    correctAnswer: 1,
  },
  {
    id: 2,
    type: 'short',
    question: 'Briefly explain what a derivative represents in calculus.',
  },
  {
    id: 3,
    type: 'cloze',
    question: 'Fill in the blank: The integral of a function represents the _____ under its curve.',
    answer: 'area',
  },
];

export const QuizView = () => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState(fallbackQuestions);
  const [quizSummary, setQuizSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const { recordQuizResult, recordAIInteraction } = useStudyMetrics();
  const { joinedCourses, getCourseById } = useCourseCatalog();

  const totalQuestions = questions.length;

  // Reset course selection when quiz is reset
  useEffect(() => {
    if (!isConfigured) {
      setSelectedCourseId('');
      setTopic('');
    }
  }, [isConfigured]);

  const computeScore = useCallback(() => {
    let correctAnswers = 0;
    questions.forEach((q) => {
      if (q.type === 'mcq') {
        if (selectedAnswers[q.id] === q.correctAnswer) correctAnswers += 1;
      } else if (q.type === 'cloze') {
        if ((selectedAnswers[q.id] || '').trim().toLowerCase() === q.answer) correctAnswers += 1;
      } else if (q.type === 'short') {
        if (selectedAnswers[q.id] && selectedAnswers[q.id].length > 3) correctAnswers += 1;
      }
    });
    return correctAnswers;
  }, [questions, selectedAnswers]);

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    const correctAnswers = computeScore();
    const score = correctAnswers;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    setIsSubmitted(true);
    recordQuizResult(correctAnswers, totalQuestions);
    
    // Generate AI summary
    setIsGeneratingSummary(true);
    try {
      const summaryPrompt = `You just completed a ${topic} quiz. You got ${score} out of ${totalQuestions} questions correct (${percentage}%). 

Here are the questions and your answers:
${questions.map((q, idx) => {
  const userAnswer = selectedAnswers[q.id];
  const isCorrect = q.type === 'mcq' ? userAnswer === q.correctAnswer : 
                    q.type === 'cloze' ? (userAnswer || '').trim().toLowerCase() === q.answer :
                    userAnswer && userAnswer.length > 3;
  return `${idx + 1}. ${q.question}\n   Your answer: ${q.type === 'mcq' ? (q.options[userAnswer] || 'Not answered') : (userAnswer || 'Not answered')}\n   ${isCorrect ? '✓ Correct' : '✗ Incorrect'}`;
}).join('\n\n')}

Provide a brief, encouraging summary (2-3 sentences) highlighting strengths and areas to improve. Be motivational and specific.`;
      
      const summaryResponse = await chatCompletion(summaryPrompt);
      const summary = summaryResponse.choices?.[0]?.message?.content || summaryResponse.content || '';
      setQuizSummary(stripMarkdown(summary));
      recordAIInteraction();
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setQuizSummary(`Great job completing the quiz! You scored ${score}/${totalQuestions} (${percentage}%). Keep practicing to improve!`);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [computeScore, totalQuestions, topic, questions, selectedAnswers, recordQuizResult, recordAIInteraction]);

  // Timer effect
  useEffect(() => {
    if (!isConfigured || isSubmitted) return;
    if (timeRemaining <= 0) {
      handleSubmit(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, isSubmitted, isConfigured, handleSubmit]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const configureQuiz = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsSubmitted(false);
    setSelectedAnswers({});
    setCurrentQuestion(1);
    setTimeRemaining(25 * 60);

    try {
      const prompt = `Create ${questionCount} multiple-choice quiz questions about ${topic}. Format each question exactly like:
1. [Question]
A) Option
B) Option
C) Option
D) Option
Correct: [Letter]

Make sure all questions are specifically about ${topic} and not about other subjects.`;
      const raw = await generateQuizQuestions(prompt, questionCount);
      const parsed = parseAIQuiz(raw).map((q, idx) => ({
        id: idx + 1,
        type: 'mcq',
        ...q,
      }));

      if (parsed.length) {
        setQuestions(parsed);
      } else {
        setQuestions(fallbackQuestions);
      }
      recordAIInteraction();
    } catch (error) {
      console.error('Failed to generate quiz', error);
      setQuestions(fallbackQuestions);
    } finally {
      setIsConfigured(true);
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answer });
  };

  const resetQuiz = () => {
    setIsConfigured(false);
    setIsSubmitted(false);
    setSelectedAnswers({});
    setCurrentQuestion(1);
    setTimeRemaining(25 * 60);
    setQuestions(fallbackQuestions);
    setQuizSummary('');
    setIsGeneratingSummary(false);
    setSelectedCourseId('');
    setTopic('');
  };
  
  const score = computeScore();
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const currentQ = questions[currentQuestion - 1] || questions[0];
  
  // Results screen
  if (isSubmitted) {
    const getScoreColor = () => {
      if (percentage >= 80) return 'text-green-500';
      if (percentage >= 60) return 'text-yellow-500';
      return 'text-red-500';
    };
    
    const getScoreMessage = () => {
      if (percentage >= 90) return 'Outstanding!';
      if (percentage >= 80) return 'Great job!';
      if (percentage >= 70) return 'Good work!';
      if (percentage >= 60) return 'Not bad!';
      return 'Keep practicing!';
    };

    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl space-y-6"
        >
          {/* Score Card */}
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <Trophy className="h-12 w-12 text-primary" />
              </motion.div>
              <CardTitle className="text-4xl">{getScoreMessage()}</CardTitle>
              <div className="space-y-2">
                <div className={`text-6xl font-bold ${getScoreColor()}`}>
                  {percentage}%
                </div>
                <CardDescription className="text-lg">
                  {score} out of {totalQuestions} questions correct
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Circle */}
              <div className="flex justify-center">
                <div className="relative w-48 h-48">
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-secondary"
                    />
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - percentage / 100)}`}
                      strokeLinecap="round"
                      className={getScoreColor()}
                      initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - percentage / 100) }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor()}`}>
                        {percentage}%
                      </div>
                      <div className="text-sm text-muted-foreground">Score</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Summary */}
              <Card className="bg-gradient-to-r from-primary/10 to-transparent">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle>AI Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {isGeneratingSummary ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating personalized summary...</span>
                    </div>
                  ) : (
                    <p className="text-base leading-relaxed">{quizSummary || 'Analyzing your results...'}</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Question Breakdown */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Question Breakdown</h3>
                <div className="space-y-2">
                  {questions.map((q, idx) => {
                    const userAnswer = selectedAnswers[q.id];
                    const isCorrect = q.type === 'mcq' ? userAnswer === q.correctAnswer : 
                                      q.type === 'cloze' ? (userAnswer || '').trim().toLowerCase() === q.answer :
                                      userAnswer && userAnswer.length > 3;
                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-lg border ${
                          isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-lg ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                            {isCorrect ? '✓' : '✗'}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{q.question}</p>
                            {q.type === 'mcq' && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Your answer: {q.options[userAnswer] || 'Not answered'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={resetQuiz}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  New Quiz
                </Button>
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setCurrentQuestion(1);
                  }}
                  className="flex-1"
                >
                  Review Answers
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const questionCountPresets = [5, 7, 10, 15];

  if (!isConfigured) {
    return (
      <div className="min-h-[calc(100vh-64px)] p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Create Your Quiz</h1>
            <p className="text-muted-foreground mt-1">
              Enter your topic and options; AI will generate a personalized quiz.
            </p>
          </div>

          <form onSubmit={configureQuiz} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: Your input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your input</CardTitle>
                <CardDescription>
                  Topic and settings the AI uses to build your quiz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {joinedCourses.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="course-select" className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Course (optional)
                    </Label>
                    <div className="relative">
                      <select
                        id="course-select"
                        name="course-select"
                        value={selectedCourseId}
                        onChange={(e) => {
                          const courseId = e.target.value;
                          setSelectedCourseId(courseId);
                          if (courseId) {
                            const course = getCourseById(courseId);
                            if (course) setTopic(course.name);
                          } else setTopic('');
                        }}
                        className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10 appearance-none h-11"
                      >
                        <option value="">Select from workspace or type below</option>
                        {joinedCourses.map((course) => (
                          <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium">
                    Quiz topic {joinedCourses.length > 0 ? '(or type your own)' : '*'}
                  </Label>
                  <Input
                    id="topic"
                    name="topic"
                    placeholder="e.g. Quadratic equations, Cell biology, World War II"
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value);
                      if (e.target.value && selectedCourseId) {
                        const course = getCourseById(selectedCourseId);
                        if (course && e.target.value !== course.name) setSelectedCourseId('');
                      }
                    }}
                    autoComplete="off"
                    required
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    More specific topics give better AI questions.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questionCount" className="text-sm font-medium">
                    Number of questions
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {questionCountPresets.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuestionCount(n)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          questionCount === n
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <Input
                    id="questionCount"
                    name="questionCount"
                    type="number"
                    min={3}
                    max={15}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value) || 5)}
                    className="mt-2 w-20 h-10 text-center"
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 5–10 for a focused session</p>
                </div>
              </CardContent>
            </Card>

            {/* Right column: Generate & summary */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Generate quiz</CardTitle>
                <CardDescription>
                  {topic.trim()
                    ? `AI will create ${questionCount} multiple-choice questions on "${topic.slice(0, 40)}${topic.length > 40 ? '…' : ''}".`
                    : 'Fill in the topic in the left column to see a preview.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="rounded-lg bg-muted/50 dark:bg-muted/20 p-4 text-sm text-muted-foreground space-y-2">
                  <p className="font-medium text-foreground">Tips for better results</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use a specific topic (e.g. &quot;Photosynthesis&quot; not &quot;Biology&quot;)</li>
                    <li>Pick a course from Workspace to auto-fill the topic</li>
                    <li>5–10 questions works well for one study session</li>
                  </ul>
                </div>
                <SparkleButton
                  type="submit"
                  className="w-full mt-auto"
                  loading={loading}
                  disabled={loading || !topic.trim()}
                >
                  Generate
                </SparkleButton>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
      {/* Progress */}
      <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border p-4 space-y-4">
        <h3 className="font-semibold">Questions</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(
            (num) => (
              <Button
                key={num}
                variant={currentQuestion === num ? 'secondary' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentQuestion(num)}
              >
                {num}
              </Button>
            )
          )}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Topic: <strong>{topic}</strong></p>
          <p>Time Remaining: <strong className={timeRemaining < 300 ? 'text-destructive' : ''}>{formatTime(timeRemaining)}</strong></p>
          <Button variant="ghost" size="sm" onClick={resetQuiz}>
            Change topic
          </Button>
        </div>
      </nav>

      {/* Main Question Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {currentQ && currentQ.type === 'mcq' && (
            <Card className="mb-6">
              <CardHeader>
                <CardDescription>
                  Question {currentQuestion} of {totalQuestions}
                </CardDescription>
                <CardTitle>{currentQ.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <Button
                    key={option}
                    variant={selectedAnswers[currentQ.id] === index ? 'secondary' : 'outline'}
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => !isSubmitted && handleAnswerChange(currentQ.id, index)}
                    disabled={isSubmitted}
                  >
                    <span className="flex items-center justify-center h-6 w-6 rounded-full border border-border mr-4">
                      {selectedAnswers[currentQ.id] === index && (
                        <span className="h-3 w-3 rounded-full bg-primary" />
                      )}
                    </span>
                    {option}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {currentQ && currentQ.type === 'short' && (
            <Card className="mb-6">
              <CardHeader>
                <CardDescription>
                  Question {currentQuestion} of {totalQuestions}
                </CardDescription>
                <CardTitle>{currentQ.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-24 p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-ring"
                  placeholder="Type your answer here..."
                  value={selectedAnswers[currentQ.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                  disabled={isSubmitted}
                />
              </CardContent>
            </Card>
          )}

          {currentQ && currentQ.type === 'cloze' && (
            <Card className="mb-6">
              <CardHeader>
                <CardDescription>
                  Question {currentQuestion} of {totalQuestions}
                </CardDescription>
                <CardTitle>{currentQ.question}</CardTitle>
              </CardHeader>
              <CardContent className="text-lg">
                <p>
                  The slowest step in a reaction mechanism is called the{' '}
                  <input
                    type="text"
                    autoComplete="off"
                    className={`inline-block w-48 mx-2 p-1 text-lg border-b-2 bg-transparent focus:outline-none ${
                      isSubmitted
                        ? selectedAnswers[currentQ.id]?.toLowerCase() === currentQ.answer
                          ? 'border-green-500'
                          : 'border-destructive'
                        : 'border-primary'
                    }`}
                    placeholder="rate"
                    value={selectedAnswers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    disabled={isSubmitted}
                  />
                  -determining step.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              disabled={currentQuestion === 1}
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            {currentQuestion === totalQuestions ? (
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitted}
              >
                {isSubmitted ? 'Submitted' : 'Submit Quiz'}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


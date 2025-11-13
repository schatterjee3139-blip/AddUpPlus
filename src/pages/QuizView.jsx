import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { generateQuizQuestions } from '../lib/aiHelpers';
import { useStudyMetrics } from '../contexts/StudyMetricsContext.jsx';

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
    question: 'For a first-order reaction, a plot of _____ versus time is linear.',
    options: ['[A]', '1/[A]', 'ln[A]', '[A]²'],
    correctAnswer: 2,
  },
  {
    id: 2,
    type: 'short',
    question: 'Briefly explain how a catalyst increases the rate of a reaction.',
  },
  {
    id: 3,
    type: 'cloze',
    question: 'Fill in the blank: The slowest step in a reaction mechanism is called the _____-determining step.',
    answer: 'rate',
  },
];

export const QuizView = () => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('Chemical Kinetics');
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState(fallbackQuestions);
  const { recordQuizResult, recordAIInteraction } = useStudyMetrics();

  const totalQuestions = questions.length;

  // Timer effect
  useEffect(() => {
    if (!isConfigured || isSubmitted) return;
    if (timeRemaining <= 0) {
      if (!isSubmitted) {
        handleSubmit(true);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, isSubmitted, isConfigured]);

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
      const prompt = `Create ${questionCount} multiple-choice chemistry quiz questions about ${topic}. Format each question exactly like:
1. [Question]
A) Option
B) Option
C) Option
D) Option
Correct: [Letter]
`;
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

  const computeScore = () => {
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
  };

  const handleSubmit = (autoSubmit = false) => {
    const correctAnswers = computeScore();
    setIsSubmitted(true);
    recordQuizResult(correctAnswers, totalQuestions);
    if (autoSubmit) {
      alert(`Time's up! Score: ${correctAnswers}/${totalQuestions}`);
    } else {
      alert(`Quiz submitted! Score: ${correctAnswers}/${totalQuestions}`);
    }
  };

  const resetQuiz = () => {
    setIsConfigured(false);
    setIsSubmitted(false);
    setSelectedAnswers({});
    setCurrentQuestion(1);
    setTimeRemaining(25 * 60);
    setQuestions(fallbackQuestions);
  };

  const currentQ = questions[currentQuestion - 1] || questions[0];

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Create a Quiz</CardTitle>
            <CardDescription>Tell us what you want to study and we’ll build the quiz for you.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={configureQuiz}>
              <div>
                <label className="text-sm font-medium text-muted-foreground" htmlFor="topic">Quiz topic</label>
                <Input
                  id="topic"
                  placeholder="e.g. Chemical kinetics, stoichiometry, etc."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground" htmlFor="questionCount">Number of questions</label>
                <Input
                  id="questionCount"
                  type="number"
                  min={3}
                  max={15}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : 'Generate Quiz'}
              </Button>
            </form>
          </CardContent>
        </Card>
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


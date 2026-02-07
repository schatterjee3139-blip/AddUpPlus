import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SparkleButton } from '../components/ui/SparkleButton';
import { Input } from '../components/ui/Input';
import { Progress } from '../components/ui/Progress';
import { AIModal } from '../components/AIModal';
import { Textarea } from '../components/ui/Textarea';
import { useStudyMetrics } from '../contexts/StudyMetricsContext.jsx';
import { chatCompletion } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUserData, updateFlashcardsData, initializeUserData } from '../lib/localStorage';

const FlashcardFlip = ({ front, back, isFlipped, onFlip, onExplain }) => {
  return (
    <div
      className="w-full h-full cursor-pointer"
      onClick={onFlip}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Front */}
        <div
          className="absolute w-full h-full bg-card border border-border rounded-xl shadow-lg flex items-center justify-center p-8"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-2xl md:text-3xl text-center font-medium">
            {front}
          </p>
        </div>
        {/* Back */}
        <div
          className="absolute w-full h-full bg-card border border-border rounded-xl shadow-lg flex flex-col items-center justify-center p-8"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <p className="text-xl md:text-2xl text-center">{back}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-6"
            onClick={(e) => {
              e.stopPropagation();
              onExplain && onExplain(front, back);
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" /> AI Explanation
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export const FlashcardView = () => {
  const { currentUser } = useAuth();
  const [view, setView] = useState('overview'); // 'overview' or 'study'
  const [deck, setDeck] = useState(() => {
    if (typeof window === 'undefined') return [];
    if (!currentUser) {
      try {
        const stored = window.localStorage.getItem('flashcardDeck');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratedCards, setRatedCards] = useState(new Set());
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiModalTitle, setAiModalTitle] = useState('AI Explanation');
  const [aiModalPrompt, setAiModalPrompt] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [notesError, setNotesError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generationStatus, setGenerationStatus] = useState('');
  const { recordFlashcardReview, recordAIInteraction } = useStudyMetrics();

  const isInitialLoadRef = useRef(true);
  const lastSaveTimeRef = useRef(0);
  const isUpdatingRef = useRef(false);

  // Load flashcards from Firebase
  useEffect(() => {
    if (!currentUser) {
      try {
        const stored = window.localStorage.getItem('flashcardDeck');
        if (stored) {
          setDeck(JSON.parse(stored));
        }
      } catch {
        // Ignore
      }
      return;
    }

    const initializeAndSubscribe = async () => {
      try {
        await initializeUserData(currentUser.uid, {
          email: currentUser.email,
          displayName: currentUser.displayName,
        });

        const unsubscribe = subscribeToUserData(currentUser.uid, (userData) => {
          if (userData && userData.flashcards) {
            const loadedDeck = userData.flashcards.deck || [];
            // Only update if this is initial load or if we haven't saved recently
            if (isInitialLoadRef.current) {
              setDeck(loadedDeck);
              isInitialLoadRef.current = false;
            } else {
              const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
              if (!isUpdatingRef.current && timeSinceLastSave > 2000) {
                setDeck(loadedDeck);
              }
            }
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading flashcards:', error);
        return () => {};
      }
    };

    let unsubscribe;
    initializeAndSubscribe().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
      isInitialLoadRef.current = true;
    };
  }, [currentUser]);

  // Save flashcards to Firebase or localStorage (debounced)
  useEffect(() => {
    // Skip if initial load
    if (isInitialLoadRef.current && currentUser) {
      return;
    }

    // Skip if deck is empty and we're just initializing
    if (deck.length === 0 && isInitialLoadRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (currentUser) {
        isUpdatingRef.current = true;
        lastSaveTimeRef.current = Date.now();
        updateFlashcardsData(currentUser.uid, { deck })
          .then(() => {
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 1000);
          })
          .catch((error) => {
            console.error('Failed to save flashcards:', error);
            isUpdatingRef.current = false;
          });
      } else {
        try {
          window.localStorage.setItem('flashcardDeck', JSON.stringify(deck));
        } catch (error) {
          console.warn('Failed to persist flashcards', error);
        }
      }
    }, 500); // Debounce by 500ms

    return () => clearTimeout(timeoutId);
  }, [deck, currentUser]);

  const currentCard = deck[currentCardIndex];
  const progress = deck.length ? ((currentCardIndex + 1) / deck.length) * 100 : 0;

  useEffect(() => {
    if (currentCardIndex >= deck.length) {
      setCurrentCardIndex(0);
    }
  }, [deck.length, currentCardIndex]);

  useEffect(() => {
    if (!deck.length && view === 'study') {
      setView('overview');
    }
  }, [deck.length, view]);

  const handleRating = (rating) => {
    recordFlashcardReview(rating >= 3);
    setRatedCards((prev) => new Set(prev.add(deck[currentCardIndex]?.id)));
    // Move to next card after a short delay
    setTimeout(() => {
      if (currentCardIndex < deck.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
      } else {
        alert('Great job! You\'ve completed all cards!');
        setView('overview');
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setRatedCards(new Set());
      }
    }, 300);
  };

  const handleNext = () => {
    if (currentCardIndex < deck.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const parseGeneratedCards = (result) => {
    const lines = result.split('\n').filter((line) => line.trim());
    const newCards = [];
    let current = { front: '', back: '' };

    lines.forEach((line) => {
      if (line.toLowerCase().startsWith('front:')) {
        current.front = line.replace(/front:/i, '').trim();
      } else if (line.toLowerCase().startsWith('back:')) {
        current.back = line.replace(/back:/i, '').trim();
        if (current.front && current.back) {
          newCards.push({ ...current });
          current = { front: '', back: '' };
        }
      }
    });

    return newCards;
  };

  const handleGenerateFromNotes = async () => {
    if (!notesInput.trim()) {
      setNotesError('Add some notes before generating flashcards.');
      return;
    }

    setNotesError('');
    setGenerationError('');
    setGenerationStatus('');
    setIsGenerating(true);

    const prompt = [
      'Create concise flashcards from the following study notes.',
      'Return each card using the exact format:',
      'Front: [question or prompt]',
      'Back: [answer in 1-3 sentences]',
      '--- Notes ---',
      notesInput.trim(),
    ].join('\n');

    try {
      const result = await chatCompletion(prompt);
      const aiResponse = result.choices?.[0]?.message?.content || result.content || '';

      if (!aiResponse.trim()) {
        throw new Error('AI did not return any content. Try again with more detailed notes.');
      }

      const generatedCards = parseGeneratedCards(aiResponse);

      if (!generatedCards.length) {
        throw new Error('Could not parse any flashcards from the AI response. Try refining your notes or adding clearer bullet points.');
      }

      const cardsWithIds = generatedCards.map((card, idx) => ({
        id: Date.now() + idx,
        front: card.front,
        back: card.back,
      }));

      setDeck((prev) => [...prev, ...cardsWithIds]);
      setNotesInput('');
      setGenerationStatus(`Generated ${cardsWithIds.length} new flashcards!`);
      recordAIInteraction();
    } catch (error) {
      console.error('Flashcard generation error:', error);
      setGenerationError(error.message || 'Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (view !== 'study') return;
    
    const handleKeyPress = (e) => {
      if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
        if (isFlipped) {
          handleRating(parseInt(e.key));
        }
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(!isFlipped);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [view, isFlipped, currentCardIndex, deck.length]);

  if (view === 'study') {
    const card = deck[currentCardIndex];
    if (!card) {
      setView('overview');
      return null;
    }
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Flashcards Study Session</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Cards reviewed: {ratedCards.size}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setView('overview');
                setCurrentCardIndex(0);
                setIsFlipped(false);
              }}
            >
              <X className="h-4 w-4 mr-2" /> End Session
            </Button>
          </div>
        </div>

        {/* Card Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            disabled={currentCardIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Card {currentCardIndex + 1} of {deck.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={currentCardIndex === deck.length - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Card */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCardIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl aspect-video"
            >
              <FlashcardFlip
                front={card.front}
                back={card.back}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
                onExplain={(front, back) => {
                  setAiModalTitle('AI Explanation');
                  setAiModalPrompt(`Explain "${front}" in detail. The answer key is: ${back}`);
                  setIsAIModalOpen(true);
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border p-4">
          <div className="max-w-2xl mx-auto">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm font-medium">
                {currentCardIndex + 1} / {deck.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleRating(1)}
                  disabled={!isFlipped}
                >
                  1. Again
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleRating(2)}
                  disabled={!isFlipped}
                >
                  2. Hard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleRating(3)}
                  disabled={!isFlipped}
                >
                  3. Good
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleRating(4)}
                  disabled={!isFlipped}
                >
                  4. Easy
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press Space or click to flip • Use 1-4 to rate (after flipping) • Arrow keys to navigate
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredDeck = deck.filter(card => 
    card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.back.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Flashcards</h1>
            <p className="text-muted-foreground mt-1">
              Paste notes on the left; AI generates cards. Your deck appears on the right.
            </p>
          </div>
          <Button
            onClick={() => setView('study')}
            disabled={!deck.length}
            size="lg"
            className="h-11 shrink-0"
          >
            <Play className="h-5 w-5 mr-2" /> Start Studying
          </Button>
        </div>

        {/* Two columns: input (left) and deck (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Your input — paste notes & generate */}
          <Card className="flex flex-col lg:max-h-[calc(100vh-12rem)]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create from notes
              </CardTitle>
              <CardDescription>
                Paste notes, bullet points, or a transcript. AI will turn them into flashcards.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
              <Textarea
                placeholder="Paste your notes here... (e.g., lecture notes, textbook summaries)"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="min-h-[140px] text-base resize-y flex-1"
              />
              {notesError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {notesError}
                </div>
              )}
              {generationError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {generationError}
                </div>
              )}
              {generationStatus && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600 dark:text-green-400">
                  {generationStatus}
                </div>
              )}
              <SparkleButton
                onClick={handleGenerateFromNotes}
                disabled={isGenerating || !notesInput.trim()}
                loading={isGenerating}
                className="w-full"
              >
                Generate
              </SparkleButton>
            </CardContent>
          </Card>

          {/* Right: Your deck — search and cards */}
          <Card className="flex flex-col lg:max-h-[calc(100vh-12rem)] min-h-[320px]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Your deck</CardTitle>
                  <CardDescription>
                    {deck.length
                      ? `${deck.length} card${deck.length === 1 ? '' : 's'} ready to study`
                      : 'Generated cards will appear here'}
                  </CardDescription>
                </div>
              </div>
              {deck.length > 0 && (
                <Input
                  id="flashcard-search"
                  placeholder="Search cards..."
                  className="w-full sm:w-48 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-auto min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredDeck.length > 0 ? (
                  filteredDeck.map((card) => (
                    <Card
                      key={card.id}
                      className="p-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors line-clamp-2"
                      onClick={() => {
                        const index = deck.findIndex((item) => item.id === card.id);
                        if (index >= 0) {
                          setCurrentCardIndex(index);
                          setView('study');
                        }
                      }}
                    >
                      {card.front}
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    {deck.length
                      ? 'No cards match your search.'
                      : 'Paste notes on the left and click Generate to create flashcards.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => {
          setIsAIModalOpen(false);
          setAiModalPrompt('');
        }}
        title={aiModalTitle}
        initialPrompt={aiModalPrompt}
      />
    </div>
  );
};


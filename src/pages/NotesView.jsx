import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  CheckSquare2,
  Code,
  Sigma,
  GitMerge,
  Quote,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AIModal } from '../components/AIModal';
import { summarizeContent, explainConcept, simplifyContent, generateFlashcards, generateQuizQuestions } from '../lib/aiHelpers';
import { stripMarkdown } from '../lib/utils';

const NoteEditorToolbar = ({ onAIAction }) => {
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAIDropdown(false);
      }
    };

    if (showAIDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAIDropdown]);

  return (
    <div className="sticky top-16 z-10 bg-card border-b border-border p-2 flex flex-wrap items-center gap-1">
    <Button variant="ghost" size="icon">
      <Bold className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <Italic className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <Underline className="h-4 w-4" />
    </Button>
    <div className="w-px h-6 bg-border mx-1" />
    <Button variant="ghost" size="icon">
      <List className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <ListOrdered className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <CheckSquare2 className="h-4 w-4" />
    </Button>
    <div className="w-px h-6 bg-border mx-1" />
    <Button variant="ghost" size="icon">
      <Code className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <Sigma className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <GitMerge className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <Quote className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <ImageIcon className="h-4 w-4" />
    </Button>
    <div className="w-px h-6 bg-border mx-1" />
    <div className="ml-auto relative" ref={dropdownRef}>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowAIDropdown(!showAIDropdown)}
      >
        <Sparkles className="h-4 w-4 mr-2" /> AI Tools
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>
      {showAIDropdown && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg z-50 min-w-[200px]">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onAIAction('summarize');
              setShowAIDropdown(false);
            }}
          >
            Summarize
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onAIAction('explain');
              setShowAIDropdown(false);
            }}
          >
            Explain
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onAIAction('simplify');
              setShowAIDropdown(false);
            }}
          >
            Simplify
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onAIAction('flashcards');
              setShowAIDropdown(false);
            }}
          >
            Generate Flashcards
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onAIAction('quiz');
              setShowAIDropdown(false);
            }}
          >
            Create Quiz
          </Button>
        </div>
      )}
    </div>
  </div>
  );
};

const sections = [
  { id: 'section-1', title: 'Introduction to Calculus', level: 0 },
  { id: 'section-2', title: 'Derivatives', level: 1 },
  { id: 'section-3', title: 'Limits and Continuity', level: 2 },
  { id: 'section-4', title: 'Integration Techniques', level: 1 },
  { id: 'section-5', title: 'Conclusion', level: 0 },
];

export const NotesView = () => {
  const [activeSection, setActiveSection] = useState('section-1');
  const [lastSaved, setLastSaved] = useState(Date.now());
  const [content, setContent] = useState('');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiAction, setAiAction] = useState(null);
  const [aiModalTitle, setAiModalTitle] = useState('AI Assistant');
  const [aiModalPrompt, setAiModalPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const editorRef = useRef(null);
  const contentRef = useRef(null);

  // Auto-save simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSaved(Date.now());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Scroll sync for table of contents
  useEffect(() => {
    const handleScroll = () => {
      const sectionsElements = sections.map(s => document.getElementById(s.id)).filter(Boolean);
      const scrollPosition = window.scrollY + 100;

      for (let i = sectionsElements.length - 1; i >= 0; i--) {
        const element = sectionsElements[i];
        if (element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    const scrollContainer = contentRef.current?.parentElement;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const handleAIAction = (action) => {
    setAiAction(action);
    const noteContent = editorRef.current?.textContent || content || 'No content available.';
    let prompt = '';
    let title = 'AI Assistant';

    switch (action) {
      case 'summarize':
        title = 'Summarize Note';
        prompt = `Summarize the following content in 3-5 bullet points:\n\n${noteContent.substring(0, 2000)}`;
        break;
      case 'explain':
        title = 'Explain Concept';
        prompt = `Explain the main concepts in this note in simple terms:\n\n${noteContent.substring(0, 2000)}`;
        break;
      case 'simplify':
        title = 'Simplify Note';
        prompt = `Simplify and rewrite the following content to make it easier to understand:\n\n${noteContent.substring(0, 2000)}`;
        break;
      case 'flashcards':
        title = 'Generate Flashcards';
        prompt = `Generate 5 flashcards based on this content. Format each flashcard as:\nFront: [question]\nBack: [answer]\n\nContent: ${noteContent.substring(0, 2000)}`;
        break;
      case 'quiz':
        title = 'Create Quiz';
        prompt = `Generate 5 quiz questions based on this content. Format as:\n1. [Question]\n   A) [Option 1]\n   B) [Option 2]\n   C) [Option 3]\n   D) [Option 4]\n   Correct: [Letter]\n\nContent: ${noteContent.substring(0, 2000)}`;
        break;
      default:
        prompt = 'How can I help you with this note?';
    }
    
    setAiModalTitle(title);
    setAiModalPrompt(prompt);
    setAiResult('');
    setIsAIModalOpen(true);
  };

  return (
    <>
    <div className="flex h-[calc(100vh-64px)]">
      {/* Table of Contents */}
      <nav className="hidden md:block w-64 border-r border-border p-4 overflow-y-auto">
        <h3 className="font-semibold text-sm mb-2">On this page</h3>
        <ul className="space-y-1 text-sm">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(section.id);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`block p-1 rounded-md transition-colors ${
                  activeSection === section.id
                    ? 'text-foreground font-medium bg-accent'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ paddingLeft: `${section.level * 0.5 + 0.25}rem` }}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Editor */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <NoteEditorToolbar onAIAction={handleAIAction} />
        <div className="max-w-3xl mx-auto p-8 prose dark:prose-invert prose-lg">
          <span className="text-sm text-muted-foreground">Saved {formatTimeAgo(lastSaved)}</span>
          <div 
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="focus:outline-none min-h-[500px]"
            onInput={(e) => setContent(e.target.textContent)}
          >
            <h1 id="section-1">Introduction to Calculus</h1>
            <p>
              Calculus is the mathematical study of continuous change, focusing on
              derivatives and integrals. It's a fundamental branch of mathematics that
              enables us to understand rates of change and accumulation.
            </p>
            <h2 id="section-2">Derivatives</h2>
            <p>
              A derivative represents the rate of change of a function with respect to
              one of its variables. It measures how a function's output value changes
              as its input value changes, providing the slope of the tangent line at
              any point on the function's graph.
            </p>
            <div className="bg-muted p-4 rounded-md">
              <p>
                <strong>Example Callout:</strong> For a function{' '}
                <code>f(x) = x²</code>, the derivative is{' '}
                <code>f'(x) = 2x</code>.
              </p>
            </div>
            <h3 id="section-3">Limits and Continuity</h3>
            <p>
              A limit describes the behavior of a function as its input approaches a
              particular value. Continuity means that small changes in the input result
              in small changes in the output, with no sudden jumps or breaks.
            </p>
            <pre>
              <code className="language-js">{`// Limit definition of derivative
lim(h→0) [f(x+h) - f(x)] / h`}</code>
            </pre>
            <h2 id="section-4">Integration Techniques</h2>
            <p>
              Integration is the process of finding the integral of a function, which
              represents the area under a curve or the accumulation of quantities.
              Common techniques include substitution, integration by parts, and
              partial fractions.
            </p>
        </div>
      </div>
    </div>
    </div>
    
    <AIModal
      isOpen={isAIModalOpen}
      onClose={() => {
        setIsAIModalOpen(false);
        setAiResult('');
        setAiAction(null);
      }}
      title={aiModalTitle}
      initialPrompt={aiModalPrompt}
      onResult={(result) => {
        setAiResult(result);
        setIsAIModalOpen(false);
      }}
    />
    
    {aiResult && !isAIModalOpen && aiAction && (
      <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg max-w-md z-50 max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">
          {aiAction === 'summarize' ? 'Summary' : 
           aiAction === 'explain' ? 'Explanation' :
           aiAction === 'simplify' ? 'Simplified Content' :
           aiAction === 'flashcards' ? 'Generated Flashcards' :
           aiAction === 'quiz' ? 'Quiz Questions' : 'AI Result'}
        </h3>
        <p className="text-sm whitespace-pre-wrap">{stripMarkdown(aiResult)}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => {
            setAiResult('');
            setAiAction(null);
          }}
        >
          Close
        </Button>
      </div>
    )}
    </>
  );
};


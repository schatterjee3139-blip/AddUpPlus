import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightSidebar } from './components/layout/RightSidebar';
import { MainHeader } from './components/layout/MainHeader';
import { CommandPalette } from './components/CommandPalette';
import { Button } from './components/ui/Button';
import { Dashboard } from './pages/Dashboard';
import { NotesView } from './pages/NotesView';
import { FlashcardView } from './pages/FlashcardView';
import { QuizView } from './pages/QuizView';
import { ConceptMapView } from './pages/ConceptMapView';
import { PlannerView } from './pages/PlannerView';
import { AnalyticsView } from './pages/AnalyticsView';
import { SettingsView } from './pages/SettingsView';
import { CoursesView } from './pages/CoursesView';
import { CourseCatalogProvider } from './contexts/CourseCatalogContext.jsx';
import { WorkspaceView } from './pages/WorkspaceView';
import { EquationsView } from './pages/EquationsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/Card';
import { Input } from './components/ui/Input';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('today');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('studyOSSignedUp') === 'true';
    } catch {
      return false;
    }
  });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const userProfile = useMemo(() => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirst && !trimmedLast && !trimmedEmail) {
      return null;
    }

    return {
      firstName: trimmedFirst,
      lastName: trimmedLast,
      email: trimmedEmail,
    };
  }, [firstName, lastName, email]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedProfile = window.localStorage.getItem('studyOSUserProfile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setFirstName(parsed.firstName || '');
        setLastName(parsed.lastName || '');
        setEmail(parsed.email || '');
      }
    } catch (error) {
      console.warn('Failed to load stored profile', error);
    }
  }, []);

  // Command Palette (⌘K) listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((isOpen) => !isOpen);
      }
      // Close with Escape
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  const handleCommandPaletteClose = () => {
    setIsCommandPaletteOpen(false);
  };

  const handleSignupSubmit = (event) => {
    event.preventDefault();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirst || !trimmedLast || !trimmedEmail) {
      setFormError('Please fill in all fields before continuing.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('studyOSSignedUp', 'true');
        window.localStorage.setItem(
          'studyOSUserProfile',
          JSON.stringify({
            firstName: trimmedFirst,
            lastName: trimmedLast,
            email: trimmedEmail,
          })
        );
      }
    } catch (error) {
      console.warn('Failed to persist signup info', error);
    }

    setFirstName(trimmedFirst);
    setLastName(trimmedLast);
    setEmail(trimmedEmail);
    setFormError('');
    setIsSignedUp(true);
  };

  const getBreadcrumbs = () => {
    switch (currentPage) {
      case 'today':
        return ['Home', 'Today'];
      case 'notes':
        return ['Home', 'AP Chem', 'Unit 4', 'Kinetics'];
      case 'flashcards':
        return ['Home', 'Flashcards', 'AP Chem'];
      case 'quizzes':
        return ['Home', 'Quizzes', 'New Quiz'];
      case 'concepts':
        return ['Home', 'Concept Maps', 'Kinetics'];
      case 'equations':
        return ['Home', 'Equations'];
      case 'planner':
        return ['Home', 'Planner'];
      case 'analytics':
        return ['Home', 'Analytics'];
      case 'courses':
        return ['Home', 'Courses'];
      case 'workspace':
        return ['Home', 'Workspace'];
      case 'settings':
        return ['Home', 'Settings'];
      default:
        return ['Home'];
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'today':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'notes':
        return <NotesView />;
      case 'flashcards':
        return <FlashcardView />;
      case 'quizzes':
        return <QuizView />;
      case 'concepts':
        return <ConceptMapView />;
      case 'equations':
        return <EquationsView />;
      case 'planner':
        return <PlannerView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'courses':
        return <CoursesView onNavigate={setCurrentPage} />;
      case 'workspace':
        return (
          <WorkspaceView
            onNavigate={(page) => {
              if (!page) {
                setCurrentPage('courses');
                return;
              }
              const knownPages = [
                'today',
                'courses',
                'flashcards',
                'quizzes',
                'concepts',
                'planner',
                'analytics',
                'notes',
                'settings',
                'workspace',
              ];
              setCurrentPage(knownPages.includes(page) ? page : 'courses');
            }}
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  if (!isSignedUp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 text-foreground">
        <Card className="w-full max-w-xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl font-semibold">Welcome to Study OS</CardTitle>
            <CardDescription className="text-base">
              Sign up to personalize your workspace and sync your study tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSignupSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">
                    First name
                  </label>
                  <Input
                    id="firstName"
                    placeholder="Ada"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">
                    Last name
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Lovelace"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </div>

              {formError && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              )}

              <div className="space-y-3">
                <Button type="submit" className="w-full">
                  Sign up
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By continuing you agree to our demo privacy guidelines.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <LeftSidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        isCollapsed={isSidebarCollapsed}
        onCollapseChange={setIsSidebarCollapsed}
        userProfile={userProfile}
      />

      <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out xl:mr-80 ${
        isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-60'
      }`}>
        <MainHeader breadcrumbs={getBreadcrumbs()} />
        <div className="h-[calc(100vh-64px)] overflow-y-auto">
          {renderPage()}
        </div>
      </main>

      <RightSidebar />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={handleCommandPaletteClose}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
      />

      {/* Mobile Right Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 xl:hidden"
        onClick={() => alert('Mobile AI/Details sidebar clicked. Not implemented in this demo.')}
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="study-os-theme">
      <CourseCatalogProvider>
        <AppContent />
      </CourseCatalogProvider>
    </ThemeProvider>
  );
}


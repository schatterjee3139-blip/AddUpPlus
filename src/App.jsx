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
import { PlannerView } from './pages/PlannerView';
import { AnalyticsView } from './pages/AnalyticsView';
import { SettingsView } from './pages/SettingsView';
import { CoursesView } from './pages/CoursesView';
import { CourseCatalogProvider } from './contexts/CourseCatalogContext.jsx';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { WorkspaceView } from './pages/WorkspaceView';
import { EquationsView } from './pages/EquationsView';
import { TutorsView } from './pages/TutorsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AppContentInner = () => {
  const { currentUser, login, signup, signInWithGoogle, logout, signInAsGuest } = useAuth();
  const [currentPage, setCurrentPage] = useState('today');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { rightSidebarWidth } = useSidebar();
  const [isXlScreen, setIsXlScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsXlScreen(window.innerWidth >= 1280);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth form state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setAuthError('Please fill in all fields.');
      setAuthLoading(false);
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setAuthError('Please enter a valid email address.');
      setAuthLoading(false);
      return;
    }

    if (trimmedPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      setAuthLoading(false);
      return;
    }

    try {
      if (isLoginMode) {
        await login(trimmedEmail, trimmedPassword);
      } else {
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        if (!trimmedFirst || !trimmedLast) {
          setAuthError('Please fill in all fields.');
          setAuthLoading(false);
          return;
        }
        await signup(trimmedEmail, trimmedPassword, trimmedFirst, trimmedLast);
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInAsGuest();
    } catch (error) {
      setAuthError(error.message || 'Guest sign-in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const getBreadcrumbs = () => {
    switch (currentPage) {
      case 'today':
        return ['Home', 'Today'];
      case 'notes':
        return ['Home', 'Flashcards', 'Unit 4'];
      case 'flashcards':
        return ['Home', 'Flashcards', 'AP Chem'];
      case 'quizzes':
        return ['Home', 'Quizzes', 'New Quiz'];
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
      case 'tutors':
        return ['Home', 'Tutors'];
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
      case 'equations':
        return <EquationsView />;
      case 'planner':
        return <PlannerView />;
      case 'tutors':
        return <TutorsView />;
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

  // Show auth screen only if user is not logged in and not a guest
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 text-foreground">
        <Card className="w-full max-w-xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl font-semibold">Welcome to Study OS</CardTitle>
            <CardDescription className="text-base">
              {isLoginMode ? 'Sign in to access your study data' : 'Sign up to personalize your workspace and sync your study tools.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleAuthSubmit}>
              {!isLoginMode && (
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
                      disabled={authLoading}
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
                      disabled={authLoading}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ada@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  disabled={authLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isLoginMode ? "current-password" : "new-password"}
                  disabled={authLoading}
                />
              </div>
              {authError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {authError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLoginMode ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  isLoginMode ? 'Sign In' : 'Sign Up'
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {authLoading ? 'Signing in...' : 'Sign in with Google'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGuestSignIn}
                disabled={authLoading}
              >
                Continue as Guest
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setAuthError('');
                  }}
                  className="text-primary hover:underline"
                  disabled={authLoading}
                >
                  {isLoginMode ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
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
        userProfile={currentUser ? {
          firstName: currentUser.displayName?.split(' ')[0] || '',
          lastName: currentUser.displayName?.split(' ')[1] || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || null,
        } : null}
      />

      <main 
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out xl:mr-0 ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-60'
        }`}
        style={{ 
          marginRight: isXlScreen ? `${rightSidebarWidth}px` : undefined
        }}
      >
        <MainHeader 
        breadcrumbs={getBreadcrumbs()} 
        onSearch={(query) => {
          // Handle search
        }}
        onNavigate={setCurrentPage}
      />
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

const AppContent = () => {
  return (
    <SidebarProvider>
      <AppContentInner />
    </SidebarProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="study-os-theme">
      <NotificationsProvider>
        <CourseCatalogProvider>
          <AppContent />
        </CourseCatalogProvider>
      </NotificationsProvider>
    </ThemeProvider>
  );
}


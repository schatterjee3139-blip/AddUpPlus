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
import { StudyPlanView } from './pages/StudyPlanView';
import TeacherProfileView from './pages/TeacherProfileView';
import { VideoCallView } from './pages/VideoCallView';
import { LoginView } from './pages/LoginView';
import { TutorDashboard } from './pages/TutorDashboard';
import { PhysicsMechanicsView } from './pages/PhysicsMechanicsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { useAuth } from './contexts/AuthContext';
import { Loader2, GraduationCap, User } from 'lucide-react';
import { getUserData, updateUserRole } from './lib/firestore';

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
  const [userRole, setUserRole] = useState(null); // 'tutor' or 'student'
  const [roleLoading, setRoleLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState(null); // Selected tutor for login
  const [showTutorSelection, setShowTutorSelection] = useState(false);

  // Load user role from Firestore or sessionStorage
  useEffect(() => {
    const loadUserRole = async () => {
      if (!currentUser || currentUser.isGuest) {
        // Check sessionStorage for guest users
        const sessionRole = sessionStorage.getItem('isTutor');
        if (sessionRole === 'true') {
          setUserRole('tutor');
        } else {
          setUserRole('student');
        }
        setRoleLoading(false);
        return;
      }

      try {
        // First check sessionStorage (faster)
        const sessionRole = sessionStorage.getItem('isTutor');
        if (sessionRole === 'true') {
          setUserRole('tutor');
        } else if (sessionRole === 'false') {
          setUserRole('student');
        }

        // Then load from Firestore (persistent)
        const userData = await getUserData(currentUser.uid);
        if (userData?.role) {
          setUserRole(userData.role);
          // Sync sessionStorage
          sessionStorage.setItem('isTutor', userData.role === 'tutor' ? 'true' : 'false');
        } else if (!sessionRole) {
          // Default to student if no role set
          setUserRole('student');
        }
      } catch (error) {
        console.error('Error loading user role:', error);
        // Fallback to sessionStorage
        const sessionRole = sessionStorage.getItem('isTutor');
        setUserRole(sessionRole === 'true' ? 'tutor' : 'student');
      } finally {
        setRoleLoading(false);
      }
    };

    loadUserRole();
  }, [currentUser]);

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

  const handleAuthSubmit = async (event, role) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // For tutors, validate password is "tutor"
    if (role === 'tutor') {
      if (trimmedPassword !== 'tutor') {
        setAuthError('Invalid tutor password. Please enter "tutor".');
        setAuthLoading(false);
        return;
      }
      if (!selectedTutor) {
        setAuthError('Please select a tutor account.');
        setAuthLoading(false);
        return;
      }
    } else {
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
    }
    
    // Store role if provided
    if (role) {
      sessionStorage.setItem('isTutor', role === 'tutor' ? 'true' : 'false');
      setUserRole(role);
    }

    try {
      if (role === 'tutor') {
        // For tutors, use simple password check (no Firebase)
        if (trimmedPassword !== 'tutor') {
          setAuthError('Invalid tutor password. Please enter "tutor".');
          setAuthLoading(false);
          return;
        }
        
        if (!selectedTutor) {
          setAuthError('Please select a tutor account.');
          setAuthLoading(false);
          return;
        }

        // Create a simple tutor user object (no Firebase auth)
        const tutorUser = {
          uid: `tutor_${selectedTutor.id}`,
          email: selectedTutor.email,
          displayName: selectedTutor.name,
          photoURL: null,
          isTutor: true,
          tutorInfo: {
            id: selectedTutor.id,
            name: selectedTutor.name,
            subject: selectedTutor.subject,
          },
        };

        // Store tutor info in sessionStorage
        sessionStorage.setItem('tutorUser', JSON.stringify(tutorUser));
        sessionStorage.setItem('isTutor', 'true');
        setUserRole('tutor');
        
        // Set the user in auth context (we'll need to update AuthContext to handle this)
        // For now, we'll use a custom approach
        window.dispatchEvent(new CustomEvent('tutor-login', { detail: tutorUser }));
        
        // Clear form
        setPassword('');
        setSelectedTutor(null);
        setShowTutorSelection(false);
        setAuthLoading(false);
        return;
      } else if (isLoginMode) {
        // For students, login if in login mode
        const userCredential = await login(trimmedEmail, trimmedPassword);
        // Save role to Firestore after login
        if (role && userCredential?.user?.uid) {
          await updateUserRole(userCredential.user.uid, role);
        }
      } else {
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        if (!trimmedFirst || !trimmedLast) {
          setAuthError('Please fill in all fields.');
          setAuthLoading(false);
          return;
        }
        const userCredential = await signup(trimmedEmail, trimmedPassword, trimmedFirst, trimmedLast);
        // Save role to Firestore after signup
        if (role && userCredential?.user?.uid) {
          await updateUserRole(userCredential.user.uid, role);
        }
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

  const handleGoogleSignIn = async (role) => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const userCredential = await signInWithGoogle();
      // Store role in sessionStorage after successful sign-in
      if (role) {
        sessionStorage.setItem('isTutor', role === 'tutor' ? 'true' : 'false');
        setUserRole(role);
        // Save role to Firestore
        if (userCredential?.user?.uid) {
          await updateUserRole(userCredential.user.uid, role);
        }
      }
    } catch (error) {
      setAuthError(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestSignIn = async (role) => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInAsGuest();
      // Store role in sessionStorage after successful sign-in
      if (role) {
        sessionStorage.setItem('isTutor', role === 'tutor' ? 'true' : 'false');
        setUserRole(role);
      }
    } catch (error) {
      setAuthError(error.message || 'Guest sign-in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const getBreadcrumbs = () => {
    // Tutor dashboard breadcrumbs
    if (userRole === 'tutor' && (currentPage === 'today' || !currentPage)) {
      return ['Home', 'Tutor Dashboard'];
    }
    
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
      case 'study-plan':
        return ['Home', 'Study Plan'];
      case 'teacher-profiles':
        return ['Home', 'Teacher Profiles'];
      case 'video':
        return ['Home', 'Video Call'];
      case 'login':
        return ['Home', 'Login'];
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
    // If user is a tutor, show tutor dashboard for 'today' page
    if (userRole === 'tutor' && (currentPage === 'today' || !currentPage)) {
      return <TutorDashboard />;
    }

    // Extract base page name (handle query params like "video?tutor=true")
    const basePage = currentPage?.split('?')[0] || currentPage;
    
    switch (basePage) {
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
      case 'study-plan':
        return <StudyPlanView />;
      case 'teacher-profiles':
        return <TeacherProfileView />;
      case 'video':
        return <VideoCallView onNavigate={setCurrentPage} currentPage={currentPage} />;
      case 'login':
        return <LoginView onNavigate={setCurrentPage} />;
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
      case 'physics-mechanics':
      case 'physics-sim':
        return <PhysicsMechanicsView onNavigate={setCurrentPage} />;
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
            <CardTitle className="text-3xl font-semibold">Welcome to AddUp+</CardTitle>
            <CardDescription className="text-base">
              {isLoginMode ? 'Sign in to access your study data' : 'Sign up to personalize your workspace and sync your study tools.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role Selection */}
            <div className="mb-6 space-y-3">
              <label className="text-sm font-medium text-muted-foreground block">
                Select your role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUserRole('tutor');
                    setShowTutorSelection(true);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    userRole === 'tutor'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={authLoading}
                >
                  <GraduationCap className={`h-6 w-6 mx-auto mb-2 ${
                    userRole === 'tutor' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div className="text-sm font-medium">Tutor</div>
                  <div className="text-xs text-muted-foreground mt-1">Room owner</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserRole('student')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    userRole === 'student'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={authLoading}
                >
                  <User className={`h-6 w-6 mx-auto mb-2 ${
                    userRole === 'student' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div className="text-sm font-medium">Student</div>
                  <div className="text-xs text-muted-foreground mt-1">Participant</div>
                </button>
              </div>
            </div>

            {/* Tutor Selection Screen */}
            {userRole === 'tutor' && showTutorSelection && !selectedTutor && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Select your tutor account</p>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'tutor-3', name: 'Srish Chaterjee', email: 'srish@tutor.addupplus.com', subject: 'Mathematics & Software Development' },
                    { id: 'tutor-2', name: 'Zaid Hareb', email: 'zaid@tutor.addupplus.com', subject: 'Mathematics & Programming' },
                    { id: 'tutor-1', name: 'Alex Huang', email: 'alex@tutor.addupplus.com', subject: 'Mathematics & Computer Science' },
                  ].map((tutor) => (
                    <button
                      key={tutor.id}
                      type="button"
                      onClick={() => {
                        setSelectedTutor(tutor);
                        setEmail(tutor.email);
                        setPassword('');
                      }}
                      className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all text-left"
                    >
                      <div className="font-semibold">{tutor.name}</div>
                      <div className="text-sm text-muted-foreground">{tutor.subject}</div>
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setUserRole(null);
                    setShowTutorSelection(false);
                    setSelectedTutor(null);
                  }}
                >
                  ← Back
                </Button>
              </div>
            )}

            {/* Regular Auth Form (Students) or Tutor Password Form */}
            {(!userRole || userRole === 'student' || (userRole === 'tutor' && selectedTutor)) && (
              <form className="space-y-6" onSubmit={(e) => handleAuthSubmit(e, userRole)}>
                {userRole === 'tutor' && selectedTutor && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <div className="font-semibold">{selectedTutor.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedTutor.subject}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setSelectedTutor(null);
                        setEmail('');
                        setPassword('');
                      }}
                    >
                      ← Change tutor
                    </Button>
                  </div>
                )}

                {userRole !== 'tutor' && !isLoginMode && (
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

                {userRole !== 'tutor' && (
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
                      disabled={authLoading || userRole === 'tutor'}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={userRole === 'tutor' ? 'Enter tutor password' : '••••••••'}
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
                    userRole === 'tutor' ? 'Sign In as Tutor' : (isLoginMode ? 'Sign In' : 'Sign Up')
                  )}
                </Button>

                {/* Google Sign-in - Only for students */}
                {userRole !== 'tutor' && (
                  <>
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
                      onClick={() => handleGoogleSignIn('student')}
                      disabled={authLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                      {authLoading ? '...' : 'Google'}
                    </Button>
                  </>
                )}

                {userRole !== 'tutor' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleGuestSignIn('student')}
                      disabled={authLoading}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Guest
                    </Button>
                  </div>
                )}

                {userRole !== 'tutor' && (
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
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while role is being determined
  if (roleLoading && currentUser && !currentUser.isGuest) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
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
        userRole={userRole}
      />

      <main 
        className={`min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-60'
        } ${isXlScreen ? 'xl:mr-0' : 'flex-1'}`}
        style={isXlScreen ? { 
          width: `calc(100% - ${isSidebarCollapsed ? 80 : 240}px - ${rightSidebarWidth}px)`,
        } : {}}
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


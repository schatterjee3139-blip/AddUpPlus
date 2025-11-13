import React, { useState, useEffect } from 'react';
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

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('today');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <LeftSidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        isCollapsed={isSidebarCollapsed}
        onCollapseChange={setIsSidebarCollapsed}
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


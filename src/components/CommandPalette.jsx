import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  Layers,
  CheckSquare,
  LayoutDashboard,
  Settings,
  Sparkles,
  Pi,
  Briefcase,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { AIModal } from './AIModal';

export const CommandPalette = ({ isOpen, onClose, onNavigate, currentPage }) => {
  const [search, setSearch] = useState('');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const commands = [
    {
      name: 'Create new note',
      icon: FileText,
      action: () => {
        onNavigate('notes');
        onClose();
      },
    },
    {
      name: 'Create new deck',
      icon: Layers,
      action: () => {
        onNavigate('flashcards');
        onClose();
      },
    },
    {
      name: 'Take a quiz',
      icon: CheckSquare,
      action: () => {
        onNavigate('quizzes');
        onClose();
      },
    },
    {
      name: 'Browse equations library',
      icon: Pi,
      action: () => {
        onNavigate('equations');
        onClose();
      },
    },
    {
      name: 'Open course workspace',
      icon: Briefcase,
      action: () => {
        onNavigate('workspace');
        onClose();
      },
    },
    {
      name: 'Go to Dashboard',
      icon: LayoutDashboard,
      page: 'today',
      action: () => {
        onNavigate('today');
        onClose();
      },
    },
    {
      name: 'Go to Settings',
      icon: Settings,
      page: 'settings',
      action: () => {
        onNavigate('settings');
        onClose();
      },
    },
    {
      name: 'Ask AI about page',
      icon: Sparkles,
      action: () => {
        onClose();
        setIsAIModalOpen(true);
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
          >
            <Card className="shadow-2xl">
              <div className="flex items-center p-2 border-b border-border">
                <Search className="h-5 w-5 mx-2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search commands and pages..."
                  className="w-full p-2 bg-transparent focus:outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="p-2 max-h-64 overflow-y-auto">
                <h4 className="text-xs font-semibold text-muted-foreground p-2">
                  Commands
                </h4>
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((cmd) => (
                    <Button
                      key={cmd.name}
                      variant="ghost"
                      className="w-full justify-start p-3"
                      onClick={cmd.action}
                    >
                      <cmd.icon className="h-4 w-4 mr-3" />
                      {cmd.name}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    No results found.
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        </>
      )}
      
      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        title={`Ask AI about ${currentPage || 'this page'}`}
        initialPrompt={`Tell me about ${currentPage || 'this page'}. What can I do here?`}
      />
    </AnimatePresence>
  );
};



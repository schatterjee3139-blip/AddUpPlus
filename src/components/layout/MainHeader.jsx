import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Search, Plus, Bell, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { AIModal } from '../AIModal';

export const MainHeader = ({ breadcrumbs, onSearch }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
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
    <header className="flex items-center justify-between h-16 border-b border-border bg-card px-4 md:px-6 sticky top-0 z-10">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm font-medium text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
            <span
              className={
                index === breadcrumbs.length - 1
                  ? 'text-foreground'
                  : 'hover:text-foreground cursor-pointer'
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchOpen(false);
                  setSearchQuery('');
                }
              }}
            />
            <Button variant="ghost" size="sm" onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}>
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <div className="relative" ref={dropdownRef}>
              <Button 
                variant="outline"
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
                      setShowAIDropdown(false);
                      setIsAIModalOpen(true);
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" /> Ask AI
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setShowAIDropdown(false);
                      // Could add more AI tools here
                    }}
                  >
                    Generate Content
                  </Button>
                </div>
              )}
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> New
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
      
      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        title="AI Assistant"
      />
    </header>
  );
};


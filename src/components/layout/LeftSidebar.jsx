import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  CheckSquare,
  Network,
  Calendar,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Laptop,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Pi,
  Briefcase,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { TooltipWrapper } from '../ui/Tooltip';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

const navItems = [
  { name: 'Today', icon: LayoutDashboard, page: 'today' },
  { name: 'Courses', icon: BookOpen, page: 'courses' },
  { name: 'Workspace', icon: Briefcase, page: 'workspace' },
  { name: 'Flashcards', icon: Layers, page: 'flashcards' },
  { name: 'Quizzes', icon: CheckSquare, page: 'quizzes' },
  { name: 'Concept Maps', icon: Network, page: 'concepts' },
  { name: 'Equations', icon: Pi, page: 'equations' },
  { name: 'Planner', icon: Calendar, page: 'planner' },
  { name: 'Analytics', icon: BarChart3, page: 'analytics' },
  { name: 'Settings', icon: Settings, page: 'settings' },
];

const NavItem = ({ item, currentPage, onNavigate, isCollapsed }) => (
  <TooltipWrapper content={isCollapsed ? item.name : null}>
    <Button
      variant={currentPage === item.page ? 'secondary' : 'ghost'}
      className={cn(
        'w-full justify-start',
        isCollapsed ? 'justify-center' : 'justify-start'
      )}
      onClick={() => onNavigate(item.page)}
    >
      <item.icon className={cn('h-5 w-5', isCollapsed ? '' : 'mr-3')} />
      {!isCollapsed && <span>{item.name}</span>}
    </Button>
  </TooltipWrapper>
);

const ThemeToggle = ({ isCollapsed }) => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: 'Light', value: 'light', icon: Sun },
    { name: 'Dark', value: 'dark', icon: Moon },
    { name: 'System', value: 'system', icon: Laptop },
  ];

  const currentTheme = themes.find((t) => t.value === theme);
  const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];

  return (
    <TooltipWrapper
      content={
        isCollapsed ? `Toggle theme (${nextTheme.name})` : `Toggle theme`
      }
    >
      <Button
        variant="ghost"
        size={isCollapsed ? 'icon' : 'default'}
        className={cn('w-full', isCollapsed ? '' : 'justify-start')}
        onClick={() => setTheme(nextTheme.value)}
      >
        <currentTheme.icon className={cn('h-5 w-5', isCollapsed ? '' : 'mr-3')} />
        {!isCollapsed && <span>{currentTheme.name}</span>}
      </Button>
    </TooltipWrapper>
  );
};

export const LeftSidebar = ({
  currentPage,
  onNavigate,
  isCollapsed = false,
  onCollapseChange,
  userProfile = null,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const displayName = [
    userProfile?.firstName?.trim(),
    userProfile?.lastName?.trim(),
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Learner';

  const initials = (
    (userProfile?.firstName?.[0] || '') + (userProfile?.lastName?.[0] || '')
  )
    .toUpperCase()
    .slice(0, 2) || displayName.slice(0, 1).toUpperCase();

  const userEmail = userProfile?.email?.trim() || '';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={cn(
          'flex items-center h-16 px-4',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-primary whitespace-nowrap">
            Study OS
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapseChange && onCollapseChange(!isCollapsed)}
          className="hidden lg:flex"
        >
          {isCollapsed ? (
            <ChevronsRight className="h-5 w-5" />
          ) : (
            <ChevronsLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            currentPage={currentPage}
            onNavigate={(page) => {
              onNavigate(page);
              setIsMobileOpen(false);
            }}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-2 space-y-2 border-t border-border">
        <ThemeToggle isCollapsed={isCollapsed} />
        <TooltipWrapper content={isCollapsed ? displayName : null}>
          <Button
            variant="ghost"
            className={cn('w-full', isCollapsed ? 'justify-center' : 'justify-start')}
          >
            <Avatar className="h-8 w-8">
              {userProfile?.avatarUrl ? (
                <AvatarImage src={userProfile.avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <span className="ml-3 flex flex-col text-left">
                <span className="font-medium leading-tight">{displayName}</span>
                {userEmail && (
                  <span className="text-xs text-muted-foreground leading-tight">
                    {userEmail}
                  </span>
                )}
              </span>
            )}
          </Button>
        </TooltipWrapper>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-64 bg-card border-r border-border lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:block fixed top-0 left-0 h-screen border-r border-border bg-card transition-all duration-300 ease-in-out z-10',
          isCollapsed ? 'w-20' : 'w-60'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
};


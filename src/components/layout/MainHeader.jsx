import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Plus, Bell, CheckSquare, Layers, FileText, X, Target, GraduationCap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { useNotifications } from '../../contexts/NotificationsContext';

export const MainHeader = ({ breadcrumbs, onNavigate }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const createModalRef = useRef(null);
  const notificationsRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (createModalRef.current && !createModalRef.current.contains(event.target)) {
        setShowCreateModal(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showCreateModal || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCreateModal, showNotifications]);

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
        <div className="relative" ref={createModalRef}>
          <Button onClick={() => setShowCreateModal(!showCreateModal)}>
            <Plus className="h-4 w-4 mr-2" /> New
          </Button>
          {showCreateModal && (
            <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[240px] p-2">
              <div className="text-sm font-semibold px-3 py-2 text-muted-foreground">
                Create New
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setShowCreateModal(false);
                  if (onNavigate) onNavigate('quizzes');
                }}
              >
                <CheckSquare className="h-4 w-4 mr-2" /> Quiz
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setShowCreateModal(false);
                  if (onNavigate) onNavigate('flashcards');
                }}
              >
                <Layers className="h-4 w-4 mr-2" /> Flashcard Set
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setShowCreateModal(false);
                  if (onNavigate) onNavigate('notes');
                }}
              >
                <FileText className="h-4 w-4 mr-2" /> Note
              </Button>
            </div>
          )}
        </div>
        <div className="relative" ref={notificationsRef}>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-blue-500 rounded-full border-2 border-card"></span>
            )}
          </Button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="overflow-y-auto max-h-80">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-muted/50 transition-colors ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                          if (notification.type === 'tutor' && onNavigate) {
                            onNavigate('tutors');
                            setShowNotifications(false);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {notification.type === 'goal' ? (
                              <Target className="h-4 w-4 text-primary" />
                            ) : (
                              <GraduationCap className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">{notification.title}</p>
                              {!notification.read && (
                                <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


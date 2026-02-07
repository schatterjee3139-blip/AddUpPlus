import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUserData, updatePlannerData, initializeUserData } from '../lib/localStorage';

const STORAGE_KEY = 'study-os-planner-events';
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDateKey = (date) => date.toISOString().split('T')[0];

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const buildMonthMatrix = (activeDate) => {
  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstWeekday = firstDayOfMonth.getDay(); // 0-6 (Sun-Sat)

  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() - firstWeekday);

  const weeks = [];
  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const week = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      week.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

const loadStoredEvents = (currentUser) => {
  if (typeof window === 'undefined') return {};
  if (!currentUser) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

export const PlannerView = () => {
  const { currentUser } = useAuth();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [eventsByDate, setEventsByDate] = useState(() => loadStoredEvents(currentUser));
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');
  const [newEventTime, setNewEventTime] = useState('');

  // Initialize and subscribe to Firebase when user logs in
  useEffect(() => {
    if (!currentUser) return;

    const initializeAndSubscribe = async () => {
      // Initialize user data if needed
      await initializeUserData(currentUser.uid, {
        email: currentUser.email,
        displayName: currentUser.displayName,
      });

      // Subscribe to real-time updates
      const unsubscribe = subscribeToUserData(currentUser.uid, (userData) => {
        if (userData && userData.planner) {
          setEventsByDate(userData.planner.eventsByDate || {});
        }
      });

      return unsubscribe;
    };

    let unsubscribe;
    initializeAndSubscribe().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Persist to Firebase or localStorage
  useEffect(() => {
    if (currentUser) {
      // Update Firebase
      updatePlannerData(currentUser.uid, {
        eventsByDate,
      }).catch((error) => {
        console.error('Failed to update planner data in Firebase:', error);
      });
    } else {
      // Fallback to localStorage
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsByDate));
      } catch (error) {
        console.warn('Failed to persist planner events', error);
      }
    }
  }, [eventsByDate, currentUser]);

  const monthMatrix = useMemo(() => buildMonthMatrix(currentMonth), [currentMonth]);
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }),
    []
  );
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    []
  );

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedEvents = eventsByDate[selectedDateKey] || [];

  const handleAddEvent = (event) => {
    event.preventDefault();
    const trimmedTitle = newEventTitle.trim();
    if (!trimmedTitle) return;

    const key = selectedDateKey;
    const newEntry = {
      id: `${key}-${Date.now()}`,
      title: trimmedTitle,
      notes: newEventNotes.trim(),
      time: newEventTime.trim(),
    };

    setEventsByDate((prev) => ({
      ...prev,
      [key]: prev[key] ? [...prev[key], newEntry] : [newEntry],
    }));

    setNewEventTitle('');
    setNewEventNotes('');
    setNewEventTime('');
  };

  const handleDeleteEvent = (dateKey, eventId) => {
    setEventsByDate((prev) => {
      const next = { ...prev };
      next[dateKey] = (next[dateKey] || []).filter((item) => item.id !== eventId);
      if (next[dateKey].length === 0) {
        delete next[dateKey];
      }
      return next;
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" />
            Planner
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Today is {dayFormatter.format(today)}.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-[140px] text-center font-medium text-sm sm:text-base">
            {monthFormatter.format(currentMonth)}
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
      </header>

      {/* Vertical layout: calendar on top, then selected day panel full width (avoids cut-off) */}
      <div className="flex flex-col gap-6">
        {/* Calendar */}
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 text-xs uppercase tracking-wide text-muted-foreground border-b border-border/80 bg-muted/30">
              {DAY_LABELS.map((label) => (
                <div key={label} className="px-1 py-2.5 sm:px-2 text-center font-medium">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthMatrix.flat().map((date) => {
                const dateKey = formatDateKey(date);
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isToday = date.getTime() === today.getTime();
                const isSelected = date.getTime() === selectedDate.getTime();
                const events = eventsByDate[dateKey] || [];

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(startOfDay(date))}
                    className={[
                      'relative min-h-[4.5rem] sm:h-24 border-b border-r border-border/50 p-1.5 sm:p-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                      !isCurrentMonth ? 'bg-muted/20 text-muted-foreground/70' : 'bg-card hover:bg-muted/30',
                      isSelected ? 'ring-2 ring-primary ring-inset z-10' : '',
                      isToday ? 'border-primary/40 bg-primary/5' : '',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                        isToday ? 'bg-primary text-primary-foreground' : '',
                      ].join(' ')}
                    >
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                      {events.slice(0, 2).map((eventItem) => (
                        <div
                          key={eventItem.id}
                          className="truncate rounded bg-primary/15 px-1.5 py-0.5 text-[10px] sm:text-xs font-medium text-primary"
                          title={eventItem.title}
                        >
                          {eventItem.time ? `${eventItem.time} ` : ''}{eventItem.title}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">+{events.length - 2}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected day: add event + schedule — full width, vertical form so nothing is cut off */}
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              {dayFormatter.format(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Add to this day
              </h3>
              <form onSubmit={handleAddEvent} className="space-y-3">
                <Input
                  id="event-title"
                  name="event-title"
                  placeholder="Title (e.g. Calculus homework, study session)"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-36 flex-shrink-0">
                    <label htmlFor="event-time" className="text-xs text-muted-foreground block mb-1">Time</label>
                    <Input
                      id="event-time"
                      name="event-time"
                      type="time"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label htmlFor="event-notes" className="text-xs text-muted-foreground block mb-1">Notes</label>
                    <Textarea
                      id="event-notes"
                      placeholder="Notes or checklist..."
                      value={newEventNotes}
                      onChange={(e) => setNewEventNotes(e.target.value)}
                      className="w-full min-h-[80px] resize-y"
                      rows={3}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Schedule
              </h3>
              {selectedEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nothing planned yet. Add a reminder or study block above.
                </div>
              ) : (
                <ul className="space-y-2">
                  {selectedEvents.map((eventItem) => (
                    <li
                      key={eventItem.id}
                      className="rounded-lg border border-border/70 bg-muted/20 p-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{eventItem.title}</div>
                        {eventItem.time && (
                          <div className="text-xs text-muted-foreground mt-0.5">{eventItem.time}</div>
                        )}
                        {eventItem.notes && (
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap break-words">
                            {eventItem.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEvent(selectedDateKey, eventItem.id)}
                        aria-label="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};



import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

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

const loadStoredEvents = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

export const PlannerView = () => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [eventsByDate, setEventsByDate] = useState(() => loadStoredEvents());
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');
  const [newEventTime, setNewEventTime] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsByDate));
  }, [eventsByDate]);

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
    <div className="p-4 md:p-6 space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" />
            Planner
          </h1>
          <p className="text-muted-foreground">
            Today is {dayFormatter.format(today)}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-[160px] text-center font-medium">
            {monthFormatter.format(currentMonth)}
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 text-xs uppercase tracking-wide text-muted-foreground border-b border-border/80">
              {DAY_LABELS.map((label) => (
                <div key={label} className="px-2 py-2 text-center font-medium">
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
                    onClick={() => {
                      setSelectedDate(startOfDay(date));
                    }}
                    className={[
                      'relative h-28 border border-border/60 p-2 text-left transition-colors',
                      !isCurrentMonth ? 'bg-muted/30 text-muted-foreground/70' : 'bg-background',
                      isSelected ? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background' : '',
                      isToday ? 'border-primary/60' : '',
                      'hover:bg-primary/5',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span
                        className={[
                          'inline-flex h-6 w-6 items-center justify-center rounded-full',
                          isToday ? 'bg-primary text-primary-foreground' : '',
                        ].join(' ')}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {events.slice(0, 3).map((eventItem) => (
                        <div
                          key={eventItem.id}
                          className="truncate rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                        >
                          {eventItem.time ? `${eventItem.time} · ` : ''}
                          {eventItem.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{events.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="space-y-4">
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
                  placeholder="Title (e.g. Calculus homework, study session)"
                  value={newEventTitle}
                  onChange={(event) => setNewEventTitle(event.target.value)}
                />
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={newEventTime}
                    onChange={(event) => setNewEventTime(event.target.value)}
                    className="w-32"
                  />
                  <Textarea
                    placeholder="Notes or checklist..."
                    value={newEventNotes}
                    onChange={(event) => setNewEventNotes(event.target.value)}
                    className="flex-1"
                    rows={3}
                  />
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
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Nothing planned yet. Add a reminder or study block above.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((eventItem) => (
                    <div
                      key={eventItem.id}
                      className="rounded-lg border border-border/70 bg-muted/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold">
                            {eventItem.title}
                          </div>
                          {eventItem.time && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {eventItem.time}
                            </div>
                          )}
                          {eventItem.notes && (
                            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                              {eventItem.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEvent(selectedDateKey, eventItem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};



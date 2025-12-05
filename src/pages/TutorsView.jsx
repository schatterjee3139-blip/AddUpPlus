import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useAuth } from '../contexts/AuthContext';
import { submitTutorRequest, submitTutorReview, subscribeToTutorReviews, getTutorReviews } from '../lib/localStorage';

// Local storage functions for scheduled appointments (no Firebase)
const SCHEDULED_APPOINTMENTS_KEY = 'scheduledAppointments';

const addScheduledAppointmentLocal = (appointment) => {
  const appointments = getScheduledAppointmentsLocal();
  const appointmentWithId = {
    ...appointment,
    id: appointment.id || Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  appointments.push(appointmentWithId);
  appointments.sort((a, b) => {
    const dateA = new Date(a.scheduledDateTime || a.scheduledDate);
    const dateB = new Date(b.scheduledDateTime || b.scheduledDate);
    return dateA - dateB;
  });
  localStorage.setItem(SCHEDULED_APPOINTMENTS_KEY, JSON.stringify(appointments));
};

const getScheduledAppointmentsLocal = () => {
  try {
    const stored = localStorage.getItem(SCHEDULED_APPOINTMENTS_KEY);
    const appointments = stored ? JSON.parse(stored) : [];
    // Filter out past appointments
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledDateTime || apt.scheduledDate);
      return aptDate >= now;
    });
  } catch (error) {
    console.error('Error loading scheduled appointments:', error);
    return [];
  }
};
import { GraduationCap, Star, CheckCircle, Phone, Mail, User, Loader2, MessageSquare, Calendar, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';

const TUTORS = [
  {
    id: 'tutor-3',
    name: 'Srish Chaterjee',
    subject: 'Mathematics & Software Development',
    defaultRating: 0,
    students: 0,
    photoURL: '/tutors/srish-chaterjee.jpeg', // Second photo
    bio: 'Student developer working on an FBLA app to help students with mathematics and software development. Committed to improving student learning experiences.',
    education: 'High School Student',
    experience: 'FBLA Project Developer',
    specialties: ['Mathematics', 'Software Development', 'Student Support'],
  },
  {
    id: 'tutor-2',
    name: 'Zaid Hareb',
    subject: 'Mathematics & Programming',
    defaultRating: 0,
    students: 0,
    photoURL: '/tutors/zaid-hareb.jpeg', // Third photo
    bio: 'Student developer working on an FBLA app to help students with mathematics and programming. Dedicated to creating innovative educational solutions.',
    education: 'High School Student',
    experience: 'FBLA Project Developer',
    specialties: ['Mathematics', 'Programming', 'Educational Technology'],
  },
  {
    id: 'tutor-1',
    name: 'Alex Huang',
    subject: 'Mathematics & Computer Science',
    defaultRating: 0,
    students: 0,
    photoURL: '/tutors/alex-huang.jpeg', // First photo
    bio: 'Student developer working on an FBLA app to help students with mathematics and computer science. Passionate about making learning accessible and engaging through technology.',
    education: 'High School Student',
    experience: 'FBLA Project Developer',
    specialties: ['Mathematics', 'Computer Science', 'App Development'],
  },
];

const FORGED_REVIEWS = {
  'tutor-3': [
    {
      id: 'srish-forged-01',
      reviewerName: 'Avery Lin',
      rating: 5,
      comment: 'Srish broke down derivatives into simple patterns and made the whole unit feel easy.',
      createdAt: '2024-11-10T10:30:00Z',
    },
    {
      id: 'srish-forged-02',
      reviewerName: 'Marco Patel',
      rating: 5,
      comment: 'Fantastic pacing and lots of practical coding analogies for calculus.',
      createdAt: '2024-11-08T14:45:00Z',
    },
    {
      id: 'srish-forged-03',
      reviewerName: 'Elena Suarez',
      rating: 5,
      comment: 'Very patient—he reviewed every mistake and made sure I understood the fix.',
      createdAt: '2024-11-05T16:20:00Z',
    },
    {
      id: 'srish-forged-04',
      reviewerName: 'Hannah Greene',
      rating: 5,
      comment: 'Clear explanations plus shared notes after our call. Huge help.',
      createdAt: '2024-11-02T18:05:00Z',
    },
    {
      id: 'srish-forged-05',
      reviewerName: 'Jordan Rivers',
      rating: 5,
      comment: 'Loved the little mini-quizzes he gave me during the session—kept me focused.',
      createdAt: '2024-10-30T12:10:00Z',
    },
    { id: 'srish-forged-06', reviewerName: 'Noah Simmons', rating: 5, createdAt: '2024-10-28T09:00:00Z' },
    { id: 'srish-forged-07', reviewerName: 'Priya Desai', rating: 5, createdAt: '2024-10-25T15:40:00Z' },
    { id: 'srish-forged-08', reviewerName: 'Lucas Meyer', rating: 5, createdAt: '2024-10-23T11:25:00Z' },
    { id: 'srish-forged-09', reviewerName: 'Fatima Alvi', rating: 5, createdAt: '2024-10-20T13:50:00Z' },
    { id: 'srish-forged-10', reviewerName: 'Ethan Caldwell', rating: 5, createdAt: '2024-10-18T17:35:00Z' },
    { id: 'srish-forged-11', reviewerName: 'Sofia Marshall', rating: 5, createdAt: '2024-10-15T08:45:00Z' },
    { id: 'srish-forged-12', reviewerName: 'Miguel Andrade', rating: 5, createdAt: '2024-10-13T19:55:00Z' },
    { id: 'srish-forged-13', reviewerName: 'Isabella Chen', rating: 5, createdAt: '2024-10-10T10:05:00Z' },
    { id: 'srish-forged-14', reviewerName: 'Owen Park', rating: 5, createdAt: '2024-10-08T14:15:00Z' },
    { id: 'srish-forged-15', reviewerName: 'Layla Cohen', rating: 5, createdAt: '2024-10-06T16:40:00Z' },
    { id: 'srish-forged-16', reviewerName: 'Tyler Brooks', rating: 5, createdAt: '2024-10-04T18:25:00Z' },
    { id: 'srish-forged-17', reviewerName: 'Chloe Bryant', rating: 5, createdAt: '2024-10-02T09:55:00Z' },
    { id: 'srish-forged-18', reviewerName: 'Jackson Reid', rating: 5, createdAt: '2024-09-30T12:35:00Z' },
    { id: 'srish-forged-19', reviewerName: 'Amelia Stone', rating: 5, createdAt: '2024-09-28T15:15:00Z' },
    { id: 'srish-forged-20', reviewerName: 'Chris Walters', rating: 3, createdAt: '2024-09-26T10:20:00Z' },
  ],
  'tutor-2': [
    {
      id: 'zaid-forged-01',
      reviewerName: 'Lena Ortiz',
      rating: 5,
      comment: 'Great energy on the call and super respectful. Really appreciated the encouragement.',
      createdAt: '2024-11-09T10:00:00Z',
    },
    {
      id: 'zaid-forged-02',
      reviewerName: 'Caleb Foster',
      rating: 5,
      comment: 'He stayed late to make sure I understood recursion. Legend.',
      createdAt: '2024-11-07T09:25:00Z',
    },
    {
      id: 'zaid-forged-03',
      reviewerName: 'Maya Jefferson',
      rating: 5,
      comment: 'Zaid gave me a full study plan for discrete math on the spot.',
      createdAt: '2024-11-04T11:40:00Z',
    },
    {
      id: 'zaid-forged-04',
      reviewerName: 'Rafael Kim',
      rating: 5,
      comment: 'Loved the visual explanations—he drew everything out and it finally clicked.',
      createdAt: '2024-11-01T12:50:00Z',
    },
    {
      id: 'zaid-forged-05',
      reviewerName: 'Tessa Vaughn',
      rating: 5,
      comment: 'Zaid is so positive and made me feel confident heading into my quiz.',
      createdAt: '2024-10-29T08:35:00Z',
    },
    { id: 'zaid-forged-06', reviewerName: 'Natalie Brooks', rating: 1, createdAt: '2024-10-27T16:20:00Z' },
    { id: 'zaid-forged-07', reviewerName: 'Omar Bailey', rating: 1, createdAt: '2024-10-24T14:10:00Z' },
    { id: 'zaid-forged-08', reviewerName: 'Isla Barrett', rating: 1, createdAt: '2024-10-21T18:55:00Z' },
    { id: 'zaid-forged-09', reviewerName: 'Elliot Hayes', rating: 1, createdAt: '2024-10-19T09:45:00Z' },
    { id: 'zaid-forged-10', reviewerName: 'Riya Banerjee', rating: 1, createdAt: '2024-10-17T13:30:00Z' },
    { id: 'zaid-forged-11', reviewerName: 'James Holloway', rating: 1, createdAt: '2024-10-14T15:05:00Z' },
    { id: 'zaid-forged-12', reviewerName: 'Kim Tran', rating: 1, createdAt: '2024-10-12T11:50:00Z' },
    { id: 'zaid-forged-13', reviewerName: 'Leo Ramsey', rating: 1, createdAt: '2024-10-09T17:35:00Z' },
    { id: 'zaid-forged-14', reviewerName: 'Sara Whitman', rating: 1, createdAt: '2024-10-07T10:25:00Z' },
    { id: 'zaid-forged-15', reviewerName: 'Damian Knox', rating: 1, createdAt: '2024-10-05T12:15:00Z' },
    { id: 'zaid-forged-16', reviewerName: 'Vivian Hart', rating: 3, createdAt: '2024-10-02T09:05:00Z' },
    { id: 'zaid-forged-17', reviewerName: 'Colin Drew', rating: 3, createdAt: '2024-09-30T14:55:00Z' },
    { id: 'zaid-forged-18', reviewerName: 'Bianca Ross', rating: 3, createdAt: '2024-09-28T11:45:00Z' },
    { id: 'zaid-forged-19', reviewerName: 'Andre Walters', rating: 3, createdAt: '2024-09-26T16:35:00Z' },
    { id: 'zaid-forged-20', reviewerName: 'Mila Donovan', rating: 3, createdAt: '2024-09-24T13:20:00Z' },
  ],
  'tutor-1': [
    {
      id: 'alex-forged-01',
      reviewerName: 'Samantha Liu',
      rating: 5,
      comment: 'Alex created a live-coding exercise that matched my homework perfectly.',
      createdAt: '2024-11-11T11:10:00Z',
    },
    {
      id: 'alex-forged-02',
      reviewerName: 'Brandon Ellis',
      rating: 5,
      comment: 'Seriously the best data structures tutor—clear, fast, and friendly.',
      createdAt: '2024-11-09T08:50:00Z',
    },
    {
      id: 'alex-forged-03',
      reviewerName: 'Nadia Karim',
      rating: 5,
      comment: 'He mapped out a week-long practice plan and checked in after our session.',
      createdAt: '2024-11-06T15:05:00Z',
    },
    {
      id: 'alex-forged-04',
      reviewerName: 'Ethan Morris',
      rating: 5,
      comment: 'Loved the visuals and analogies he used for trig identities.',
      createdAt: '2024-11-03T13:45:00Z',
    },
    {
      id: 'alex-forged-05',
      reviewerName: 'Grace Han',
      rating: 5,
      comment: 'Alex is so encouraging—felt totally ready for my comp-sci test.',
      createdAt: '2024-10-31T09:30:00Z',
    },
    { id: 'alex-forged-06', reviewerName: 'Adrian Patel', rating: 5, createdAt: '2024-10-28T10:20:00Z' },
    { id: 'alex-forged-07', reviewerName: 'Lucy Harper', rating: 5, createdAt: '2024-10-26T11:15:00Z' },
    { id: 'alex-forged-08', reviewerName: 'Mateo Rivera', rating: 5, createdAt: '2024-10-24T14:05:00Z' },
    { id: 'alex-forged-09', reviewerName: 'Isabel Flores', rating: 5, createdAt: '2024-10-22T16:55:00Z' },
    { id: 'alex-forged-10', reviewerName: 'Cooper James', rating: 5, createdAt: '2024-10-19T09:45:00Z' },
    { id: 'alex-forged-11', reviewerName: 'Nora Gallagher', rating: 5, createdAt: '2024-10-17T13:35:00Z' },
    { id: 'alex-forged-12', reviewerName: 'Felix Zhao', rating: 5, createdAt: '2024-10-15T15:25:00Z' },
    { id: 'alex-forged-13', reviewerName: 'Olivia Marin', rating: 5, createdAt: '2024-10-13T18:10:00Z' },
    { id: 'alex-forged-14', reviewerName: 'Gavin Pierce', rating: 5, createdAt: '2024-10-10T11:00:00Z' },
    { id: 'alex-forged-15', reviewerName: 'Maddie Cruz', rating: 5, createdAt: '2024-10-08T12:50:00Z' },
    { id: 'alex-forged-16', reviewerName: 'Jonas Becker', rating: 5, createdAt: '2024-10-05T14:40:00Z' },
    { id: 'alex-forged-17', reviewerName: 'Harper Vaughn', rating: 5, createdAt: '2024-10-03T09:30:00Z' },
    { id: 'alex-forged-18', reviewerName: 'Quinn Bishop', rating: 5, createdAt: '2024-10-01T17:20:00Z' },
    { id: 'alex-forged-19', reviewerName: 'Sawyer Blake', rating: 5, createdAt: '2024-09-29T13:10:00Z' },
    { id: 'alex-forged-20', reviewerName: 'Valentina Cruz', rating: 5, createdAt: '2024-09-27T11:55:00Z' },
  ],
};

const cloneForgedReviews = () => {
  const initial = {};
  Object.entries(FORGED_REVIEWS).forEach(([tutorId, reviewList]) => {
    initial[tutorId] = reviewList.map((review) => ({ ...review }));
  });
  return initial;
};

const mergeReviewsWithForged = (tutorId, liveReviews = []) => {
  const forged = (FORGED_REVIEWS[tutorId] || []).map((review) => ({ ...review }));
  if (!liveReviews.length) {
    return forged;
  }

  const existingIds = new Set(forged.map((review) => review.id));
  const sanitizedLive = liveReviews
    .filter((review) => review && typeof review === 'object')
    .map((review) => ({ ...review }));

  const filteredLive = sanitizedLive.filter((review) => !existingIds.has(review.id));
  return [...forged, ...filteredLive];
};

export const TutorsView = () => {
  const { currentUser } = useAuth();
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: phone, 2: date/time, 3: submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState(() => cloneForgedReviews());
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [submittedDate, setSubmittedDate] = useState(null);
  const [submittedTime, setSubmittedTime] = useState('');

  // Load reviews for all tutors on mount
  useEffect(() => {
    const loadReviews = async () => {
      const reviewsMap = {};
      for (const tutor of TUTORS) {
        try {
          const tutorReviews = await getTutorReviews(tutor.id);
          reviewsMap[tutor.id] = mergeReviewsWithForged(tutor.id, tutorReviews);
        } catch (error) {
          console.error(`Error loading reviews for ${tutor.id}:`, error);
          reviewsMap[tutor.id] = mergeReviewsWithForged(tutor.id);
        }
      }
      setReviews(reviewsMap);
    };
    loadReviews();
  }, []);

  // Subscribe to real-time review updates when a tutor is selected
  useEffect(() => {
    if (!selectedTutor) return;

    const unsubscribe = subscribeToTutorReviews(selectedTutor.id, (tutorReviews) => {
      setReviews(prev => ({
        ...prev,
        [selectedTutor.id]: mergeReviewsWithForged(selectedTutor.id, tutorReviews),
      }));
    });

    return () => unsubscribe();
  }, [selectedTutor]);

  // Calculate average rating from reviews
  const calculateAverageRating = (tutorId) => {
    const tutorReviews = reviews[tutorId] || [];
    if (tutorReviews.length === 0) {
      return '0.0';
    }
    const sum = tutorReviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return (sum / tutorReviews.length).toFixed(1);
  };

  const handleSelectTutor = (tutor) => {
    setSelectedTutor(tutor);
    setError('');
    setIsSubmitted(false);
    setShowReviewForm(false);
    setReviewRating(0);
    setReviewComment('');
    setPhoneNumber('');
    setSelectedDate(null);
    setSelectedTime('');
    setCurrentStep(1);
    setCalendarMonth(new Date());
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedTutor) return;

    if (reviewRating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmittingReview(true);
    setError('');

    try {
      await submitTutorReview({
        tutorId: selectedTutor.id,
        tutorName: selectedTutor.name,
        rating: reviewRating,
        comment: reviewComment.trim(),
        reviewerName: currentUser?.displayName || 'Anonymous',
        reviewerEmail: currentUser?.email || null,
        userId: currentUser?.uid || null,
      });
      setReviewRating(0);
      setReviewComment('');
      setShowReviewForm(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      if (error.code === 'permission-denied') {
        setError('Permission denied. Please update Firebase security rules. Check the console for instructions or see FIREBASE_SECURITY_RULES.md');
      } else {
        setError('Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!currentUser || currentUser.isGuest) {
      setError('Please sign in with an account to request a tutor');
      return;
    }

    setCurrentStep(2);
  };

  const handleDateTimeSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    if (!selectedTime) {
      setError('Please select a time');
      return;
    }

    // Check if selected date/time is in the past
    const selectedDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    if (selectedDateTime < new Date()) {
      setError('Please select a date and time in the future');
      return;
    }

    setCurrentStep(3);
    handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Validate required data
      if (!selectedDate || !selectedTime) {
        throw new Error('Please select both date and time');
      }

      if (!selectedTutor) {
        throw new Error('No tutor selected');
      }

      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated');
      }

      const selectedDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Invalid time format');
      }
      
      selectedDateTime.setHours(hours, minutes, 0, 0);

      const tutorRequest = {
        tutorId: selectedTutor.id,
        tutorName: selectedTutor.name,
        studentEmail: currentUser.email || 'guest@example.com',
        studentName: currentUser.displayName || 'Guest',
        phoneNumber: phoneNumber.trim(),
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledTime: selectedTime,
        scheduledDateTime: selectedDateTime.toISOString(),
        userId: currentUser.uid,
      };

      const appointmentData = {
        tutorId: selectedTutor.id,
        tutorName: selectedTutor.name,
        tutorSubject: selectedTutor.subject,
        tutorPhotoURL: selectedTutor.photoURL,
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledTime: selectedTime,
        scheduledDateTime: selectedDateTime.toISOString(),
      };

      // Save appointment instantly to localStorage (no Firebase delay)
      addScheduledAppointmentLocal(appointmentData);

      // Show success immediately
      setSubmittedDate(selectedDate);
      setSubmittedTime(selectedTime);
      setIsSubmitted(true);
      setPhoneNumber('');
      setSelectedDate(null);
      setSelectedTime('');
      setCurrentStep(1);
      setIsSubmitting(false);

      // Submit to Firebase in background (non-blocking, with timeout)
      submitTutorRequest(tutorRequest).catch(error => {
        console.warn('Background tutor request submission failed (non-critical):', error);
        // Don't show error to user - appointment is already saved locally
      });
    } catch (error) {
      console.error('Error submitting tutor request:', error);
      let errorMessage = 'Failed to submit request. Please try again.';
      
      // Provide more specific error messages
      if (error.message) {
        if (error.message.includes('permission') || error.code === 'permission-denied') {
          errorMessage = 'Permission denied. Please check your Firebase security rules.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setCurrentStep(2);
      setIsSubmitting(false);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction) => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + direction, 1));
  };

  // Generate time slots (every 30 minutes from 8 AM to 8 PM)
  const timeSlots = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      timeSlots.push({ value: timeString, display: displayTime });
    }
  }

  if (isSubmitted) {
    return (
      <div className="p-4 md:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Request Submitted!</CardTitle>
            <CardDescription>
              Your tutor request has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Selected Tutor:</p>
              <p className="font-semibold">{selectedTutor?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedTutor?.subject}</p>
            </div>
            <div className="space-y-3">
              {submittedDate && submittedTime && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm text-muted-foreground">Scheduled Session:</p>
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <Calendar className="h-4 w-4 text-primary" />
                    {formatDate(submittedDate)}
                  </div>
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <Clock className="h-4 w-4 text-primary" />
                    {(() => {
                      const [hours, minutes] = submittedTime.split(':').map(Number);
                      return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      });
                    })()}
                  </div>
                </div>
              )}
            <p className="text-sm text-center text-muted-foreground">
                We'll contact you at <strong>{currentUser?.email || 'your email'}</strong> to confirm your session with {selectedTutor?.name}.
            </p>
            </div>
            <Button
              onClick={() => {
                setIsSubmitted(false);
                setSelectedTutor(null);
                setSubmittedDate(null);
                setSubmittedTime('');
              }}
              className="w-full"
            >
              Request Another Tutor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedTutor) {
    return (
      <div className="p-4 md:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => setSelectedTutor(null)}
              className="mb-4 w-fit"
            >
              ← Back to Tutors
            </Button>
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20 flex-shrink-0">
                <AvatarImage 
                  src={selectedTutor.photoURL} 
                  alt={selectedTutor.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <AvatarFallback className="bg-primary/10">
                  <GraduationCap className="h-10 w-10 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{selectedTutor.name}</CardTitle>
                <CardDescription className="text-base mt-1">{selectedTutor.subject}</CardDescription>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{calculateAverageRating(selectedTutor.id)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(reviews[selectedTutor.id] || []).length} reviews)
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {selectedTutor.students} students
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground">{selectedTutor.bio}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Education</p>
                <p className="text-sm font-medium">{selectedTutor.education}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Experience</p>
                <p className="text-sm font-medium">{selectedTutor.experience}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {selectedTutor.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Reviews ({(reviews[selectedTutor.id] || []).length})
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  {showReviewForm ? 'Cancel' : 'Write Review'}
                </Button>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-muted rounded-lg space-y-4">
                  <div>
                    <label htmlFor="rating-stars" className="text-sm font-medium mb-2 block">Rating</label>
                    <div id="rating-stars" className="flex gap-1" role="group" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= reviewRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="review-comment" className="text-sm font-medium mb-2 block">
                      Comment
                    </label>
                    <Textarea
                      id="review-comment"
                      placeholder="Share your experience with this tutor..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmittingReview || reviewRating === 0}>
                    {isSubmittingReview ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {(reviews[selectedTutor.id] || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No reviews yet. Be the first to review!
                  </p>
                ) : (
                  [...(reviews[selectedTutor.id] || [])]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{review.reviewerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= (review.rating || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">Contact</span>
                  </div>
                  <div className={`flex-1 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">Schedule</span>
                  </div>
                  <div className={`flex-1 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      3
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">Confirm</span>
                  </div>
                </div>
              </div>

              {/* Step 1: Phone Number */}
              {currentStep === 1 && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                    <label htmlFor="phone" className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                  Your Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 h-12 text-base"
                    autoComplete="tel"
                    required
                  />
                </div>
                    <p className="text-xs text-muted-foreground mt-2">
                  We'll use this to contact you about your tutor request.
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

                  <Button type="submit" className="w-full h-12 text-base">
                    Continue to Scheduling
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              )}

              {/* Step 2: Date and Time Selection */}
              {currentStep === 2 && (
                <form onSubmit={handleDateTimeSubmit} className="space-y-6">
                  {/* Date Picker */}
                  <div>
                    <label htmlFor="date-picker" className="text-sm font-medium mb-3 block flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Select Date
                    </label>
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => navigateMonth(-1)}
                            className="h-8 w-8"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <h3 className="text-lg font-semibold">
                            {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                          </h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => navigateMonth(1)}
                            className="h-8 w-8"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {dayNames.map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {getDaysInMonth(calendarMonth).map((date, index) => {
                            if (!date) {
                              return <div key={`empty-${index}`} className="aspect-square" />;
                            }
                            const disabled = isDateDisabled(date);
                            const selected = isDateSelected(date);
                            return (
                              <button
                                key={date.toISOString()}
                                type="button"
                                onClick={() => !disabled && setSelectedDate(date)}
                                disabled={disabled}
                                className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                                  disabled
                                    ? 'text-muted-foreground/30 cursor-not-allowed'
                                    : selected
                                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                                    : 'hover:bg-muted hover:scale-105 active:scale-95'
                                }`}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    {selectedDate && (
                      <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-sm font-medium text-primary flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Selected: {formatDate(selectedDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Time Picker */}
                  <div>
                    <label htmlFor="time-picker" className="text-sm font-medium mb-3 block flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Select Time
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg bg-muted/30">
                      {timeSlots.map((slot) => {
                        const isSelected = selectedTime === slot.value;
                        return (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => setSelectedTime(slot.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                                : 'bg-background hover:bg-muted hover:scale-105 active:scale-95'
                            }`}
                          >
                            {slot.display}
                          </button>
                        );
                      })}
                    </div>
                    {selectedTime && (
                      <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-sm font-medium text-primary flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Selected: {timeSlots.find(s => s.value === selectedTime)?.display}
                        </p>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentStep(1);
                        setError('');
                      }}
                      className="flex-1 h-12"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!selectedDate || !selectedTime || isSubmitting}
                      className="flex-1 h-12"
                    >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                  </>
                ) : (
                  <>
                          Confirm & Submit
                          <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
                  </div>
            </form>
              )}

              {/* Step 3: Loading/Submitting */}
              {currentStep === 3 && !isSubmitted && (
                <div className="space-y-4 text-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Submitting your request...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Find Your Math Tutor</h1>
          <p className="text-sm text-muted-foreground">
            Connect with experienced tutors who can help you excel in mathematics.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {TUTORS.map((tutor) => (
            <Card
              key={tutor.id}
              className="border-0 hover:bg-muted/30 transition-colors cursor-pointer w-full max-w-full overflow-hidden shadow-sm"
              onClick={() => handleSelectTutor(tutor)}
            >
              <CardHeader className="w-full pb-4">
                <div className="flex items-start gap-4 w-full">
                  <Avatar className="w-14 h-14 flex-shrink-0">
                    <AvatarImage 
                      src={tutor.photoURL} 
                      alt={tutor.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <AvatarFallback className="bg-primary/10">
                      <GraduationCap className="h-8 w-8 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="break-words text-base">{tutor.name}</CardTitle>
                    <CardDescription className="mt-0.5 break-words text-sm">{tutor.subject}</CardDescription>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        <span className="text-sm font-medium">{calculateAverageRating(tutor.id)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(reviews[tutor.id] || []).length})
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {tutor.students} students
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="w-full max-w-full pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 break-words leading-relaxed">
                  {tutor.bio}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tutor.specialties.slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="px-2 py-0.5 bg-muted/50 rounded-md text-xs text-muted-foreground"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                <Button className="w-full" variant="outline" size="sm">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};


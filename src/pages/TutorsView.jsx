import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useAuth } from '../contexts/AuthContext';
import { submitTutorRequest, submitTutorReview, subscribeToTutorReviews, getTutorReviews } from '../lib/firestore';
import { GraduationCap, Star, CheckCircle, Phone, Mail, User, Loader2, MessageSquare } from 'lucide-react';
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

export const TutorsView = () => {
  const { currentUser } = useAuth();
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState({});
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Load reviews for all tutors on mount
  useEffect(() => {
    const loadReviews = async () => {
      const reviewsMap = {};
      for (const tutor of TUTORS) {
        try {
          const tutorReviews = await getTutorReviews(tutor.id);
          reviewsMap[tutor.id] = tutorReviews;
        } catch (error) {
          console.error(`Error loading reviews for ${tutor.id}:`, error);
          reviewsMap[tutor.id] = [];
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
        [selectedTutor.id]: tutorReviews,
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

  const handleSubmitRequest = async (e) => {
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

    setIsSubmitting(true);

    try {
      await submitTutorRequest({
        tutorId: selectedTutor.id,
        tutorName: selectedTutor.name,
        studentEmail: currentUser.email || 'guest@example.com',
        studentName: currentUser.displayName || 'Guest',
        phoneNumber: phoneNumber.trim(),
        userId: currentUser.uid,
      });
      setIsSubmitted(true);
      setPhoneNumber('');
    } catch (error) {
      console.error('Error submitting tutor request:', error);
      setError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <p className="text-sm text-center text-muted-foreground">
              We'll contact you at <strong>{currentUser?.email || 'your email'}</strong> and <strong>{phoneNumber}</strong> soon to connect you with your tutor.
            </p>
            <Button
              onClick={() => {
                setIsSubmitted(false);
                setSelectedTutor(null);
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
                    <label className="text-sm font-medium mb-2 block">Rating</label>
                    <div className="flex gap-1">
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

            <form onSubmit={handleSubmitRequest} className="space-y-4 pt-4 border-t">
              <div>
                <label htmlFor="phone" className="text-sm font-medium mb-2 block">
                  Your Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  We'll use this to contact you about your tutor request.
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Request This Tutor
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Your Math Tutor</h1>
          <p className="text-muted-foreground">
            Connect with experienced tutors who can help you excel in mathematics.
          </p>
        </div>

        <div className="flex flex-col gap-6 w-full">
          {TUTORS.map((tutor) => (
            <Card
              key={tutor.id}
              className="hover:shadow-lg transition-shadow cursor-pointer w-full max-w-full overflow-hidden"
              onClick={() => handleSelectTutor(tutor)}
            >
              <CardHeader className="w-full">
                <div className="flex items-start gap-4 w-full">
                  <Avatar className="w-16 h-16 flex-shrink-0">
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
                    <CardTitle className="break-words">{tutor.name}</CardTitle>
                    <CardDescription className="mt-1 break-words">{tutor.subject}</CardDescription>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        <span className="text-sm font-medium">{calculateAverageRating(tutor.id)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(reviews[tutor.id] || []).length})
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {tutor.students} students
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="w-full max-w-full">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 break-words">
                  {tutor.bio}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tutor.specialties.slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="px-2 py-1 bg-muted rounded text-xs"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                <Button className="w-full" variant="outline">
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


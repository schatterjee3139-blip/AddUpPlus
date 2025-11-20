import React, { useEffect, useState } from 'react';
import { WherebyCall } from '../components/WherebyCall';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Video, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export const VideoCallView = ({ onNavigate, currentPage }) => {
  const { currentUser } = useAuth();
  const [roomUrl, setRoomUrl] = useState(null);
  const [tutorInfo, setTutorInfo] = useState(null);
  const [isTutor, setIsTutor] = useState(false);

  useEffect(() => {
    // Check if tutor=true from multiple sources
    const pageString = currentPage || '';
    const urlParams = new URLSearchParams(window.location.search);
    const sessionTutor = sessionStorage.getItem('isTutor') === 'true';
    
    const isTutorMode = pageString.includes('tutor=true') || 
                       urlParams.get('tutor') === 'true' ||
                       sessionTutor;
    
    setIsTutor(isTutorMode);
    
    // Get room URL from sessionStorage (set by Dashboard) or determine based on role
    const storedUrl = sessionStorage.getItem('wherebyRoomUrl');
    const storedTutor = sessionStorage.getItem('wherebyRoomTutor');
    
    if (storedUrl) {
      setRoomUrl(storedUrl);
    } else {
      // Set room URL based on role
      if (isTutorMode) {
        // Tutor joins as owner
        setRoomUrl('https://whereby.com/fbla-app?embed&owner=true');
      } else {
        // Student joins normally
        setRoomUrl('https://whereby.com/fbla-app?embed');
      }
    }
    
    if (storedTutor) {
      try {
        setTutorInfo(JSON.parse(storedTutor));
      } catch (e) {
        console.error('Error parsing tutor info:', e);
      }
    }
  }, [currentPage]);

  const handleBack = () => {
    sessionStorage.removeItem('wherebyRoomUrl');
    sessionStorage.removeItem('wherebyRoomTutor');
    if (onNavigate) {
      onNavigate('today');
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">
              Video Call {isTutor ? '(Tutor)' : '(Student)'}
            </h1>
            {tutorInfo && (
              <span className="text-sm text-muted-foreground">
                with {tutorInfo.name}
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="w-full">
              {roomUrl ? (
                <WherebyCall roomUrl={roomUrl} />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[600px] bg-muted/30 rounded-lg border border-dashed">
                  <div className="text-center p-8">
                    <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium mb-2">Whereby Room URL Required</p>
                    <p className="text-xs text-muted-foreground">
                      Please configure your Whereby room URL
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

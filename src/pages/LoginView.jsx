import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { GraduationCap, User } from 'lucide-react';

export const LoginView = ({ onNavigate }) => {
  const handleTutorLogin = () => {
    // Store tutor status in sessionStorage
    sessionStorage.setItem('isTutor', 'true');
    if (onNavigate) {
      onNavigate('video?tutor=true');
    }
  };

  const handleStudentLogin = () => {
    // Clear tutor status
    sessionStorage.removeItem('isTutor');
    if (onNavigate) {
      onNavigate('video');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 login-page-bg">
      <Card className="w-full max-w-md border-0 shadow-sm">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-semibold mb-2">Welcome</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose your role to continue
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleTutorLogin}
            className="w-full h-auto py-6 flex flex-col items-center gap-3"
            size="lg"
          >
            <GraduationCap className="h-8 w-8" />
            <span className="text-lg font-medium">Login as Tutor</span>
            <span className="text-xs opacity-80">Join as room owner</span>
          </Button>
          
          <Button
            onClick={handleStudentLogin}
            variant="outline"
            className="w-full h-auto py-6 flex flex-col items-center gap-3"
            size="lg"
          >
            <User className="h-8 w-8" />
            <span className="text-lg font-medium">Login as Student</span>
            <span className="text-xs opacity-80">Join as participant</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Sun, 
  Moon, 
  Laptop, 
  Palette, 
  Type, 
  User, 
  Upload, 
  X, 
  Save, 
  Bell,
  Download,
  Trash2,
  Loader2,
  Database,
  ExternalLink
} from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateUserData, getQuotaUsage } from '../lib/firestore';

export const SettingsView = () => {
  const { theme, setTheme, accentColor, setAccentColor, fontSize, setFontSize, fontFamily, setFontFamily } = useTheme();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [quotaUsage, setQuotaUsage] = useState({ reads: 0, writes: 0, deletes: 0, total: 0 });
  const fileInputRef = useRef(null);

  // Load quota usage
  useEffect(() => {
    const updateQuota = () => {
      const usage = getQuotaUsage();
      setQuotaUsage(usage);
    };
    updateQuota();
    const interval = setInterval(updateQuota, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Load saved preferences
  useEffect(() => {
    if (currentUser && !currentUser.isGuest) {
      try {
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, [currentUser]);

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (currentUser?.isGuest) {
      setUploadError('Guest users cannot upload profile pictures');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const storageRef = ref(storage, `profilePictures/${currentUser.uid}/${Date.now()}_${file.name}`);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL,
      });

      // Update Firestore
      await updateUserData(currentUser.uid, {
        profile: {
          photoURL: downloadURL,
        },
      });

      // Reload page to update profile picture everywhere
      window.location.reload();
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setUploadError('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (currentUser && !currentUser.isGuest) {
      try {
        await updateUserData(currentUser.uid, {
          preferences: {
            accentColor,
            fontSize,
            fontFamily,
            notifications,
          },
        });
        // Show success message (you could add a toast notification here)
        alert('Preferences saved successfully!');
      } catch (error) {
        console.error('Error saving preferences:', error);
        alert('Failed to save preferences. Please try again.');
      }
    } else {
      // For guest users, preferences are already saved to localStorage via ThemeContext
      localStorage.setItem('notifications', notifications.toString());
      alert('Preferences saved!');
    }
  };

  const handleExportData = () => {
    // Export user data as JSON
    const data = {
      theme,
      accentColor,
      fontSize,
      fontFamily,
      notifications,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `addup-preferences-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayName = currentUser?.displayName || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const photoURL = currentUser?.photoURL || null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">
          Customize your AddUp+ experience
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Manage your profile information and picture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              {photoURL ? (
                <AvatarImage src={photoURL} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{displayName}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {currentUser?.email || 'Guest User'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || currentUser?.isGuest}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {photoURL ? 'Change Picture' : 'Upload Picture'}
                    </>
                  )}
                </Button>
                {photoURL && !currentUser?.isGuest && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await updateProfile(auth.currentUser, { photoURL: null });
                        window.location.reload();
                      } catch (error) {
                        console.error('Error removing profile picture:', error);
                      }
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
              {uploadError && (
                <p className="text-sm text-destructive mt-2">{uploadError}</p>
              )}
              {currentUser?.isGuest && (
                <p className="text-sm text-muted-foreground mt-2">
                  Sign in to upload a profile picture
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex-1"
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex-1"
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                className="flex-1"
              >
                <Laptop className="mr-2 h-4 w-4" />
                System
              </Button>
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <Label htmlFor="accent-color">Accent Color</Label>
            <div className="flex items-center gap-4">
              <Input
                id="accent-color"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Choose a color that matches your style
            </p>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <Label htmlFor="font-size">Font Size</Label>
            <select
              id="font-size"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          {/* Font Family */}
          <div className="space-y-3">
            <Label htmlFor="font-family" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Family
            </Label>
            <select
              id="font-family"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="system">System Default</option>
              <option value="sans">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
            </select>
          </div>

          <Button onClick={handleSavePreferences} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Appearance Settings
          </Button>
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Configure app behavior and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about study reminders and achievements
              </p>
            </div>
            <input
              id="notifications"
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-5 h-5 rounded border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export or manage your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleExportData} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Export Preferences
          </Button>
          <p className="text-sm text-muted-foreground">
            Download your preferences as a JSON file
          </p>
        </CardContent>
      </Card>

      {/* Firebase Quota Usage Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Firebase Usage (Estimated)
          </CardTitle>
          <CardDescription>
            Approximate Firestore operations since page load
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Reads</div>
              <div className="text-lg font-semibold">{quotaUsage.reads.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Writes</div>
              <div className="text-lg font-semibold">{quotaUsage.writes.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Total</div>
              <div className="text-lg font-semibold">{quotaUsage.total.toLocaleString()}</div>
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              <strong>Note:</strong> This is an estimate based on operations since page load. 
              For accurate quota usage, check your Firebase Console.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://console.firebase.google.com', '_blank')}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              Open Firebase Console
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

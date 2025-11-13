import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export const SettingsView = () => (
  <div className="p-4 md:p-6 space-y-6">
    <h2 className="text-2xl font-semibold">Settings</h2>
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Settings page coming soon... You can customize your Study OS preferences here.
        </p>
      </CardContent>
    </Card>
  </div>
);



'use client';
// Youssef Mostafa — CCU-S1-05 | Donations Module (Sprint 2)
// Assigned by: Loai Rafaat (Sprint Lead)

import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, LayoutDashboard, Heart } from 'lucide-react';

export function DonationPending() {
  const { setCurrentView } = useAppStore();

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <Card className="w-full text-center">
        <CardContent className="pt-10 pb-8 space-y-6">

          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />

          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">
              Thank You for Your Donation! 🐱
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your receipt has been submitted and is pending review by the admin team.
              We&apos;ll verify your contribution for cat welfare activities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button variant="default" onClick={() => setCurrentView('dashboard')}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={() => setCurrentView('donate')}>
              <Heart className="h-4 w-4 mr-2" />
              Donate Again
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

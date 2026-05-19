'use client';

// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, TrendingUp } from 'lucide-react';
import { fetchDonationProgress } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { useDonationProgress } from '@/lib/store';
import type { DonationProgress } from '@/lib/types';

export function FundraisingWidget() {
  const { setCurrentView } = useAppStore();
  // re-fetch whenever an admin approves or rejects a donation
  const { refreshTick } = useDonationProgress();
  const [progress, setProgress] = useState<DonationProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDonationProgress()
      .then(setProgress)
      .catch(() => {
        setProgress({ totalVerified: 0, goal: 10000, percentage: 0 });
      })
      .finally(() => setLoading(false));
  }, [refreshTick]); // refreshTick changes → this runs again → totals update

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-amber-600" />
          Fundraising Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          // slim skeleton that matches the layout without jumping around
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded-full" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        ) : progress ? (
          <>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold">
                RM {progress.totalVerified.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-muted-foreground">
                of RM {progress.goal.toLocaleString('en-MY')}
              </span>
            </div>

            {/* coloured progress bar */}
            <div className="h-2.5 rounded-full bg-amber-100 dark:bg-amber-900/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-700"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {progress.percentage}% of our RM {progress.goal.toLocaleString()} goal reached
            </p>

            <Button
              size="sm"
              onClick={() => setCurrentView('donate')}
              className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Heart className="h-4 w-4" />
              Donate Now
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

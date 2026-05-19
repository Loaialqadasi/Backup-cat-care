'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Wallet, RefreshCw, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDonationProgress } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import type { DonationProgress } from '@/lib/types';

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

function ProgressSkeleton() {
  return (
    <Card className="rounded-xl border-border/50">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-3 w-72" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DonationProgressTracker() {
  const token = useAppStore((s) => s.token);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState<DonationProgress | null>(null);

  const loadProgress = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const data = await fetchDonationProgress(token || undefined);
      setProgress(data);
    } catch {
      setProgress(null);
    } finally {
      setLoading(false);
      if (silent) setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadProgress();
    const id = window.setInterval(() => {
      loadProgress(true);
    }, 60000);
    return () => window.clearInterval(id);
  }, [loadProgress]);

  if (loading) return <ProgressSkeleton />;

  if (!progress) {
    return (
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Unable to load donation progress right now.</p>
          <Button className="mt-3" onClick={() => loadProgress()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-border/50 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-[#800000] via-[#a52a2a] to-[#FFD700]" />
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-[#800000] dark:text-[#FFD700]">
              <Wallet className="h-4.5 w-4.5" />
              Public Donation Progress Tracker
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Updates every 60 seconds and only counts verified donations.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {progress.achieved ? (
              <Badge className="bg-[#FFD700] text-[#5b3900] border border-[#d4af37]">
                <Trophy className="h-3 w-3 mr-1" />
                Goal Achieved
              </Badge>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProgress(true)}
              disabled={refreshing}
              className="border-[#800000]/25 hover:bg-[#800000]/5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#800000]/15 bg-[#800000]/5 p-3">
            <p className="text-xs text-muted-foreground">Verified Donations Collected</p>
            <p className="text-2xl font-bold text-[#800000] dark:text-[#FFD700]">
              {formatMoney(progress.totalVerifiedAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-[#FFD700]/35 bg-[#FFD700]/15 p-3">
            <p className="text-xs text-muted-foreground">Fundraising Goal</p>
            <p className="text-2xl font-bold text-[#6a4500] dark:text-[#FFD700]">
              {formatMoney(progress.goalAmount)}
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium">Progress</span>
            <span className="font-semibold text-[#800000] dark:text-[#FFD700]">{progress.percentage.toFixed(2)}%</span>
          </div>
          <div className="h-4 rounded-full bg-[#800000]/10 overflow-hidden border border-[#800000]/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, progress.percentage))}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#800000] to-[#FFD700]"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-[#800000] dark:text-[#FFD700]" />
              Recent Verified Donors
            </h4>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCurrentView('donation-upload')}>
              Donate Now
            </Button>
          </div>

          {progress.recentVerifiedDonors.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No verified donors yet.</p>
          ) : (
            <div className="space-y-2">
              {progress.recentVerifiedDonors.map((donor, index) => (
                <div key={`${donor.maskedName}-${donor.verifiedAt}-${index}`} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{donor.maskedName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Verified {new Date(donor.verifiedAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#800000] dark:text-[#FFD700]">{formatMoney(donor.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

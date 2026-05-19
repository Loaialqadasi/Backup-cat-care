'use client';

// Loai Rafaat — CCU-S1-05 | Donations Module (SCRUM-30 / TG-1)

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { fetchDonations } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Donation, ReceiptStatus, DonationFilters } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Visual treatment for each receipt status
const statusConfig: Record<ReceiptStatus, { label: string; icon: React.ReactNode; class: string }> = {
  pending: {
    label: 'Pending Review',
    icon: <Clock className="h-3 w-3" />,
    class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  approved: {
    label: 'Approved',
    icon: <CheckCircle2 className="h-3 w-3" />,
    class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle className="h-3 w-3" />,
    class: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  },
};

function DonationCard({ donation }: { donation: Donation }) {
  const status = statusConfig[donation.receiptStatus];
  const formattedDate = new Date(donation.createdAt).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="rounded-xl border-border/50 hover:border-border transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {/* Amount bubble */}
              <div className="flex-shrink-0 p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Heart className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">
                    {donation.currency} {donation.amount.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">by {donation.donorName}</span>
                </div>

                {donation.message && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    "{donation.message}"
                  </p>
                )}

                {/* Masked IDs — TG-1 compliance: never show the real value */}
                {(donation.studentIdMasked || donation.volunteerIdMasked) && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <ShieldCheck className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                    {donation.studentIdMasked && (
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {donation.studentIdMasked}
                      </span>
                    )}
                    {donation.volunteerIdMasked && (
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {donation.volunteerIdMasked}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">{formattedDate}</p>
              </div>
            </div>

            {/* Receipt status badge */}
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <Badge className={cn('gap-1.5 text-xs font-medium', status.class)}>
                {status.icon}
                {status.label}
              </Badge>

              {donation.receiptOriginalName && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Receipt className="h-3 w-3" />
                  Receipt attached
                </span>
              )}
            </div>
          </div>

          {/* Show admin notes if the receipt was rejected */}
          {donation.receiptStatus === 'rejected' && donation.adminNotes && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-xs text-red-600 dark:text-red-400">
                <span className="font-medium">Admin note: </span>
                {donation.adminNotes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DonationSkeleton() {
  return (
    <Card className="rounded-xl border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DonationList() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { setCurrentView, token } = useAppStore();

  const load = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const result = await fetchDonations({ page: currentPage, pageSize: 10 }, token || undefined);
      setDonations(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load(page);
  }, [page, load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Donations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalItems > 0 ? `${totalItems} donation${totalItems === 1 ? '' : 's'} submitted` : 'No donations yet'}
          </p>
        </div>
        <Button
          onClick={() => setCurrentView('create-donation')}
          className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Donate Now
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <DonationSkeleton key={i} />)
        ) : donations.length === 0 ? (
          <Card className="rounded-xl border-border/50">
            <CardContent className="py-16 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">No donations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to support the campus cats!
              </p>
              <Button
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => setCurrentView('create-donation')}
              >
                Make a Donation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {donations.map((d) => (
              <DonationCard key={d.id} donation={d} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

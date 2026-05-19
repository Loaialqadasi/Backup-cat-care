'use client';

// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useDonationProgress } from '@/lib/store';
import { fetchPendingDonations, reviewDonation } from '@/lib/api-client';
import type { Donation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Inbox,
  ZoomIn,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// fullscreen image modal — admins need to read the receipt clearly
function ReceiptPreviewModal({
  url,
  open,
  onClose,
}: {
  url: string | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-2 bg-black/90 border-border">
        {url && (
          <img
            src={url}
            alt="Receipt full view"
            className="w-full max-h-[80vh] object-contain rounded"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// a single donation card — shows donor info, the thumbnail, and action buttons
function DonationCard({
  donation,
  onApprove,
  onReject,
  onPreview,
  busy,
}: {
  donation: Donation;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPreview: (url: string) => void;
  busy: boolean;
}) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

  // if it's a relative path from the backend, prepend the base URL
  // validate against path traversal attacks
  const resolvedUrl = (() => {
    if (!donation.receiptUrl.startsWith('/')) return donation.receiptUrl;
    try {
      const normalized = new URL(donation.receiptUrl, API_BASE);
      if (!normalized.href.startsWith(API_BASE)) return '/placeholder.png';
      return normalized.href;
    } catch {
      return '/placeholder.png';
    }
  })();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      {/* receipt thumbnail — click to open the fullscreen preview */}
      <div
        className="relative group h-44 bg-muted cursor-pointer overflow-hidden"
        onClick={() => onPreview(resolvedUrl)}
      >
        <img
          src={resolvedUrl}
          alt={`Receipt from ${donation.donorName}`}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            // if the image fails to load, show a placeholder so the card doesn't break
            (e.target as HTMLImageElement).src = 'https://placecats.com/200/176';
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* donor info */}
        <div className="space-y-0.5">
          <p className="font-semibold text-sm truncate">{donation.donorName}</p>
          <p className="text-xs text-muted-foreground truncate">{donation.donorEmail}</p>
        </div>

        {/* claimed amount — big so it's easy to check against the receipt */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">
            RM {donation.claimedAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </span>
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        </div>

        {/* how long ago this was submitted */}
        <p className="text-xs text-muted-foreground">
          Submitted {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
        </p>

        {/* approve / reject buttons — disabled while an action is in flight */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onApprove(donation.id)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onReject(donation.id)}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5 dark:hover:bg-red-950/20"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDonationDashboard() {
  const { user, token, setCurrentView } = useAppStore();
  const { bumpRefreshTick } = useDonationProgress();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // redirect non-admins away — the middleware handles it on the backend too,
  // but we want a smooth UX redirect rather than showing an error screen
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Admin access required');
      setCurrentView('dashboard');
    }
  }, [user, setCurrentView]);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPendingDonations(token ?? undefined);
      setDonations(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not load pending donations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleReview = async (id: string, status: 'verified' | 'rejected') => {
    let rejectionReason: string | undefined;
    if (status === 'rejected') {
      rejectionReason = prompt('Please enter a reason for rejecting this donation:');
      if (rejectionReason === null) return; // user cancelled
      if (!rejectionReason.trim()) {
        toast.error('Rejection reason is required');
        return;
      }
    }
    setBusyId(id);
    try {
      await reviewDonation(id, status, token ?? undefined);
      // optimistic update — remove the card immediately so the admin sees instant feedback
      setDonations((prev) => prev.filter((d) => d.id !== id));
      // tell the fundraising widget to re-fetch its total — approved donations change the sum
      bumpRefreshTick();
      toast.success(status === 'verified' ? 'Donation approved ✓' : 'Donation rejected');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  // don't render for non-admins — the useEffect above will redirect them
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      {/* Dashboard header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 shadow-md shadow-amber-500/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Approval Dashboard</h1>
            <p className="text-sm text-muted-foreground">Review and verify pending donation receipts</p>
          </div>
        </div>
        {/* badge shows the live count so admins know what's in the queue at a glance */}
        {!loading && donations.length > 0 && (
          <Badge className="bg-amber-500 text-white text-sm px-3 py-1">
            {donations.length} pending
          </Badge>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="overflow-hidden animate-pulse">
              <div className="h-44 bg-muted" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded" />
                <div className="flex gap-2">
                  <div className="h-9 bg-muted rounded flex-1" />
                  <div className="h-9 bg-muted rounded flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state — nothing to review right now */}
      {!loading && donations.length === 0 && (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">All caught up!</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              There are no pending donation receipts to review right now. Check back later.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Scrollable grid of donation cards */}
      {!loading && donations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {donations.map((donation) => (
            <DonationCard
              key={donation.id}
              donation={donation}
              onApprove={(id) => handleReview(id, 'verified')}
              onReject={(id) => handleReview(id, 'rejected')}
              onPreview={(url) => setPreviewUrl(url)}
              busy={busyId === donation.id}
            />
          ))}
        </div>
      )}

      {/* Fullscreen receipt preview modal */}
      <ReceiptPreviewModal
        url={previewUrl}
        open={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
    </div>
  );
}

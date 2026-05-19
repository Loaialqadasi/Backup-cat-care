'use client';

// Loai Rafaat — CCU-S1-05 | Donations Module (SCRUM-30 / TG-1)
// Admin panel: view receipts, approve or reject them, see masked/decrypted IDs

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { fetchDonations, reviewDonationReceipt } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Donation, ReceiptStatus, DonationFilters } from '@/lib/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const statusConfig: Record<ReceiptStatus, { label: string; icon: React.ReactNode; class: string }> = {
  pending:  { label: 'Pending',  icon: <Clock       className="h-3 w-3" />, class: 'bg-amber-100  text-amber-700  dark:bg-amber-950/40  dark:text-amber-300'  },
  approved: { label: 'Approved', icon: <CheckCircle2 className="h-3 w-3" />, class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  rejected: { label: 'Rejected', icon: <XCircle     className="h-3 w-3" />, class: 'bg-red-100    text-red-700    dark:bg-red-950/40    dark:text-red-300'    },
};

// Modal that lets an admin approve or reject a single receipt
function ReviewModal({
  donation,
  onClose,
  onReviewed,
}: {
  donation: Donation;
  onClose: () => void;
  onReviewed: (updated: Donation) => void;
}) {
  const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { token } = useAppStore();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const updated = await reviewDonationReceipt(donation.id, status, notes, token || undefined);
      toast.success(`Receipt ${status} successfully`);
      onReviewed(updated);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to review receipt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Review Receipt</DialogTitle>
        <DialogDescription>
          Donation #{donation.id} — {donation.currency} {donation.amount.toFixed(2)} by {donation.donorName}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 pt-2">
        {/* Decrypted IDs — only admins see this section */}
        {(donation.studentId || donation.volunteerId) && (
          <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              Decrypted Identity (admin view only)
            </div>
            {donation.studentId && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-24">Student ID:</span>
                <span className="font-mono text-sm">{donation.studentId}</span>
              </div>
            )}
            {donation.volunteerId && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-24">Volunteer ID:</span>
                <span className="font-mono text-sm">{donation.volunteerId}</span>
              </div>
            )}
          </div>
        )}

        {/* Receipt file info */}
        {donation.receiptOriginalName ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <Receipt className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{donation.receiptOriginalName}</p>
              {donation.receiptSizeBytes && (
                <p className="text-xs text-muted-foreground">
                  {(donation.receiptSizeBytes / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-amber-600 dark:text-amber-400">No receipt file was attached</p>
          </div>
        )}

        {/* Decision */}
        <div className="space-y-2">
          <Label>Decision</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as 'approved' | 'rejected')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approved">Approve Receipt</SelectItem>
              <SelectItem value="rejected">Reject Receipt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">
            Admin Notes{' '}
            <span className="text-xs text-muted-foreground">
              {status === 'rejected' ? '(required for rejection)' : '(optional)'}
            </span>
          </Label>
          <Textarea
            id="notes"
            placeholder={
              status === 'rejected'
                ? 'Explain why the receipt was rejected...'
                : 'Optional notes visible to the donor...'
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (status === 'rejected' && !notes.trim())}
            className={cn(
              'flex-1',
              status === 'approved'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-destructive hover:bg-destructive/90 text-white'
            )}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === 'approved' ? (
              'Approve'
            ) : (
              'Reject'
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// One row in the admin table
function DonationRow({
  donation,
  onReview,
}: {
  donation: Donation;
  onReview: (d: Donation) => void;
}) {
  const status = statusConfig[donation.receiptStatus];

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
    >
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium">{donation.donorName}</p>
          <p className="text-xs text-muted-foreground">{donation.donorEmail}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-semibold text-sm">
          {donation.currency} {donation.amount.toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3">
        {/* Masked IDs shown here — TG-1 compliance */}
        {donation.studentIdMasked ? (
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{donation.studentIdMasked}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge className={cn('gap-1.5 text-xs', status.class)}>
          {status.icon}
          {status.label}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(donation.createdAt).toLocaleDateString('en-MY', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      <td className="px-4 py-3">
        {donation.receiptStatus === 'pending' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReview(donation)}
            className="gap-1.5 h-7 text-xs"
          >
            <Eye className="h-3 w-3" />
            Review
          </Button>
        )}
      </td>
    </motion.tr>
  );
}

export function AdminDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | ''>('');
  const [reviewTarget, setReviewTarget] = useState<Donation | null>(null);

  const { token } = useAppStore();

  const load = useCallback(async (currentPage: number, status: ReceiptStatus | '') => {
    setLoading(true);
    try {
      const result = await fetchDonations(
        { page: currentPage, pageSize: 15, status: status || undefined },
        token || undefined
      );
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
    load(page, statusFilter);
  }, [page, statusFilter, load]);

  const handleReviewed = (updated: Donation) => {
    // Update the row in-place so the list refreshes without a full reload
    setDonations((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const pendingCount = donations.filter((d) => d.receiptStatus === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Donation Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review payment receipts and manage donation records
          </p>
        </div>

        {pendingCount > 0 && (
          <Badge className="gap-1.5 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-sm px-3 py-1.5">
            <Clock className="h-3.5 w-3.5" />
            {pendingCount} pending review
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Select
          value={statusFilter || 'all'}
          onValueChange={(v) => {
            setPage(1);
            setStatusFilter(v === 'all' ? '' : (v as ReceiptStatus));
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground">{totalItems} total</span>
      </div>

      {/* TG-1 compliance note for admins */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">TG-1 Privacy: </span>
          Student and volunteer IDs are stored encrypted (AES-256-GCM). The table shows masked values only.
          Decrypted IDs are visible only inside the review dialog for verified admins.
        </p>
      </div>

      {/* Table */}
      <Card className="rounded-xl border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Donor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Student ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[100px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                    <Heart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No donations match this filter</p>
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <DonationRow key={d.id} donation={d} onReview={setReviewTarget} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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

      {/* Review modal */}
      <Dialog open={!!reviewTarget} onOpenChange={(open) => !open && setReviewTarget(null)}>
        {reviewTarget && (
          <ReviewModal
            donation={reviewTarget}
            onClose={() => setReviewTarget(null)}
            onReviewed={handleReviewed}
          />
        )}
      </Dialog>
    </div>
  );
}

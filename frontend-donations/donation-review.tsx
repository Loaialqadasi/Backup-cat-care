'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Clock3, FileWarning, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDonationSubmissions, updateDonationSubmissionStatus } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import type { Donation, DonationStatus } from '@/lib/types';

const statusBadgeClass: Record<DonationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function DonationReview() {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Donation[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetchDonationSubmissions('', token || undefined);
      setItems(response.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (user?.role !== 'admin') {
    return (
      <Card className="rounded-xl border-border/50 max-w-xl">
        <CardContent className="p-6 text-center">
          <FileWarning className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Admin access required</p>
          <p className="text-xs text-muted-foreground mt-1">
            Only admins can review and verify donation submissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const updateStatus = async (id: string, status: DonationStatus) => {
    try {
      setUpdatingId(id);
      await updateDonationSubmissionStatus(id, status, token || undefined);
      toast.success(`Donation marked as ${status}.`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card className="rounded-xl border-border/50">
      <CardHeader>
        <CardTitle className="text-[#800000] dark:text-[#FFD700]">Donation Receipt Review</CardTitle>
        <CardDescription>
          Verify pending donations to update the public fundraising progress tracker.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading submissions...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions found.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{item.donorName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge className={statusBadgeClass[item.status]}>{item.status}</Badge>
                </div>

                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Amount:</span> <span className="font-semibold">{formatMoney(item.amount)}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Receipt:</span>{' '}
                    <a href={item.receiptUrl} target="_blank" rel="noreferrer" className="text-[#800000] hover:underline">
                      View File
                    </a>
                  </p>
                </div>

                {item.note ? <p className="text-xs text-muted-foreground mt-2">Note: {item.note}</p> : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateStatus(item.id, 'verified')}
                    disabled={updatingId === item.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(item.id, 'rejected')}
                    disabled={updatingId === item.id}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(item.id, 'pending')}
                    disabled={updatingId === item.id}
                  >
                    <Clock3 className="h-4 w-4" />
                    Mark Pending
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

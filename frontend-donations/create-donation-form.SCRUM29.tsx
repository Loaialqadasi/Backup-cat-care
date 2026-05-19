'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ReceiptText, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createDonationReceipt } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';

const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export function CreateDonationForm() {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  const [donorName, setDonorName] = useState(user?.fullName ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const amountNumber = useMemo(() => Number(amount), [amount]);

  const onFileChange = (file: File | null) => {
    if (!file) {
      setReceipt(null);
      return;
    }

    if (!allowedMime.has(file.type)) {
      toast.error('Only JPG, PNG, WEBP, or PDF files are allowed.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size must be 8MB or smaller.');
      return;
    }

    setReceipt(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!donorName.trim()) {
      toast.error('Donor name is required.');
      return;
    }

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      toast.error('Please enter a valid donation amount.');
      return;
    }

    if (!receipt) {
      toast.error('Please upload your payment receipt.');
      return;
    }

    try {
      setSubmitting(true);
      await createDonationReceipt(
        {
          donorName: donorName.trim(),
          amount: amountNumber,
          note: note.trim() || undefined,
          receipt,
        },
        token || undefined
      );

      toast.success('Receipt submitted. Admin will review it shortly.');
      setAmount('');
      setNote('');
      setReceipt(null);
      setCurrentView('donation-progress');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload receipt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="rounded-xl border-border/50 max-w-2xl">
      <div className="h-1.5 bg-gradient-to-r from-[#800000] via-[#8f2727] to-[#FFD700]" />
      <CardHeader>
        <CardTitle className="text-[#800000] dark:text-[#FFD700] flex items-center gap-2">
          <ReceiptText className="h-5 w-5" />
          Upload Donation Receipt
        </CardTitle>
        <CardDescription>
          Securely submit payment proof. Your donation is counted only after admin verification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="donorName">Donor Name</Label>
            <Input
              id="donorName"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Your full name"
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Donation Amount (RM)</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="Any message for the fundraising team"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">Payment Receipt</Label>
            <div className="rounded-lg border border-dashed border-[#800000]/35 p-4 bg-[#800000]/5">
              <div className="flex items-center gap-3 mb-3">
                <UploadCloud className="h-5 w-5 text-[#800000] dark:text-[#FFD700]" />
                <p className="text-sm text-muted-foreground">JPG, PNG, WEBP, or PDF up to 8MB</p>
              </div>
              <Input
                id="receipt"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                required
              />
              {receipt ? <p className="text-xs mt-2 text-muted-foreground">Selected: {receipt.name}</p> : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" disabled={submitting} className="bg-[#800000] hover:bg-[#6b0000] text-white">
              {submitting ? 'Submitting...' : 'Submit Receipt'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setCurrentView('donation-progress')}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

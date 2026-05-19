'use client';

// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { submitDonation, fetchDonationProgress } from '@/lib/api-client';
import type { DonationProgress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart, Upload, X, CheckCircle, AlertCircle, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// shown above the form so donors understand what their money goes toward
function ProgressBar({ progress }: { progress: DonationProgress | null }) {
  if (!progress) return null;
  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardContent className="pt-5 pb-4">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-medium text-foreground">Fundraising Progress</span>
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            RM {progress.totalVerified.toLocaleString()} / RM {progress.goal.toLocaleString()}
          </span>
        </div>
        <div className="h-3 rounded-full bg-amber-100 dark:bg-amber-900/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-700"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground text-right">{progress.percentage}% of goal reached</p>
      </CardContent>
    </Card>
  );
}

// file drop zone — click to browse or drag and drop a receipt image
function ReceiptDropZone({
  file,
  onFile,
  onClear,
}: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFile(selected);
  };

  // if a file is already chosen, show a preview instead of the drop zone
  if (file) {
    const previewUrl = URL.createObjectURL(file);
    return (
      <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
        <img
          src={previewUrl}
          alt="Receipt preview"
          className="w-full max-h-52 object-contain"
          // revoke the blob URL once the image element is done with it to free memory
          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
        />
        <button
          type="button"
          onClick={onClear}
          className="absolute top-2 right-2 rounded-full bg-background/80 p-1 shadow hover:bg-background transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-xs text-muted-foreground text-center py-2 truncate px-4">{file.name}</p>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-colors',
        dragging
          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
          : 'border-border hover:border-amber-400 hover:bg-muted/40'
      )}
    >
      <ImageIcon className="h-10 w-10 text-muted-foreground/60" />
      <div className="text-center">
        <p className="text-sm font-medium">Drop your receipt here, or <span className="text-amber-600">click to browse</span></p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP or HEIC — max 10MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

export function DonateForm() {
  const { setCurrentView } = useAppStore();

  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [claimedAmount, setClaimedAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState<DonationProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // load the current fundraising total as soon as the component mounts
  useEffect(() => {
    fetchDonationProgress()
      .then(setProgress)
      .catch(() => { /* silent — the progress bar is optional */ })
      .finally(() => setLoadingProgress(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiptFile) {
      toast.error('Please upload your payment receipt');
      return;
    }

    const amount = parseFloat(claimedAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    setSubmitting(true);
    try {
      await submitDonation({
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim().toLowerCase(),
        claimedAmount: amount,
        receipt: receiptFile,
      });
      setSubmitted(true);
      // refresh the progress bar after a successful submission — it won't change until
      // an admin approves the donation, but the fresh call confirms the API is working
      fetchDonationProgress().then(setProgress).catch(() => {});
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // success state — shown after the form is submitted successfully
  if (submitted) {
    return (
      <div className="max-w-md mx-auto py-16 flex flex-col items-center text-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold">Thank you! 🐾</h2>
        <p className="text-muted-foreground">
          Your donation receipt has been submitted. Our admin team will verify the transfer and update the
          fundraising total shortly.
        </p>
        <Button
          variant="outline"
          onClick={() => setCurrentView('dashboard')}
          className="mt-2"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 shadow-md shadow-amber-500/20">
          <Heart className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Donate to CatCare UTM</h1>
          <p className="text-sm text-muted-foreground">Upload your bank transfer receipt after making a payment</p>
        </div>
      </div>

      {/* Live fundraising progress bar */}
      {!loadingProgress && <ProgressBar progress={progress} />}

      {/* Bank account info so donors know where to send money */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-blue-800 dark:text-blue-300">How to donate</p>
              <p className="text-blue-700 dark:text-blue-400">
                Transfer to <strong>Maybank: 1234 5678 9012</strong> (CatCare UTM) then upload your receipt below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Submit Your Receipt</CardTitle>
          <CardDescription>Fill in your details and attach a screenshot of your payment confirmation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-2">
              <Label htmlFor="donorName">Full Name</Label>
              <Input
                id="donorName"
                placeholder="e.g. Ahmad Faris"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="donorEmail">UTM Email</Label>
              <Input
                id="donorEmail"
                type="email"
                placeholder="e.g. you@graduate.utm.my"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claimedAmount">Amount Transferred (RM)</Label>
              <Input
                id="claimedAmount"
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 50.00"
                value={claimedAmount}
                onChange={(e) => setClaimedAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Receipt</Label>
              <ReceiptDropZone
                file={receiptFile}
                onFile={setReceiptFile}
                onClear={() => setReceiptFile(null)}
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !receiptFile}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4 animate-bounce" />
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Submit Receipt
                </span>
              )}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

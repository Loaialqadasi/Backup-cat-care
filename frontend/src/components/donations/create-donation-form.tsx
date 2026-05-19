'use client';

// Loai Rafaat — CCU-S1-05 | Donations Module (SCRUM-30 / TG-1)

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, X, FileText, Image, Loader2, Heart, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { createDonation } from '@/lib/api-client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// These are the only file types the backend accepts
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE_MB = 5;

export function CreateDonationForm() {
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [currency] = useState('MYR'); // Fixed to MYR for UTM
  const [message, setMessage] = useState('');
  const [studentId, setStudentId] = useState('');
  const [volunteerId, setVolunteerId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCurrentView, token, user } = useAppStore();

  // Pre-fill the donor's name and email if they're logged in
  useEffect(() => {
    if (user) {
      setDonorName(user.fullName);
      setDonorEmail(user.email);
    }
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, WEBP, and PDF files are accepted');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Receipt file must be smaller than ${MAX_FILE_SIZE_MB} MB`);
      return;
    }

    setReceiptFile(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateForm = (): boolean => {
    if (!donorName.trim() || donorName.trim().split(' ').length < 2) {
      toast.error('Please enter your full name (at least two words)');
      return false;
    }
    if (!donorEmail.trim() || !donorEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return false;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid donation amount');
      return false;
    }
    if (parsedAmount > 99999.99) {
      toast.error('Amount seems too large — please verify');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await createDonation(
        {
          donorName:  donorName.trim(),
          donorEmail: donorEmail.trim().toLowerCase(),
          amount:     parseFloat(amount),
          currency,
          message:    message.trim() || undefined,
          // These will be encrypted server-side — we're just passing the plain values
          studentId:   studentId.trim() || undefined,
          volunteerId: volunteerId.trim() || undefined,
        },
        receiptFile,
        token || undefined
      );

      toast.success('Donation submitted! An admin will review your receipt shortly.');
      setCurrentView('donations');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit donation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentView('donations')}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Donations
      </Button>

      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Submit a Donation</CardTitle>
              <CardDescription>
                Help care for the cats at UTM. Upload your payment receipt so it can be verified.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* TG-1 encryption notice */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your student or volunteer ID is encrypted before storage using AES-256.
              Only masked values (e.g.{' '}
              <span className="font-mono text-foreground">A21******11</span>) are ever displayed.
            </p>
          </div>

          {/* Donor details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Your Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donorName">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="donorName"
                  placeholder="e.g. Ahmad bin Abdullah"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="donorEmail">Email Address <span className="text-destructive">*</span></Label>
                <Input
                  id="donorEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Sensitive IDs — clearly labelled as optional and secure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">
                  Student ID{' '}
                  <span className="text-xs text-muted-foreground">(optional, encrypted)</span>
                </Label>
                <Input
                  id="studentId"
                  placeholder="e.g. A21CS0011"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  disabled={submitting}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="volunteerId">
                  Volunteer ID{' '}
                  <span className="text-xs text-muted-foreground">(optional, encrypted)</span>
                </Label>
                <Input
                  id="volunteerId"
                  placeholder="e.g. V2024001"
                  value={volunteerId}
                  onChange={(e) => setVolunteerId(e.target.value.toUpperCase())}
                  disabled={submitting}
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Donation Amount</h3>

            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="amount">Amount (MYR) <span className="text-destructive">*</span></Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={submitting}
                  className="text-lg font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="message"
                placeholder="Add a note about your donation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Receipt upload */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Payment Receipt</h3>
            <p className="text-xs text-muted-foreground">
              Upload a screenshot or PDF of your payment confirmation. Max {MAX_FILE_SIZE_MB} MB.
              Accepted: JPEG, PNG, WEBP, PDF.
            </p>

            {!receiptFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Click to upload receipt
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, WEBP, or PDF
                </p>
              </button>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex-shrink-0 p-2.5 rounded-lg bg-background border border-border">
                  {receiptFile.type === 'application/pdf' ? (
                    <FileText className="h-5 w-5 text-red-500" />
                  ) : (
                    <Image className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{receiptFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(receiptFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setReceiptFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  disabled={submitting}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setCurrentView('donations')}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Submit Donation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

'use client';
// Youssef Mostafa — CCU-S1-05 | Donations Module (Sprint 2)
// Assigned by: Loai Rafaat (Sprint Lead)
// SCRUM-31 (UI) + SCRUM-32 (Logic)

import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { uploadDonation } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, ImageIcon, Loader2, X, Heart } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024;            // 5 MB — matches acceptance criteria
const ALLOWED_EXTS  = ['.jpg', '.jpeg', '.png'];
const ALLOWED_MIMES = ['image/jpeg', 'image/png'];
const BLOCKED_KEYS  = ['e', 'E', '+', '-'];       // block non-numeric keys in amount field

// ── Helper ────────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function DonateForm() {
  const { token, setCurrentView } = useAppStore();

  const [amount,        setAmount]        = useState<string>('');
  const [selectedFile,  setSelectedFile]  = useState<File | null>(null);
  const [previewUrl,    setPreviewUrl]    = useState<string | null>(null);
  const [isUploading,   setIsUploading]   = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File selection ────────────────────────────────────────────────────────
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Null-safe: user may cancel picker — e.target.files will be null — app must NOT crash
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate extension and MIME type (double-check — defence in depth)
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
      if (!ALLOWED_EXTS.includes(ext) || !ALLOWED_MIMES.includes(file.type)) {
        setError('Only .jpg, .jpeg, or .png files are allowed.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError('File size must not exceed 5 MB.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Valid — create preview and clear previous error
      setError(null);
      setSelectedFile(file);
      // Revoke old blob URL before creating a new one — prevents memory leaks
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    },
    []
  );

  // ── Clear file ────────────────────────────────────────────────────────────
  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid donation amount greater than 0.');
      return;
    }
    if (!selectedFile) {
      setError('Please select a receipt image before submitting.');
      return;
    }
    if (isUploading) return; // hard guard — prevents double-submit

    setIsUploading(true);
    try {
      await uploadDonation(parsedAmount, selectedFile, token!);
      // Full form reset before navigating
      setAmount('');
      clearFile();
      setCurrentView('donation-pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-6 w-6 text-rose-500" />
            Donate to CatCare UTM
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your donation receipt so the admin team can verify your contribution
            for campus cat welfare activities.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Amount ── */}
          <div className="space-y-2">
            <Label htmlFor="donation-amount">Donation Amount (RM)</Label>
            <Input
              id="donation-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 25.00"
              value={amount}
              disabled={isUploading}
              onKeyDown={(e) => {
                if (BLOCKED_KEYS.includes(e.key)) e.preventDefault();
              }}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* ── File picker ── */}
          <div className="space-y-2">
            <Label>Receipt Image</Label>

            {/* Hidden real input — triggered via htmlFor label, no JS click() hacks */}
            <input
              ref={fileInputRef}
              id="receipt-file-input"
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              disabled={isUploading}
              onChange={handleFileChange}
            />

            {!selectedFile ? (
              <label
                htmlFor="receipt-file-input"
                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors select-none"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload receipt</span>
                <span className="text-xs text-muted-foreground/70 mt-1">.jpg, .jpeg, .png — max 5 MB</span>
              </label>
            ) : (
              /* ── Preview ── */
              <div className="rounded-lg border border-border overflow-hidden">
                <img
                  src={previewUrl!}
                  alt="Receipt preview"
                  className="w-full max-h-64 object-contain bg-muted"
                />
                <div className="flex items-center gap-2 p-2 bg-background border-t border-border">
                  <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {selectedFile.name} — {formatBytes(selectedFile.size)}
                  </span>
                  <button
                    type="button"
                    onClick={clearFile}
                    disabled={isUploading}
                    className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                    aria-label="Remove selected file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <p className="text-sm text-destructive font-medium" role="alert">
              {error}
            </p>
          )}

          {/* ── Submit ── */}
          <Button
            type="submit"
            className="w-full"
            disabled={isUploading || !amount || !selectedFile}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Submit Donation
              </>
            )}
          </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

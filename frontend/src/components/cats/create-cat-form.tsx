'use client';

// Loai Rafaat — CCU-S1-02 | Cat Management Module

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { createCat } from '@/lib/api-client';
import { toast } from 'sonner';
import type { HealthStatus, OwnershipTag } from '@/lib/types';
import { motion } from 'framer-motion';

export function CreateCatForm() {
  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('unknown');
  const [ownershipTag, setOwnershipTag] = useState<OwnershipTag>('stray');
  const [submitting, setSubmitting] = useState(false);

  const { setCurrentView, navigateToCatDetail, token } = useAppStore();

  const validateForm = (): boolean => {
    if (!nickname.trim()) {
      toast.error('Please enter a nickname for the cat');
      return false;
    }
    if (nickname.trim().length < 2) {
      toast.error('Nickname must be at least 2 characters');
      return false;
    }
    if (!description.trim()) {
      toast.error('Please provide a description');
      return false;
    }
    if (!locationName.trim()) {
      toast.error('Please enter the location');
      return false;
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error('Please enter a valid latitude (-90 to 90)');
      return false;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error('Please enter a valid longitude (-180 to 180)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const newCat = await createCat(
        {
          nickname: nickname.trim(),
          description: description.trim(),
          photoUrl: photoUrl.trim() || undefined,
          locationName: locationName.trim(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          healthStatus,
          ownershipTag,
        },
        token || undefined
      );
      toast.success('Cat registered!', { description: `${newCat.nickname} has been added to the system` });
      navigateToCatDetail(newCat.id);
    } catch (err) {
      toast.error('Failed to create cat', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentView('cats')}
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Cats
      </Button>

      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-xl">Register New Cat</CardTitle>
          <CardDescription>
            Add a new campus cat to the management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname">Cat Nickname *</Label>
              <Input
                id="nickname"
                placeholder="e.g., Whiskers, Luna, Mochi"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the cat's appearance, behavior, and any special notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={submitting}
              />
            </div>

            {/* Photo URL */}
            <div className="space-y-2">
              <Label htmlFor="photoUrl">Photo URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="photoUrl"
                  placeholder="https://example.com/cat-photo.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for a default photo
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location Name *</Label>
              <Input
                id="location"
                placeholder="e.g., Engineering Faculty, Block E"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="1.5600"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="103.6350"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Health Status & Ownership */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Health Status</Label>
                <Select value={healthStatus} onValueChange={(v) => setHealthStatus(v as HealthStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="needs_attention">Needs Attention</SelectItem>
                    <SelectItem value="injured">Injured</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ownership Tag</Label>
                <Select value={ownershipTag} onValueChange={(v) => setOwnershipTag(v as OwnershipTag)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stray">Stray</SelectItem>
                    <SelectItem value="adopted">Adopted</SelectItem>
                    <SelectItem value="campus_managed">Campus Managed</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentView('cats')}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Register Cat
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

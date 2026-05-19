'use client';

// Loai Rafaat — CCU-S1-02 | Cat Management Module

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Tag,
  HeartPulse,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCatById } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import type { Cat, HealthStatus, OwnershipTag } from '@/lib/types';
import { motion } from 'framer-motion';

const healthConfig: Record<HealthStatus, { color: string; bgColor: string; label: string; icon: string }> = {
  healthy: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    label: 'Healthy',
    icon: '💚',
  },
  needs_attention: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    label: 'Needs Attention',
    icon: '💛',
  },
  injured: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800',
    label: 'Injured',
    icon: '❤️‍🩹',
  },
  unknown: {
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-950/40 border-gray-200 dark:border-gray-800',
    label: 'Unknown',
    icon: '❓',
  },
};

const ownershipLabels: Record<OwnershipTag, string> = {
  stray: 'Stray',
  adopted: 'Adopted',
  campus_managed: 'Campus Managed',
  unknown: 'Unknown',
};

const ownershipColors: Record<OwnershipTag, string> = {
  stray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  adopted: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  campus_managed: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  unknown: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CatDetail() {
  const [cat, setCat] = useState<Cat | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedCatId, setCurrentView } = useAppStore();
  const token = useAppStore((s) => s.token);

  useEffect(() => {
    if (!selectedCatId) return;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchCatById(selectedCatId, token || undefined);
        setCat(data);
      } catch {
        setCat(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [selectedCatId, token]);

  if (loading) return <DetailSkeleton />;

  if (!cat) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Cat not found</p>
        <Button variant="outline" className="mt-4" onClick={() => setCurrentView('cats')}>
          Back to Cats
        </Button>
      </div>
    );
  }

  const health = healthConfig[cat.healthStatus];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentView('cats')}
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Cats
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cat Photo */}
        <div className="lg:col-span-2">
          <Card className="rounded-xl overflow-hidden border-border/50">
            <div className="aspect-square relative bg-muted">
              <img
                src={cat.photoUrl}
                alt={cat.nickname}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placecats.com/millie/400/300';
                }}
              />
            </div>
          </Card>
        </div>

        {/* Cat Info */}
        <div className="lg:col-span-3 space-y-5">
          {/* Name & Badges */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{cat.nickname}</h1>
              <Badge
                variant="outline"
                className={cn('text-sm px-3 py-0.5 font-medium border', health.bgColor, health.color)}
              >
                {health.icon} {health.label}
              </Badge>
              <Badge
                variant="secondary"
                className={cn('text-sm px-3 py-0.5', ownershipColors[cat.ownershipTag])}
              >
                {ownershipLabels[cat.ownershipTag]}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-foreground leading-relaxed">
                {cat.description}
              </p>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-xl border-border/50">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs font-medium">Location</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{cat.locationName}</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border/50">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HeartPulse className="h-4 w-4" />
                  <span className="text-xs font-medium">Health</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{health.label}</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border/50">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-medium">Ownership</span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {ownershipLabels[cat.ownershipTag]}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border/50">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Registered</span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(cat.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Coordinates */}
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Tag className="h-4 w-4" />
                <span className="text-xs font-medium">Coordinates</span>
              </div>
              <p className="text-sm font-mono text-foreground">
                {cat.latitude.toFixed(4)}, {cat.longitude.toFixed(4)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Calendar,
  Shield,
  LogOut,
  BookOpen,
  Award,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const roleColors: Record<string, string> = {
  student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  volunteer: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  admin: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

const roleDescriptions: Record<string, { desc: string; icon: React.ReactNode }> = {
  student: {
    desc: 'Can view cats and report emergencies',
    icon: <BookOpen className="h-4 w-4" />,
  },
  volunteer: {
    desc: 'Can manage cats and update emergency statuses',
    icon: <Award className="h-4 w-4" />,
  },
  admin: {
    desc: 'Full system access and management',
    icon: <Shield className="h-4 w-4" />,
  },
};

export function UserProfile() {
  const { user, logout } = useAppStore();

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleInfo = roleDescriptions[user.role] || roleDescriptions.student;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      {/* Profile Header */}
      <Card className="rounded-xl border-border/50 overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
        <CardContent className="p-6 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-amber-500 text-white text-2xl font-bold flex items-center justify-center border-4 border-card shadow-lg">
                {initials}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground">{user.fullName}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={cn('text-sm px-3 py-1 font-medium self-start sm:self-auto', roleColors[user.role])}
            >
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Role Info */}
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40">
              {roleInfo.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Role Permissions</p>
              <p className="text-xs text-muted-foreground">{roleInfo.desc}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account Details</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-sm font-medium text-foreground">{user.fullName}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="text-sm font-medium text-foreground">{user.email}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(user.updatedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="rounded-xl border-red-200 dark:border-red-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-red-700 dark:text-red-400">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your account on this device.
          </p>
          <Button
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

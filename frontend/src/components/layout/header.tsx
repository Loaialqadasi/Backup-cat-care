'use client';

// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  LogOut,
  User,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const roleColors: Record<string, string> = {
  student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  volunteer: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  admin: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const roleLabels: Record<string, string> = {
  student: 'Student',
  volunteer: 'Volunteer',
  admin: 'Admin',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, setCurrentView } = useAppStore();
  const currentView = useAppStore((s) => s.currentView);

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border/50 bg-card/80 backdrop-blur-md transition-all duration-300'
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Page title based on current view */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {getViewTitle(currentView)}
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {getViewDescription(currentView)}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white text-xs font-bold">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {user.fullName}
                </p>
                <Badge
                  variant="secondary"
                  className={cn('text-[10px] px-1.5 py-0 h-4 font-medium', roleColors[user.role])}
                >
                  {roleLabels[user.role]}
                </Badge>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCurrentView('profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function getViewTitle(view: string): string {
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    cats: 'Campus Cats',
    'cat-detail': 'Cat Details',
    'create-cat': 'Add New Cat',
    emergencies: 'Emergency Reports',
    'emergency-detail': 'Emergency Details',
    'create-emergency': 'Report Emergency',
    profile: 'My Profile',
  };
  return titles[view] || 'CatCare UTM';
}

function getViewDescription(view: string): string {
  const descriptions: Record<string, string> = {
    dashboard: 'Overview of campus cat management',
    cats: 'Browse and manage registered campus cats',
    'cat-detail': 'Detailed cat information',
    'create-cat': 'Register a new campus cat',
    emergencies: 'View and manage emergency reports',
    'emergency-detail': 'Emergency report details',
    'create-emergency': 'Submit a new emergency report',
    profile: 'Your account information',
  };
  return descriptions[view] || '';
}

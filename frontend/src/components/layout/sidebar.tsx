'use client';

// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { AppView } from '@/lib/types';
import {
  LayoutDashboard,
  Cat,
  AlertTriangle,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    section: 'Main',
  },
  {
    id: 'cats',
    label: 'All Cats',
    icon: <Cat className="h-5 w-5" />,
    section: 'Main',
  },
  {
    id: 'create-cat',
    label: 'Add Cat',
    icon: <Plus className="h-5 w-5" />,
    section: 'Actions',
  },
  {
    id: 'emergencies',
    label: 'Emergencies',
    icon: <AlertTriangle className="h-5 w-5" />,
    section: 'Reports',
  },
  {
    id: 'create-emergency',
    label: 'Report Emergency',
    icon: <Plus className="h-5 w-5" />,
    section: 'Actions',
  },
  {
    id: 'donations',
    label: 'Donations',
    icon: <Heart className="h-5 w-5" />,
    section: 'Donations',
  },
  {
    id: 'create-donation',
    label: 'Donate Now',
    icon: <Plus className="h-5 w-5" />,
    section: 'Donations',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="h-5 w-5" />,
    section: 'Account',
  },
];

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate: (view: AppView) => void;
}) {
  const { currentView, user } = useAppStore();

  // Admins get an extra section to manage all donation receipts
  const adminNavItems: NavItem[] = user?.role === 'admin' ? [
    {
      id: 'admin-donations',
      label: 'Manage Receipts',
      icon: <Heart className="h-5 w-5" />,
      section: 'Admin',
    },
  ] : [];

  const allNavItems = [...navItems, ...adminNavItems];
  const sections = ['Main', 'Reports', 'Actions', 'Donations', ...(user?.role === 'admin' ? ['Admin'] : []), 'Account'];

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={cn(
        'flex items-center gap-3 p-4 border-b border-border/50',
        collapsed && 'justify-center p-3'
      )}>
        <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 shadow-md shadow-amber-500/20">
          <Cat className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-lg font-bold text-foreground truncate">CatCare UTM</h2>
            <p className="text-[10px] text-muted-foreground leading-none">Campus Cat Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {sections.map((section) => {
          const sectionItems = allNavItems.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;

          return (
            <div key={section} className="mb-2">
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section}
                </p>
              )}
              {collapsed && section !== 'Main' && (
                <Separator className="my-2" />
              )}
              {sectionItems.map((item) => {
                const isActive = currentView === item.id;

                const button = (
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg transition-all duration-200',
                      collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                      isActive
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <span className={cn(
                      'flex-shrink-0 transition-colors',
                      isActive && 'text-amber-600 dark:text-amber-400'
                    )}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate text-sm">{item.label}</span>
                    )}
                    {isActive && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.id} delayDuration={0}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return <div key={item.id}>{button}</div>;
              })}
            </div>
          );
        })}
      </nav>

      {/* Demo Mode Badge */}
      <div className={cn('p-3 border-t border-border/50', collapsed && 'p-2')}>
        <div className={cn(
          'rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800',
          collapsed ? 'p-2' : 'p-3'
        )}>
          <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {!collapsed && (
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                Demo Mode Active
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ collapsed, onToggleCollapse }: { collapsed: boolean; onToggleCollapse: () => void }) {
  const { setCurrentView, setSidebarOpen } = useAppStore();

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border z-40 transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        <SidebarContent collapsed={collapsed} onNavigate={handleNavigate} />
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-6 z-50 flex items-center justify-center w-6 h-6 rounded-full border bg-card shadow-sm hover:bg-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <MobileSidebar onNavigate={handleNavigate} />
    </>
  );
}

function MobileSidebar({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <SidebarContent collapsed={false} onNavigate={onNavigate} />
      </SheetContent>
    </Sheet>
  );
}

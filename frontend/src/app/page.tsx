// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import type { AppView } from '@/lib/types';

import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentEmergencies } from '@/components/dashboard/recent-emergencies';
import { RecentCats } from '@/components/dashboard/recent-cats';

import { CatList } from '@/components/cats/cat-list';
import { CatDetail } from '@/components/cats/cat-detail';
import { CreateCatForm } from '@/components/cats/create-cat-form';

import { EmergencyList } from '@/components/emergencies/emergency-list';
import { EmergencyDetail } from '@/components/emergencies/emergency-detail';
import { CreateEmergencyForm } from '@/components/emergencies/create-emergency-form';

import { UserProfile } from '@/components/profile/user-profile';

import { DonationList } from '@/components/donations/donation-list';
import { CreateDonationForm } from '@/components/donations/create-donation-form';
import { AdminDonations } from '@/components/donations/admin-donations';

function DashboardView() {
  return (
    <div className="space-y-6">
      <StatsCards />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentEmergencies />
        <RecentCats />
      </div>
    </div>
  );
}

function AuthRouter({ view }: { view: AppView }) {
  switch (view) {
    case 'register':
      return <RegisterForm />;
    case 'login':
    default:
      return <LoginForm />;
  }
}

function AppRouter({ view }: { view: AppView }) {
  const { user } = useAppStore();
  switch (view) {
    case 'dashboard':
      return <DashboardView />;
    case 'cats':
      return <CatList />;
    case 'cat-detail':
      return <CatDetail />;
    case 'create-cat':
      return <CreateCatForm />;
    case 'emergencies':
      return <EmergencyList />;
    case 'emergency-detail':
      return <EmergencyDetail />;
    case 'create-emergency':
      return <CreateEmergencyForm />;
    case 'profile':
      return <UserProfile />;
    case 'donations':
      return <DonationList />;
    case 'create-donation':
      return <CreateDonationForm />;
    case 'admin-donations':
      // Defence-in-depth: backend already enforces admin role, but guard here too
      return user?.role === 'admin' ? <AdminDonations /> : <DashboardView />;
    default:
      return <DashboardView />;
  }
}

export default function Home() {
  const { currentView, isAuthenticated, sidebarOpen, setSidebarOpen, toggleSidebar } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // M-3 fix: track whether we're on desktop via state (no SSR flash)
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // on small screens the sidebar should never be collapsed
  useEffect(() => {
    if (!isDesktop) {
      setSidebarCollapsed(false);
    }
  }, [isDesktop]);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // not logged in? show login/register screens
  if (!isAuthenticated) {
    return <AuthRouter view={currentView} />;
  }

  // logged in — show the main app with sidebar + header
  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div
        className="transition-all duration-300"
        className={isDesktop ? (sidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]') : ''}
      >
        <Header onMenuClick={toggleSidebar} />

        <main className="p-4 sm:p-6 lg:p-8">
          <AppRouter view={currentView} />
        </main>
      </div>
    </div>
  );
}

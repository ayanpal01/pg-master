"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { 
  LayoutDashboard, 
  History, 
  User as UserIcon, 
  LogOut, 
  ChefHat, 
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  mobile?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, active, mobile }) => {
  if (mobile) {
    return (
      <Link 
        href={href} 
        className={`flex flex-col items-center justify-center flex-1 gap-1 py-2 transition-all ${
          active ? 'text-primary' : 'text-neutral-500'
        }`}
      >
        {React.cloneElement(icon as any, { size: 20 })}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </Link>
    );
  }

  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' 
          : 'text-neutral-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {React.cloneElement(icon as any, { size: 20 })}
      <span className="text-sm font-bold tracking-wide">{label}</span>
    </Link>
  );
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  // Don't show shell on login page (root /)
  const isLoginPage = pathname === '/';
  if (isLoginPage || loading || !user) {
    return <>{children}</>;
  }

  const menuItems = [
    { href: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    // Only show Attendance to MANAGER
    ...(user?.role === 'MANAGER' ? [{ href: '/attendance', icon: <Calendar />, label: 'Attendance' }] : []),
    { href: '/history', icon: <History />, label: 'History' },
    { href: '/profile', icon: <UserIcon />, label: 'Account' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 border-r border-border bg-black/20 backdrop-blur-xl flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]">
            <ChefHat className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">PG Master</h1>
            <div className="flex items-center gap-1">
               <ShieldCheck size={10} className="text-primary" />
               <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{user.role}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <NavItem 
              key={item.href} 
              {...item} 
              active={pathname === item.href} 
            />
          ))}
        </nav>

        <div className="pt-6 mt-6 border-t border-white/5 space-y-2">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut size={20} />
            <span className="text-sm font-bold tracking-wide">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-0 overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/60 backdrop-blur-2xl border-t border-white/5 flex items-center px-4 z-50">
        {menuItems.map((item) => (
          <NavItem 
            key={item.href} 
            {...item} 
            active={pathname === item.href} 
            mobile
          />
        ))}
        <button 
          onClick={logout}
          className="flex flex-col items-center justify-center flex-1 gap-1 py-2 text-red-500"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Logout</span>
        </button>
      </nav>
    </div>
  );
}

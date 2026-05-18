'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LayoutGrid, LogOut } from 'lucide-react';
import { logout } from '@/lib/auth';

export function AppSidebar() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div
      className="flex h-screen w-60 flex-col"
      style={{
        backgroundColor: 'hsl(240 5.9% 10%)',
        color: 'hsl(240 4.8% 95.9%)',
        borderRight: '1px solid hsl(240 5.9% 15%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10">
        <LayoutGrid className="h-5 w-5" />
        <span className="text-base font-semibold">TrainSmart</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 transition-colors min-h-[44px]"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">Operator</p>
          <p className="text-xs opacity-60 truncate">operator@trainsmart.local</p>
        </div>
        <button
          onClick={handleLogout}
          className="ml-2 rounded p-1 hover:bg-white/10 transition-colors"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

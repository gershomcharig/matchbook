'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { clearSessionToken } from '@/lib/auth';

interface LayoutProps {
  children: ReactNode;
  sidePanel?: ReactNode;
}

export default function Layout({ children, sidePanel }: LayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearSessionToken();
    router.push('/login');
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      {/* Map area - fills available space */}
      <div className="flex-1 relative">
        {/* Logout button - fixed in top-right corner */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>

        {children}
      </div>

      {/* Side panel area - desktop only, reserved space for future use */}
      {sidePanel && (
        <div className="hidden lg:block w-[400px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          {sidePanel}
        </div>
      )}
    </div>
  );
}

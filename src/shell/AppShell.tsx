'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { ToastRack } from '@/components/ui/Toast';

export function AppShell({ children }: { children: ReactNode }) {
  const emp = useAuthStore((s) => s.currentEmployee);
  const role = emp?.role ?? 'employee';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-full min-h-screen bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-60">
            <Sidebar role={role} collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <span className="hidden text-sm text-slate-500 sm:inline">Novelty Wealth (FW Fintech Pvt Ltd) · HR Portal</span>
          </div>
          <UserMenu />
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      <ToastRack />
    </div>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NAV_ITEMS } from './nav';
import type { Role } from '@/types';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';

export function Sidebar({
  role,
  collapsed,
  onToggle,
  onNavigate,
}: {
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((n) => !n.roles || n.roles.includes(role));
  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-slate-200 bg-white transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-brand-600 font-bold text-white">
          N
        </div>
        {!collapsed ? (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">Novelty Wealth</span>
            <span className="text-[11px] text-slate-500">People portal</span>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {items.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-slate-100 p-2 lg:block">
        <Button variant="ghost" size="sm" onClick={onToggle} className="w-full justify-center">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed ? <span className="text-xs">Collapse</span> : null}
        </Button>
      </div>
    </aside>
  );
}

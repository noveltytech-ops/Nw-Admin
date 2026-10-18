'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { signOut, useCurrentEmployee } from '@/stores/auth.context';
import { cn } from '@/utils/cn';

const ROLE_LABEL: Record<string, string> = {
  employee: 'Employee',
  manager: 'Manager',
  admin: 'Admin',
};

export function UserMenu() {
  const emp = useCurrentEmployee();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const name = `${emp.firstName}${emp.lastName ? ` ${emp.lastName}` : ''}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm shadow-sm hover:bg-slate-50"
      >
        <Avatar firstName={emp.firstName} lastName={emp.lastName} color={emp.avatarColor} size="sm" />
        <div className="hidden flex-col text-left md:flex">
          <span className="text-sm font-medium leading-tight text-slate-900">{name}</span>
          <span className="text-[11px] leading-tight text-slate-500">{ROLE_LABEL[emp.role]}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3">
            <Avatar firstName={emp.firstName} lastName={emp.lastName} color={emp.avatarColor} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{name}</p>
              <p className="truncate text-xs text-slate-500">{emp.email}</p>
            </div>
            <Badge tone={emp.role === 'admin' ? 'brand' : emp.role === 'manager' ? 'violet' : 'neutral'}>
              {ROLE_LABEL[emp.role]}
            </Badge>
          </div>
          <div className="px-1 py-1">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await signOut();
              }}
              className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              {busy ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

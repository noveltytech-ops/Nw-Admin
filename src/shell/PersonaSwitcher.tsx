'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { useAppState } from './AppStateContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import type { Employee, Role } from '@/types';

const roleLabel: Record<Role, string> = {
  employee: 'Employee',
  manager: 'Manager',
  admin: 'Admin',
};

const ROLE_ORDER: Role[] = ['admin', 'manager', 'employee'];

export function PersonaSwitcher() {
  const { state, currentUser, setCurrentPersona } = useAppState();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const grouped = useMemo(() => {
    const groups: Record<Role, Employee[]> = { admin: [], manager: [], employee: [] };
    for (const emp of state.employees) {
      if (!emp.active) continue;
      groups[emp.role].push(emp);
    }
    for (const r of ROLE_ORDER) {
      groups[r].sort((a, b) => a.firstName.localeCompare(b.firstName));
    }
    return groups;
  }, [state.employees]);

  const displayName = `${currentUser.firstName}${currentUser.lastName ? ` ${currentUser.lastName}` : ''}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm shadow-sm hover:bg-slate-50"
      >
        <Avatar firstName={currentUser.firstName} lastName={currentUser.lastName} color={currentUser.avatarColor} size="sm" />
        <div className="hidden flex-col text-left md:flex">
          <span className="text-sm font-medium leading-tight text-slate-900">{displayName}</span>
          <span className="text-[11px] leading-tight text-slate-500">{roleLabel[currentUser.role]}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-amber-50 px-3 py-2">
            <Users className="h-4 w-4 text-amber-700" />
            <p className="text-xs text-amber-900">
              Demo persona switcher — this is <strong>not authentication</strong>.
            </p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto scrollbar-thin py-1">
            {ROLE_ORDER.map((role) => {
              const items = grouped[role];
              if (items.length === 0) return null;
              return (
                <div key={role}>
                  <p className="mt-1 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {roleLabel[role]}
                  </p>
                  <ul>
                    {items.map((emp) => {
                      const active = emp.id === currentUser.id;
                      return (
                        <li key={emp.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentPersona(emp.id);
                              setOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50',
                              active && 'bg-brand-50/40',
                            )}
                          >
                            <Avatar firstName={emp.firstName} lastName={emp.lastName} color={emp.avatarColor} size="md" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                {emp.firstName}
                                {emp.lastName ? ` ${emp.lastName}` : ''}
                              </p>
                              <p className="text-xs text-slate-500">
                                {emp.designation} · {emp.department}
                              </p>
                            </div>
                            <Badge tone={emp.role === 'admin' ? 'brand' : emp.role === 'manager' ? 'violet' : 'neutral'}>
                              {roleLabel[emp.role]}
                            </Badge>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

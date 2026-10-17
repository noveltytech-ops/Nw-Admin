import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function Stat({
  label,
  value,
  hint,
  icon,
  tone,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'brand' | 'warning' | 'success';
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white p-5 shadow-card', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        {icon ? (
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md',
              tone === 'brand' && 'bg-brand-50 text-brand-700',
              tone === 'warning' && 'bg-amber-50 text-amber-700',
              tone === 'success' && 'bg-emerald-50 text-emerald-700',
              (!tone || tone === 'default') && 'bg-slate-100 text-slate-600',
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

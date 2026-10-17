'use client';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAppState } from '@/shell/AppStateContext';
import { cn } from '@/utils/cn';

export function ToastRack() {
  const { toasts, dismissToast } = useAppState();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg',
            t.tone === 'success' && 'border-emerald-200',
            t.tone === 'error' && 'border-red-200',
            t.tone === 'info' && 'border-slate-200',
          )}
        >
          <span
            className={cn(
              'mt-0.5',
              t.tone === 'success' && 'text-emerald-600',
              t.tone === 'error' && 'text-red-600',
              t.tone === 'info' && 'text-slate-500',
            )}
          >
            {t.tone === 'success' ? <CheckCircle2 className="h-4 w-4" /> : t.tone === 'error' ? <AlertCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          </span>
          <p className="flex-1 text-sm text-slate-700">{t.message}</p>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-slate-400 hover:text-slate-600"
            type="button"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

import { cn } from '@/utils/cn';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('border-b border-slate-200', className)}>
      <nav className="-mb-px flex gap-6 overflow-x-auto">
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={cn(
                'inline-flex items-center gap-2 whitespace-nowrap border-b-2 pb-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
              )}
            >
              {item.label}
              {typeof item.count === 'number' ? (
                <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500')}>
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

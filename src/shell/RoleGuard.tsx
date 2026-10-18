'use client';
import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useCurrentEmployee } from '@/stores/auth.context';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Role } from '@/types';

export function RoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const emp = useCurrentEmployee();
  if (!roles.includes(emp.role)) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Not available for your role"
        description="Ask an admin to grant you the role required to view this page."
      />
    );
  }
  return <>{children}</>;
}

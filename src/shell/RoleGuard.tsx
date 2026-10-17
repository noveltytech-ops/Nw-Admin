'use client';
import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAppState } from './AppStateContext';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Role } from '@/types';

export function RoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { currentUser } = useAppState();
  if (!roles.includes(currentUser.role)) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Not available for this persona"
        description="Switch to a manager or admin persona from the top-right to view this page."
      />
    );
  }
  return <>{children}</>;
}

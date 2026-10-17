'use client';
import { useAppState } from '@/shell/AppStateContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmployeeDashboard } from './EmployeeDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { AdminDashboard } from './AdminDashboard';
import { formatRelativeOrDate, todayISO } from '@/utils/date';

export function DashboardPage() {
  const { currentUser } = useAppState();
  return (
    <>
      <PageHeader
        title={`Hello, ${currentUser.firstName}`}
        description={`Today is ${formatRelativeOrDate(todayISO())} · ${currentUser.department}`}
      />
      {currentUser.role === 'admin' ? (
        <AdminDashboard />
      ) : currentUser.role === 'manager' ? (
        <ManagerDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </>
  );
}

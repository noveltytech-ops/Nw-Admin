'use client';
import { useApp } from '@/shell/useApp';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmployeeDashboard } from './EmployeeDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { AdminDashboard } from './AdminDashboard';
import { formatRelativeOrDate, todayISO } from '@/utils/date';

export function DashboardPage() {
  const { currentUser } = useApp();
  return (
    <>
      <PageHeader
        title={`Hello, ${currentUser.firstName}`}
        description={`Today is ${formatRelativeOrDate(todayISO())} · ${currentUser.department}`}
      />
      {currentUser.role === 'admin' ? (
        <AdminDashboard />
      ) : currentUser.role === 'manager' || currentUser.role === 'lead' ? (
        <ManagerDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </>
  );
}

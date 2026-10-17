import { AdminSettingsPage } from '@/features/admin-settings/AdminSettingsPage';
import { RoleGuard } from '@/shell/RoleGuard';

export default function Page() {
  return (
    <RoleGuard roles={['admin']}>
      <AdminSettingsPage />
    </RoleGuard>
  );
}

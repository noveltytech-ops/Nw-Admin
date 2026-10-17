import { ApprovalsPage } from '@/features/approvals/ApprovalsPage';
import { RoleGuard } from '@/shell/RoleGuard';

export default function Page() {
  return (
    <RoleGuard roles={['manager', 'admin']}>
      <ApprovalsPage />
    </RoleGuard>
  );
}

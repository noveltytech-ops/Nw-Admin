import { OnboardPage } from '@/features/onboarding/OnboardPage';
import { RoleGuard } from '@/shell/RoleGuard';

export default function Page() {
  return (
    <RoleGuard roles={['lead', 'manager', 'admin']}>
      <OnboardPage />
    </RoleGuard>
  );
}

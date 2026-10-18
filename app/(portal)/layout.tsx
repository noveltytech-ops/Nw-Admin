import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/shell/AppShell';
import { AppStoreHydrator } from '@/shell/AppStoreHydrator';
import { loadState } from '@/server/state';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const initialState = await loadState();
  const authEmail = (user.email ?? '').toLowerCase();
  const currentEmployee =
    initialState.employees.find((e) => e.email.toLowerCase() === authEmail) ?? null;

  if (!currentEmployee) {
    // Signed-in Supabase user with no matching employee row — bounce them.
    redirect('/login?error=no-employee-match');
  }

  return (
    <AppStoreHydrator
      initialState={initialState}
      authEmail={authEmail}
      currentEmployee={currentEmployee}
    >
      <AppShell>{children}</AppShell>
    </AppStoreHydrator>
  );
}

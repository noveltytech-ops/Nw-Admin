import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/shell/AppShell';
import { ClientProviders } from '@/shell/ClientProviders';
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

  const authEmail = (user.email ?? '').toLowerCase();
  const initialState = await loadState();
  const match = initialState.employees.find((e) => e.email.toLowerCase() === authEmail);

  if (!match) {
    redirect('/login?error=no-employee-match');
  }

  return (
    <ClientProviders initialState={initialState} authEmail={authEmail}>
      <AppShell>{children}</AppShell>
    </ClientProviders>
  );
}

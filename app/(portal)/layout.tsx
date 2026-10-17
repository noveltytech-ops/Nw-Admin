import { AppShell } from '@/shell/AppShell';
import { AppStateProvider } from '@/shell/AppStateContext';
import { loadState } from '@/server/state';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const initialState = await loadState();
  return (
    <AppStateProvider initialState={initialState}>
      <AppShell>{children}</AppShell>
    </AppStateProvider>
  );
}

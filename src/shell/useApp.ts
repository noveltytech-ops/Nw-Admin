'use client';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/app.store';
import { useCurrentEmployee } from '@/stores/auth.context';

/**
 * Compatibility hook that mirrors the shape feature pages pull from.
 *
 * `currentUser` is derived from the auth email (set once per request in
 * ClientProviders) + the latest employees from the per-request Zustand store.
 * This avoids SSR ordering bugs: Context values are set synchronously by the
 * provider's value prop, so children never see "unhydrated" state.
 */
export function useApp() {
  const state = useAppStore((s) => s.state);
  const busy = useAppStore((s) => s.busy);
  const pushToast = useAppStore((s) => s.pushToast);
  const api = useAppStore(
    useShallow((s) => ({
      submitLeave: s.submitLeave,
      approveLeave: s.approveLeave,
      rejectLeave: s.rejectLeave,
      withdrawLeave: s.withdrawLeave,
      cancelLeave: s.cancelLeave,
      submitWFH: s.submitWFH,
      approveWFH: s.approveWFH,
      rejectWFH: s.rejectWFH,
      withdrawWFH: s.withdrawWFH,
      addHoliday: s.addHoliday,
      updateHoliday: s.updateHoliday,
      removeHoliday: s.removeHoliday,
      createEmployee: s.createEmployee,
      updateEmployee: s.updateEmployee,
      deactivateEmployee: s.deactivateEmployee,
      setManager: s.setManager,
      updatePolicy: s.updatePolicy,
      updateLeavePolicy: s.updateLeavePolicy,
      updateLeaveType: s.updateLeaveType,
      applyLeaveTypeToAll: s.applyLeaveTypeToAll,
      resetState: s.resetState,
    })),
  );
  const currentUser = useCurrentEmployee();

  return { state, api, pushToast, busy, currentUser };
}

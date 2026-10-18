'use client';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Compatibility hook that mirrors the shape the feature pages used to pull
 * from the old React Context — now backed by Zustand under the hood.
 */
export function useApp() {
  const state = useAppStore((s) => s.state);
  const api = useAppStore((s) => ({
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
  }));
  const pushToast = useAppStore((s) => s.pushToast);
  const busy = useAppStore((s) => s.busy);
  const currentUser = useAuthStore((s) => s.currentEmployee);

  if (!currentUser) {
    throw new Error('useApp called before auth bootstrap');
  }

  return { state, api, pushToast, busy, currentUser };
}

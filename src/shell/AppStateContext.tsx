'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Employee } from '@/types';
import { DEMO_PERSONAS, personaStorage, type AppState } from '@/services/storage.service';
import { apiClient } from '@/services/api-client';

interface ToastMsg {
  id: number;
  tone: 'success' | 'error' | 'info';
  message: string;
}

export interface AppApi {
  submitLeave: typeof apiClient.submitLeave;
  approveLeave: typeof apiClient.approveLeave;
  rejectLeave: typeof apiClient.rejectLeave;
  withdrawLeave: typeof apiClient.withdrawLeave;
  cancelLeave: typeof apiClient.cancelLeave;
  submitWFH: typeof apiClient.submitWFH;
  approveWFH: typeof apiClient.approveWFH;
  rejectWFH: typeof apiClient.rejectWFH;
  withdrawWFH: typeof apiClient.withdrawWFH;
  addHoliday: typeof apiClient.addHoliday;
  updateHoliday: typeof apiClient.updateHoliday;
  removeHoliday: typeof apiClient.removeHoliday;
  createEmployee: typeof apiClient.createEmployee;
  updateEmployee: typeof apiClient.updateEmployee;
  deactivateEmployee: typeof apiClient.deactivateEmployee;
  setManager: typeof apiClient.setManager;
  updatePolicy: typeof apiClient.updatePolicy;
  updateLeavePolicy: typeof apiClient.updateLeavePolicy;
  updateLeaveType: typeof apiClient.updateLeaveType;
  applyLeaveTypeToAll: typeof apiClient.applyLeaveTypeToAll;
  resetState: typeof apiClient.resetState;
}

interface AppStateContextValue {
  state: AppState;
  currentPersonaId: string;
  setCurrentPersona: (id: string) => void;
  currentUser: Employee;
  api: AppApi;
  busy: boolean;
  refresh: () => Promise<void>;
  toasts: ToastMsg[];
  pushToast: (toast: Omit<ToastMsg, 'id'>) => void;
  dismissToast: (id: number) => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

function defaultPersonaId(state: AppState): string {
  const stored = personaStorage.load();
  if (stored && state.employees.some((e) => e.id === stored)) return stored;
  return DEMO_PERSONAS[0].id;
}

interface AppStateProviderProps {
  initialState: AppState;
  children: ReactNode;
}

export function AppStateProvider({ initialState, children }: AppStateProviderProps) {
  const [state, setState] = useState<AppState>(initialState);
  const [currentPersonaId, setCurrentPersonaIdRaw] = useState<string>(() => defaultPersonaId(initialState));
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastSeq = useRef(0);

  useEffect(() => {
    personaStorage.save(currentPersonaId);
  }, [currentPersonaId]);

  const setCurrentPersona = useCallback((id: string) => {
    setCurrentPersonaIdRaw(id);
  }, []);

  const refresh = useCallback(async () => {
    const next = await apiClient.getState();
    setState(next);
  }, []);

  const pushToast = useCallback((t: Omit<ToastMsg, 'id'>) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((p) => p.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const api = useMemo<AppApi>(() => {
    const wrap = <A extends unknown[]>(fn: (...a: A) => Promise<AppState>) =>
      (async (...args: A) => {
        setBusy(true);
        try {
          const next = await fn(...args);
          setState(next);
          return next;
        } catch (err) {
          console.error('[api] mutation failed', err);
          pushToast({ tone: 'error', message: err instanceof Error ? err.message : 'Request failed' });
          throw err;
        } finally {
          setBusy(false);
        }
      }) as typeof fn;

    return {
      submitLeave: wrap(apiClient.submitLeave),
      approveLeave: wrap(apiClient.approveLeave),
      rejectLeave: wrap(apiClient.rejectLeave),
      withdrawLeave: wrap(apiClient.withdrawLeave),
      cancelLeave: wrap(apiClient.cancelLeave),
      submitWFH: wrap(apiClient.submitWFH),
      approveWFH: wrap(apiClient.approveWFH),
      rejectWFH: wrap(apiClient.rejectWFH),
      withdrawWFH: wrap(apiClient.withdrawWFH),
      addHoliday: wrap(apiClient.addHoliday),
      updateHoliday: wrap(apiClient.updateHoliday),
      removeHoliday: wrap(apiClient.removeHoliday),
      createEmployee: wrap(apiClient.createEmployee),
      updateEmployee: wrap(apiClient.updateEmployee),
      deactivateEmployee: wrap(apiClient.deactivateEmployee),
      setManager: wrap(apiClient.setManager),
      updatePolicy: wrap(apiClient.updatePolicy),
      updateLeavePolicy: wrap(apiClient.updateLeavePolicy),
      updateLeaveType: wrap(apiClient.updateLeaveType),
      applyLeaveTypeToAll: wrap(apiClient.applyLeaveTypeToAll),
      resetState: wrap(apiClient.resetState),
    };
  }, [pushToast]);

  const currentUser = useMemo<Employee>(() => {
    const found = state.employees.find((e) => e.id === currentPersonaId);
    return found ?? state.employees[0];
  }, [state.employees, currentPersonaId]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      currentPersonaId,
      setCurrentPersona,
      currentUser,
      api,
      busy,
      refresh,
      toasts,
      pushToast,
      dismissToast,
    }),
    [state, currentPersonaId, setCurrentPersona, currentUser, api, busy, refresh, toasts, pushToast, dismissToast],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}

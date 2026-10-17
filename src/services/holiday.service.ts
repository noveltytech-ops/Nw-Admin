import type { Holiday } from '@/types';
import { genId } from '@/utils/ids';
import type { AppState } from './storage.service';

export const holidayService = {
  add(state: AppState, actorId: string, input: Omit<Holiday, 'id'>): AppState {
    const h: Holiday = { id: genId('hol'), ...input };
    return {
      ...state,
      holidays: [...state.holidays, h].sort((a, b) => a.date.localeCompare(b.date)),
      audit: [
        {
          id: genId('aud'),
          entityId: h.id,
          action: 'holiday.added',
          actorId,
          at: new Date().toISOString(),
        },
        ...state.audit,
      ],
    };
  },
  update(state: AppState, actorId: string, id: string, patch: Partial<Omit<Holiday, 'id'>>): AppState {
    return {
      ...state,
      holidays: state.holidays
        .map((h) => (h.id === id ? { ...h, ...patch } : h))
        .sort((a, b) => a.date.localeCompare(b.date)),
      audit: [
        {
          id: genId('aud'),
          entityId: id,
          action: 'holiday.updated',
          actorId,
          at: new Date().toISOString(),
        },
        ...state.audit,
      ],
    };
  },
  remove(state: AppState, actorId: string, id: string): AppState {
    return {
      ...state,
      holidays: state.holidays.filter((h) => h.id !== id),
      audit: [
        {
          id: genId('aud'),
          entityId: id,
          action: 'holiday.deleted',
          actorId,
          at: new Date().toISOString(),
        },
        ...state.audit,
      ],
    };
  },
};

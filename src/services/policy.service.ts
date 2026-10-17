import type { WorkPolicy } from '@/types';
import { genId } from '@/utils/ids';
import type { AppState } from './storage.service';

export const policyService = {
  update(state: AppState, actorId: string, patch: Partial<WorkPolicy>): AppState {
    const next: WorkPolicy = {
      ...state.policy,
      ...patch,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId,
    };
    return {
      ...state,
      policy: next,
      audit: [
        {
          id: genId('aud'),
          entityId: 'policy',
          action: 'policy.updated',
          actorId,
          at: new Date().toISOString(),
        },
        ...state.audit,
      ],
    };
  },
};

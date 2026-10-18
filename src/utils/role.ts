import type { Role } from '@/types';

export const ROLE_LABEL: Record<Role, string> = {
  employee: 'Employee',
  lead: 'Team Lead',
  manager: 'Manager',
  admin: 'Admin',
};

export const ROLE_BADGE_TONE: Record<Role, 'neutral' | 'brand' | 'violet' | 'sky'> = {
  employee: 'neutral',
  lead: 'sky',
  manager: 'violet',
  admin: 'brand',
};

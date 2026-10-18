import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  CalendarDays,
  FilePlus2,
  Gauge,
  Home,
  Inbox,
  PartyPopper,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/calendar', label: 'Leave Calendar', icon: Calendar },
  { path: '/apply', label: 'Apply for Leave', icon: FilePlus2 },
  { path: '/my-requests', label: 'My Requests', icon: Inbox },
  { path: '/approvals', label: 'Approval Inbox', icon: Gauge, roles: ['manager', 'admin'] },
  { path: '/wfh', label: 'Work From Home', icon: CalendarDays },
  { path: '/organization', label: 'Organization', icon: Users },
  { path: '/onboard', label: 'Add Employee', icon: UserPlus, roles: ['manager', 'admin'] },
  { path: '/holidays', label: 'Company Holidays', icon: PartyPopper },
  { path: '/admin', label: 'Admin Settings', icon: Settings, roles: ['admin'] },
];

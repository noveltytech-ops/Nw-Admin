import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export const ISO = 'yyyy-MM-dd';

export function toISO(d: Date): string {
  return format(d, ISO);
}

export function parseISODate(iso: string): Date {
  const d = parseISO(iso);
  return isValid(d) ? d : new Date(NaN);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function yearStartISO(year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `${y}-01-01`;
}

/**
 * How many quarters of a year have "elapsed enough to accrue" by `date`.
 * Policy semantics: 5 paid leaves are credited at the start of each quarter.
 * Jan 1 → 1 quarter credited, Apr 1 → 2 credited, Jul 1 → 3, Oct 1 → 4.
 */
export function quartersAccruedBy(date: Date): 1 | 2 | 3 | 4 {
  const m = date.getMonth(); // 0..11
  if (m < 3) return 1;
  if (m < 6) return 2;
  if (m < 9) return 3;
  return 4;
}

export function addDaysISO(iso: string, delta: number): string {
  return toISO(addDays(parseISODate(iso), delta));
}

export function formatHuman(iso: string): string {
  const d = parseISODate(iso);
  if (!isValid(d)) return iso;
  return format(d, 'dd MMM yyyy');
}

export function formatHumanShort(iso: string): string {
  const d = parseISODate(iso);
  if (!isValid(d)) return iso;
  return format(d, 'dd MMM');
}

export function formatRelativeOrDate(iso: string): string {
  const d = parseISODate(iso);
  if (!isValid(d)) return iso;
  const today = todayDate();
  const diff = differenceInCalendarDays(d, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return format(d, 'EEEE');
  return format(d, 'dd MMM yyyy');
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function monthLabel(d: Date): string {
  return format(d, 'MMMM yyyy');
}

export function datesForMonthGrid(d: Date): Date[] {
  const start = startOfWeek(startOfMonth(d), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(d), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function datesForWeek(d: Date): Date[] {
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const end = endOfWeek(d, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function datesBetween(startISO: string, endISO: string): Date[] {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (!isValid(start) || !isValid(end) || end < start) return [];
  return eachDayOfInterval({ start, end });
}

export function sameDayISO(a: string, b: string): boolean {
  return isSameDay(parseISODate(a), parseISODate(b));
}

export { format, parseISO, isValid, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, differenceInCalendarDays };

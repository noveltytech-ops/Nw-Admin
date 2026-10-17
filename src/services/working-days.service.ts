import type { Holiday, WorkPolicy } from '@/types';
import { datesBetween, toISO } from '@/utils/date';

export interface WorkingDayContext {
  holidays: Holiday[];
  policy: WorkPolicy;
  countWFHAsOff?: boolean;
}

export function isHoliday(dateISO: string, holidays: Holiday[]): Holiday | undefined {
  return holidays.find((h) => h.date === dateISO);
}

export function isWeekOff(date: Date, policy: WorkPolicy): boolean {
  const dow = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  return policy.workMode[dow] === 'off';
}

/**
 * Compute working days between inclusive start/end dates, respecting:
 *  - half-day flag (only valid for a single-date request)
 *  - company holidays
 *  - policy days marked 'off' (weekends by default)
 */
export function computeWorkingDays(
  startISO: string,
  endISO: string,
  halfDay: 'first' | 'second' | null,
  ctx: WorkingDayContext,
): number {
  const dates = datesBetween(startISO, endISO);
  if (dates.length === 0) return 0;

  let count = 0;
  for (const d of dates) {
    const iso = toISO(d);
    if (isWeekOff(d, ctx.policy)) continue;
    if (isHoliday(iso, ctx.holidays)) continue;
    count += 1;
  }

  if (halfDay && dates.length === 1 && count === 1) {
    return 0.5;
  }
  return count;
}

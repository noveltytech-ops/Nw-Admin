'use client';
import { useMemo, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, FilterX, PartyPopper } from 'lucide-react';
import { useAppState } from '@/shell/AppStateContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog } from '@/components/ui/Dialog';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { employeeService } from '@/services/employee.service';
import { leaveTypeById, datesForLeaveRequest } from '@/services/leave.service';
import {
  addDays,
  datesForMonthGrid,
  datesForWeek,
  formatHuman,
  monthLabel,
  parseISODate,
  toISO,
  todayDate,
  todayISO,
} from '@/utils/date';
import { cn } from '@/utils/cn';
import type { Employee, Holiday, LeaveRequest, LeaveTypeConfig } from '@/types';

type View = 'month' | 'week' | 'agenda';

interface EventItem {
  key: string;
  type: 'leave' | 'holiday';
  dateISO: string;
  employee?: Employee;
  leave?: LeaveRequest;
  holiday?: Holiday;
}

export function LeaveCalendarPage() {
  const { state } = useAppState();
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState<Date>(todayDate());
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all');
  const [showHolidays, setShowHolidays] = useState(true);
  const [selected, setSelected] = useState<EventItem | null>(null);

  const departments = useMemo(() => Array.from(new Set(state.employees.map((e) => e.department))).sort(), [state.employees]);

  const events = useMemo<EventItem[]>(() => {
    const items: EventItem[] = [];
    const employeeMatches = (empId: string) => {
      const emp = state.employees.find((e) => e.id === empId);
      if (!emp) return false;
      if (employeeFilter !== 'all' && emp.id !== employeeFilter) return false;
      if (departmentFilter !== 'all' && emp.department !== departmentFilter) return false;
      return true;
    };
    for (const r of state.leaveRequests) {
      if (r.status !== 'approved') continue;
      if (leaveTypeFilter !== 'all' && r.leaveTypeId !== leaveTypeFilter) continue;
      if (!employeeMatches(r.employeeId)) continue;
      const emp = state.employees.find((e) => e.id === r.employeeId);
      for (const d of datesForLeaveRequest(r)) {
        items.push({ key: `${r.id}-${d}`, type: 'leave', dateISO: d, employee: emp, leave: r });
      }
    }
    if (showHolidays) {
      for (const h of state.holidays) {
        items.push({ key: h.id, type: 'holiday', dateISO: h.date, holiday: h });
      }
    }
    return items;
  }, [state.employees, state.holidays, state.leaveRequests, employeeFilter, departmentFilter, leaveTypeFilter, showHolidays]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of events) {
      const arr = map.get(e.dateISO) ?? [];
      arr.push(e);
      map.set(e.dateISO, arr);
    }
    return map;
  }, [events]);

  const monthDays = datesForMonthGrid(cursor);
  const weekDays = datesForWeek(cursor);

  const stepPrev = () => {
    setCursor((c) => {
      if (view === 'month') return addDays(c, -28);
      if (view === 'week') return addDays(c, -7);
      return addDays(c, -14);
    });
  };
  const stepNext = () => {
    setCursor((c) => {
      if (view === 'month') return addDays(c, 28);
      if (view === 'week') return addDays(c, 7);
      return addDays(c, 14);
    });
  };

  const label =
    view === 'month'
      ? monthLabel(cursor)
      : view === 'week'
        ? `Week of ${formatHuman(toISO(weekDays[0]))}`
        : `Agenda from ${formatHuman(toISO(cursor))}`;

  const activeFilters =
    (employeeFilter !== 'all' ? 1 : 0) +
    (departmentFilter !== 'all' ? 1 : 0) +
    (leaveTypeFilter !== 'all' ? 1 : 0) +
    (!showHolidays ? 1 : 0);

  const resetFilters = () => {
    setEmployeeFilter('all');
    setDepartmentFilter('all');
    setLeaveTypeFilter('all');
    setShowHolidays(true);
  };

  return (
    <>
      <PageHeader
        title="Leave Calendar"
        description="Company-wide leave, holidays and team availability"
        breadcrumbs={['People', 'Leave Calendar']}
      />

      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={stepPrev} aria-label="Previous period">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(todayDate())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={stepNext} aria-label="Next period">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="ml-3 text-sm font-medium text-slate-800">{label}</span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="min-w-[160px]">
              <option value="all">All employees</option>
              {employeeService.active(state).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </Select>
            <Select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="min-w-[140px]">
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Select value={leaveTypeFilter} onChange={(e) => setLeaveTypeFilter(e.target.value)} className="min-w-[140px]">
              <option value="all">All leave types</option>
              {state.leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={showHolidays} onChange={(e) => setShowHolidays(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              Holidays
            </label>
            {activeFilters > 0 ? (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                <FilterX className="h-3.5 w-3.5" /> Reset
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Tabs<View>
        items={[
          { value: 'month', label: 'Month' },
          { value: 'week', label: 'Week' },
          { value: 'agenda', label: 'Agenda' },
        ]}
        value={view}
        onChange={setView}
        className="mb-4"
      />

      {view === 'month' ? (
        <MonthGrid cursor={cursor} days={monthDays} eventsByDay={eventsByDay} onSelect={setSelected} types={state.leaveTypes} />
      ) : view === 'week' ? (
        <WeekView days={weekDays} eventsByDay={eventsByDay} onSelect={setSelected} types={state.leaveTypes} />
      ) : (
        <AgendaView events={events} cursorISO={toISO(cursor)} onSelect={setSelected} types={state.leaveTypes} />
      )}

      <Legend types={state.leaveTypes} />

      <Dialog open={!!selected} onClose={() => setSelected(null)} title={selected?.type === 'leave' ? 'Leave details' : 'Holiday'} size="md">
        {selected?.type === 'leave' && selected.leave && selected.employee ? (
          <LeaveDetails leave={selected.leave} employee={selected.employee} typeName={leaveTypeById(state.leaveTypes, selected.leave.leaveTypeId)?.name ?? ''} />
        ) : selected?.type === 'holiday' && selected.holiday ? (
          <HolidayDetails holiday={selected.holiday} />
        ) : null}
      </Dialog>
    </>
  );
}

function MonthGrid({
  cursor,
  days,
  eventsByDay,
  onSelect,
  types,
}: {
  cursor: Date;
  days: Date[];
  eventsByDay: Map<string, EventItem[]>;
  onSelect: (e: EventItem) => void;
  types: LeaveTypeConfig[];
}) {
  const currentMonth = cursor.getMonth();
  return (
    <Card>
      <div className="grid grid-cols-7 border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="px-2 py-2 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const iso = toISO(d);
          const dayEvents = eventsByDay.get(iso) ?? [];
          const inMonth = d.getMonth() === currentMonth;
          const isToday = iso === todayISO();
          const grouped = groupEventsForDay(dayEvents);
          return (
            <div
              key={iso}
              className={cn(
                'min-h-[108px] border-b border-r border-slate-100 p-2',
                !inMonth && 'bg-slate-50/50',
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs',
                    isToday ? 'bg-brand-600 font-semibold text-white' : 'font-medium text-slate-700',
                    !inMonth && 'text-slate-400',
                  )}
                >
                  {d.getDate()}
                </span>
                {grouped.holiday ? <span className="h-2 w-2 rounded-full bg-violet-500" /> : null}
              </div>
              <div className="space-y-1">
                {grouped.holiday ? (
                  <button
                    type="button"
                    onClick={() => onSelect(grouped.holiday!)}
                    className="w-full truncate rounded bg-violet-50 px-1.5 py-1 text-left text-[11px] font-medium text-violet-700 hover:bg-violet-100"
                  >
                    {grouped.holiday.holiday?.name}
                  </button>
                ) : null}
                {grouped.leaves.slice(0, 3).map((ev) => (
                  <button
                    key={ev.key}
                    type="button"
                    onClick={() => onSelect(ev)}
                    className="w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium text-white hover:opacity-90"
                    style={{ backgroundColor: eventColor(ev, types) }}
                  >
                    {ev.employee?.firstName} · {ev.leave ? leaveCode(ev.leave.leaveTypeId, types) : ''}
                  </button>
                ))}
                {grouped.leaves.length > 3 ? (
                  <p className="truncate px-1 text-[11px] text-slate-500">+{grouped.leaves.length - 3} more</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function WeekView({
  days,
  eventsByDay,
  onSelect,
  types,
}: {
  days: Date[];
  eventsByDay: Map<string, EventItem[]>;
  onSelect: (e: EventItem) => void;
  types: LeaveTypeConfig[];
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-7">
      {days.map((d) => {
        const iso = toISO(d);
        const grouped = groupEventsForDay(eventsByDay.get(iso) ?? []);
        const isToday = iso === todayISO();
        return (
          <Card key={iso} className={cn(isToday && 'ring-2 ring-brand-500 ring-offset-1')}>
            <CardBody>
              <p className="text-xs text-slate-500">{d.toLocaleDateString(undefined, { weekday: 'long' })}</p>
              <p className="text-lg font-semibold text-slate-900">{formatHuman(iso)}</p>
              {grouped.holiday ? (
                <button
                  type="button"
                  onClick={() => onSelect(grouped.holiday!)}
                  className="mt-2 block w-full rounded bg-violet-50 px-2 py-1.5 text-left text-xs font-medium text-violet-700 hover:bg-violet-100"
                >
                  {grouped.holiday.holiday?.name}
                </button>
              ) : null}
              <div className="mt-2 space-y-1">
                {grouped.leaves.length === 0 && !grouped.holiday ? (
                  <p className="text-xs text-slate-400">No events</p>
                ) : null}
                {grouped.leaves.map((ev) => (
                  <button
                    key={ev.key}
                    type="button"
                    onClick={() => onSelect(ev)}
                    className="w-full rounded px-2 py-1.5 text-left text-xs text-white"
                    style={{ backgroundColor: eventColor(ev, types) }}
                  >
                    {ev.employee?.firstName} {ev.employee?.lastName} · {ev.leave ? leaveCode(ev.leave.leaveTypeId, types) : ''}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function AgendaView({
  events,
  cursorISO,
  onSelect,
  types,
}: {
  events: EventItem[];
  cursorISO: string;
  onSelect: (e: EventItem) => void;
  types: LeaveTypeConfig[];
}) {
  const future = events
    .filter((e) => e.dateISO >= cursorISO)
    .sort((a, b) => (a.dateISO === b.dateISO ? (a.type === 'holiday' ? -1 : 1) : a.dateISO.localeCompare(b.dateISO)));

  if (future.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange className="h-5 w-5" />}
        title="Nothing scheduled"
        description="No events match the active filters. Try widening the date range or clearing filters."
      />
    );
  }
  const byDay = new Map<string, EventItem[]>();
  for (const ev of future) {
    const arr = byDay.get(ev.dateISO) ?? [];
    arr.push(ev);
    byDay.set(ev.dateISO, arr);
  }
  return (
    <div className="space-y-3">
      {Array.from(byDay.entries()).slice(0, 30).map(([date, items]) => {
        const grouped = groupEventsForDay(items);
        return (
          <Card key={date}>
            <CardBody>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{formatHuman(date)}</h3>
                <p className="text-xs text-slate-500">{parseISODate(date).toLocaleDateString(undefined, { weekday: 'long' })}</p>
              </div>
              <div className="space-y-1.5">
                {grouped.holiday ? (
                  <button
                    type="button"
                    onClick={() => onSelect(grouped.holiday!)}
                    className="flex w-full items-center justify-between rounded bg-violet-50 px-3 py-1.5 text-left text-sm text-violet-700 hover:bg-violet-100"
                  >
                    <span className="inline-flex items-center gap-2">
                      <PartyPopper className="h-3.5 w-3.5" />
                      {grouped.holiday.holiday?.name}
                    </span>
                    <Badge tone="violet">Holiday</Badge>
                  </button>
                ) : null}
                {grouped.leaves.map((ev) => (
                  <button
                    key={ev.key}
                    type="button"
                    onClick={() => onSelect(ev)}
                    className="flex w-full items-center justify-between rounded border border-slate-200 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: eventColor(ev, types) }} />
                      {ev.employee?.firstName} {ev.employee?.lastName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {ev.leave ? leaveCode(ev.leave.leaveTypeId, types) : ''}{' '}
                      {ev.leave?.halfDay ? '· Half-day' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function Legend({ types }: { types: LeaveTypeConfig[] }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
      {types.map((t) => (
        <span key={t.id} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} /> {t.name}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Company holiday
      </span>
      <span className="ml-auto">Only approved leave appears here.</span>
    </div>
  );
}

function LeaveDetails({ leave, employee, typeName }: { leave: LeaveRequest; employee: Employee; typeName: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900">
            {employee.firstName} {employee.lastName}
          </p>
          <p className="text-xs text-slate-500">
            {employee.designation} · {employee.department}
          </p>
        </div>
        <Badge tone={statusTone(leave.status)}>{leave.status}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-slate-500">Leave type</dt>
        <dd className="text-slate-800">{typeName}</dd>
        <dt className="text-slate-500">From</dt>
        <dd className="text-slate-800">{formatHuman(leave.startDate)}</dd>
        <dt className="text-slate-500">To</dt>
        <dd className="text-slate-800">{formatHuman(leave.endDate)}</dd>
        <dt className="text-slate-500">Working days</dt>
        <dd className="text-slate-800">{leave.workingDays}</dd>
        {leave.halfDay ? (
          <>
            <dt className="text-slate-500">Half day</dt>
            <dd className="text-slate-800">{leave.halfDay === 'first' ? 'First half' : 'Second half'}</dd>
          </>
        ) : null}
      </dl>
      {leave.reason ? <p className="rounded bg-slate-50 p-3 text-sm text-slate-700">{leave.reason}</p> : null}
    </div>
  );
}

function HolidayDetails({ holiday }: { holiday: Holiday }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-lg font-semibold text-slate-900">{holiday.name}</p>
      <p className="text-slate-500">{formatHuman(holiday.date)}</p>
      {holiday.description ? <p className="rounded bg-slate-50 p-3 text-slate-700">{holiday.description}</p> : null}
    </div>
  );
}

function eventColor(ev: EventItem, types: ReturnType<typeof useAppState>['state']['leaveTypes']): string {
  if (ev.type === 'holiday') return '#8b5cf6';
  if (!ev.leave) return '#64748b';
  const t = types.find((x) => x.id === ev.leave!.leaveTypeId);
  return t?.color ?? '#64748b';
}

function leaveCode(id: string, types: ReturnType<typeof useAppState>['state']['leaveTypes']): string {
  return types.find((t) => t.id === id)?.code ?? '—';
}

function groupEventsForDay(items: EventItem[]) {
  const holiday = items.find((i) => i.type === 'holiday');
  const seen = new Set<string>();
  const leaves: EventItem[] = [];
  for (const i of items) {
    if (i.type !== 'leave' || !i.leave || !i.employee) continue;
    const key = `${i.leave.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    leaves.push(i);
  }
  return { holiday, leaves };
}

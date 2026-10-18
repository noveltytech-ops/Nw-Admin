'use client';
import Link from 'next/link';
import { CalendarCheck, CalendarPlus, Clock, Home, PartyPopper, Users } from 'lucide-react';
import { useApp } from '@/shell/useApp';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusTone } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { leaveService, leaveTypeById } from '@/services/leave.service';
import { employeeService } from '@/services/employee.service';
import { resolveDailyWorkMode } from '@/services/wfh.service';
import { addDaysISO, datesForWeek, formatHuman, formatHumanShort, toISO, todayDate, todayISO } from '@/utils/date';

export function EmployeeDashboard() {
  const { state, currentUser } = useApp();

  const myLeave = state.leaveRequests.filter((r) => r.employeeId === currentUser.id);
  const pending = myLeave.filter((r) => r.status === 'pending');
  const upcomingApproved = myLeave
    .filter((r) => r.status === 'approved' && r.endDate >= todayISO())
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const week = datesForWeek(todayDate());
  const upcomingHolidays = state.holidays
    .filter((h) => h.date >= todayISO() && h.date <= addDaysISO(todayISO(), 60))
    .sort((a, b) => a.date.localeCompare(b.date));

  const team = employeeService.team(state, currentUser.id);
  const todayWorkMode = team
    .map((emp) => ({ emp, mode: resolveDailyWorkMode(state, emp.id, todayISO()) }))
    .filter((entry) => entry.mode !== 'off');

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Leave balance</CardTitle>
              <CardDescription>Available days remaining this year</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link href="/apply">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <CalendarPlus className="h-4 w-4" />
                  Apply for Leave
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {state.leaveTypes.map((t) => {
                const b = currentUser.balances.find((x) => x.leaveTypeId === t.id);
                if (!b) return null;
                const info = leaveService.getAccruedBalance(t, currentUser);
                const subtitle =
                  t.accrual === 'quarterly'
                    ? `accrued ${info.accrued} / ${info.allocated}`
                    : `of ${info.allocated}`;
                return (
                  <div key={b.leaveTypeId} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t.code}
                      </span>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{info.remaining}</p>
                    <p className="text-xs text-slate-500">
                      {subtitle} · {t.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            <Link href="/apply" className="flex items-center gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50">
              <CalendarPlus className="h-4 w-4 text-brand-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Apply for leave</p>
                <p className="text-xs text-slate-500">Casual, Sick or Earned</p>
              </div>
            </Link>
            <Link href="/wfh" className="flex items-center gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50">
              <Home className="h-4 w-4 text-brand-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Request WFH</p>
                <p className="text-xs text-slate-500">Exception for an office day</p>
              </div>
            </Link>
            <Link href="/calendar" className="flex items-center gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50">
              <CalendarCheck className="h-4 w-4 text-brand-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Open calendar</p>
                <p className="text-xs text-slate-500">View team availability</p>
              </div>
            </Link>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upcoming approved leave</CardTitle>
              <CardDescription>Confirmed on your calendar</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            {upcomingApproved.length === 0 ? (
              <EmptyState icon={<CalendarCheck className="h-5 w-5" />} title="No approved leave" description="Nothing scheduled right now." />
            ) : (
              <ul className="space-y-3">
                {upcomingApproved.slice(0, 4).map((r) => {
                  const t = leaveTypeById(state.leaveTypes, r.leaveTypeId);
                  return (
                    <li key={r.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{t?.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatHuman(r.startDate)} → {formatHuman(r.endDate)} · {r.workingDays} day{r.workingDays === 1 ? '' : 's'}
                        </p>
                      </div>
                      <Badge tone={statusTone(r.status)}>Approved</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Pending requests</CardTitle>
              <CardDescription>Awaiting manager decision</CardDescription>
            </div>
            <Link href="/my-requests" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardBody>
            {pending.length === 0 ? (
              <EmptyState icon={<Clock className="h-5 w-5" />} title="Nothing pending" description="You have no requests awaiting a decision." />
            ) : (
              <ul className="space-y-3">
                {pending.map((r) => {
                  const t = leaveTypeById(state.leaveTypes, r.leaveTypeId);
                  return (
                    <li key={r.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{t?.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatHuman(r.startDate)} → {formatHuman(r.endDate)}
                        </p>
                      </div>
                      <Badge tone="warning">Pending</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upcoming holidays</CardTitle>
              <CardDescription>Next 60 days</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            {upcomingHolidays.length === 0 ? (
              <EmptyState icon={<PartyPopper className="h-5 w-5" />} title="No holidays coming up" />
            ) : (
              <ul className="space-y-3">
                {upcomingHolidays.slice(0, 5).map((h) => (
                  <li key={h.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{h.name}</p>
                      <p className="text-xs text-slate-500">{formatHuman(h.date)}</p>
                    </div>
                    <Badge tone="violet">Holiday</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Your week</CardTitle>
              <CardDescription>Default schedule plus approved exceptions</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-7 gap-1 text-center">
              {week.map((d) => {
                const iso = toISO(d);
                const mode = resolveDailyWorkMode(state, currentUser.id, iso);
                const isToday = iso === todayISO();
                const label =
                  mode === 'holiday'
                    ? 'Holiday'
                    : mode === 'off'
                      ? 'Off'
                      : mode === 'leave'
                        ? 'Leave'
                        : mode === 'wfh' || mode === 'wfh-exception'
                          ? 'WFH'
                          : 'Office';
                const toneClass =
                  mode === 'holiday'
                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                    : mode === 'off'
                      ? 'bg-slate-50 text-slate-500 border-slate-200'
                      : mode === 'leave'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : mode === 'wfh' || mode === 'wfh-exception'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                return (
                  <div
                    key={iso}
                    className={`rounded-md border px-1 py-2 text-xs ${toneClass} ${isToday ? 'ring-2 ring-brand-500 ring-offset-1' : ''}`}
                  >
                    <p className="font-medium">{d.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                    <p className="mt-0.5 text-[11px] opacity-70">{formatHumanShort(iso)}</p>
                    <p className="mt-1 font-semibold">{label}</p>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Team availability today</CardTitle>
              <CardDescription>Who is where in your team</CardDescription>
            </div>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardBody>
            {todayWorkMode.length === 0 ? (
              <EmptyState title="No teammates" description="You don't have teammates in your reporting group yet." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {todayWorkMode.map(({ emp, mode }) => (
                  <li key={emp.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={emp.firstName} lastName={emp.lastName} color={emp.avatarColor} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{emp.designation}</p>
                      </div>
                    </div>
                    {mode === 'leave' ? (
                      <Badge tone="warning">On leave</Badge>
                    ) : mode === 'holiday' ? (
                      <Badge tone="violet">Holiday</Badge>
                    ) : mode === 'wfh' || mode === 'wfh-exception' ? (
                      <Badge tone="sky">WFH</Badge>
                    ) : (
                      <Badge tone="success">Office</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { CalendarRange, Home, PartyPopper, ShieldCheck, Users } from 'lucide-react';
import { useAppState } from '@/shell/AppStateContext';
import { Stat } from '@/components/ui/Stat';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { resolveDailyWorkMode } from '@/services/wfh.service';
import { addDaysISO, datesForWeek, formatHuman, formatHumanShort, toISO, todayDate, todayISO } from '@/utils/date';

const DOW_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AdminDashboard() {
  const { state } = useAppState();
  const activeEmployees = state.employees.filter((e) => e.active);

  const onLeaveToday = activeEmployees.filter((e) => resolveDailyWorkMode(state, e.id, todayISO()) === 'leave').length;
  const wfhToday = activeEmployees.filter((e) => {
    const m = resolveDailyWorkMode(state, e.id, todayISO());
    return m === 'wfh' || m === 'wfh-exception';
  }).length;

  const pendingLeave = state.leaveRequests.filter((r) => r.status === 'pending').length;
  const pendingWFH = state.wfhRequests.filter((r) => r.status === 'pending').length;

  const upcoming = state.holidays
    .filter((h) => h.date >= todayISO() && h.date <= addDaysISO(todayISO(), 90))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const week = datesForWeek(todayDate());
  const weekAgg = week.map((d) => {
    const iso = toISO(d);
    let office = 0;
    let wfh = 0;
    let leave = 0;
    let holiday = 0;
    for (const emp of activeEmployees) {
      const mode = resolveDailyWorkMode(state, emp.id, iso);
      if (mode === 'office') office += 1;
      else if (mode === 'wfh' || mode === 'wfh-exception') wfh += 1;
      else if (mode === 'leave') leave += 1;
      else if (mode === 'holiday') holiday += 1;
    }
    return { iso, d, office, wfh, leave, holiday };
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active employees" value={activeEmployees.length} icon={<Users className="h-4 w-4" />} />
        <Stat label="On leave today" value={onLeaveToday} icon={<CalendarRange className="h-4 w-4" />} tone="warning" />
        <Stat label="WFH today" value={wfhToday} icon={<Home className="h-4 w-4" />} tone="brand" />
        <Stat label="Pending approvals" value={pendingLeave + pendingWFH} hint={`${pendingLeave} leave · ${pendingWFH} WFH`} icon={<ShieldCheck className="h-4 w-4" />} tone="success" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Weekly office/WFH overview</CardTitle>
              <CardDescription>Expected count of employees per work mode</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-7 gap-2">
              {weekAgg.map(({ iso, d, office, wfh, leave, holiday }) => {
                const isToday = iso === todayISO();
                const total = Math.max(1, office + wfh + leave + holiday);
                const pct = (n: number) => `${(n / total) * 100}%`;
                return (
                  <div
                    key={iso}
                    className={`rounded-md border p-2 text-center text-xs ${isToday ? 'border-brand-500 ring-1 ring-brand-200' : 'border-slate-200'}`}
                  >
                    <p className="font-semibold text-slate-700">{DOW_LABEL[d.getDay()]}</p>
                    <p className="text-[11px] text-slate-500">{formatHumanShort(iso)}</p>
                    <div className="mt-2 flex h-16 w-full overflow-hidden rounded bg-slate-100">
                      <div className="bg-emerald-400" style={{ width: pct(office) }} title={`Office ${office}`} />
                      <div className="bg-sky-400" style={{ width: pct(wfh) }} title={`WFH ${wfh}`} />
                      <div className="bg-amber-400" style={{ width: pct(leave) }} title={`Leave ${leave}`} />
                      <div className="bg-violet-400" style={{ width: pct(holiday) }} title={`Holiday ${holiday}`} />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {office}/{wfh}/{leave}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Office</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" /> WFH</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Leave</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-400" /> Holiday</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upcoming holidays</CardTitle>
              <CardDescription>Next 90 days</CardDescription>
            </div>
            <Link href="/holidays">
              <Button size="sm" variant="outline">
                Manage
              </Button>
            </Link>
          </CardHeader>
          <CardBody>
            {upcoming.length === 0 ? (
              <EmptyState icon={<PartyPopper className="h-5 w-5" />} title="No upcoming holidays" />
            ) : (
              <ul className="space-y-2.5">
                {upcoming.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3">
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

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Admin shortcuts</CardTitle>
              <CardDescription>Jump into common admin tasks</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="grid gap-2 sm:grid-cols-2">
            <Link href="/admin" className="rounded-md border border-slate-200 p-3 hover:bg-slate-50">
              <p className="text-sm font-medium text-slate-900">Hybrid policy</p>
              <p className="text-xs text-slate-500">Change weekly WFH/office days</p>
            </Link>
            <Link href="/organization" className="rounded-md border border-slate-200 p-3 hover:bg-slate-50">
              <p className="text-sm font-medium text-slate-900">Manager assignments</p>
              <p className="text-xs text-slate-500">Update reporting relationships</p>
            </Link>
            <Link href="/holidays" className="rounded-md border border-slate-200 p-3 hover:bg-slate-50">
              <p className="text-sm font-medium text-slate-900">Company holidays</p>
              <p className="text-xs text-slate-500">Add or remove holiday entries</p>
            </Link>
            <Link href="/admin" className="rounded-md border border-slate-200 p-3 hover:bg-slate-50">
              <p className="text-sm font-medium text-slate-900">Leave types & quotas</p>
              <p className="text-xs text-slate-500">Edit demo balances</p>
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest audit events</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            {state.audit.length === 0 ? (
              <EmptyState title="No activity yet" description="Submit or approve a request to see history here." />
            ) : (
              <ul className="space-y-2 text-sm">
                {state.audit.slice(0, 6).map((a) => {
                  const actor = state.employees.find((e) => e.id === a.actorId);
                  return (
                    <li key={a.id} className="flex items-start justify-between gap-3 text-slate-700">
                      <div>
                        <p>
                          <span className="font-medium">{actor ? `${actor.firstName} ${actor.lastName}` : a.actorId}</span>{' '}
                          <span className="text-slate-500">{a.action.replace('.', ' ')}</span>
                        </p>
                        {a.note ? <p className="text-xs text-slate-500">"{a.note}"</p> : null}
                      </div>
                      <span className="whitespace-nowrap text-xs text-slate-400">{new Date(a.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

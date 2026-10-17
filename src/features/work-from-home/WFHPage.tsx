'use client';
import { useMemo, useState } from 'react';
import { CalendarDays, Home, Trash2, Users } from 'lucide-react';
import { useAppState } from '@/shell/AppStateContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { FieldError, FieldHint, Input, Label, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { wfhService, resolveDailyWorkMode } from '@/services/wfh.service';
import { employeeService } from '@/services/employee.service';
import { addDaysISO, datesForWeek, formatHuman, formatHumanShort, toISO, todayDate, todayISO } from '@/utils/date';
import { cn } from '@/utils/cn';

const DOW_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WFHPage() {
  const { state, currentUser, api, pushToast, busy } = useAppState();
  const [tab, setTab] = useState<'my' | 'team'>('my');
  const [date, setDate] = useState<string>(addDaysISO(todayISO(), 1));
  const [reason, setReason] = useState('');

  const myRequests = state.wfhRequests
    .filter((r) => r.employeeId === currentUser.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const week = datesForWeek(todayDate());

  const input = useMemo(
    () => ({ employeeId: currentUser.id, date, reason }),
    [currentUser.id, date, reason],
  );
  const issues = useMemo(() => wfhService.validate(state, input), [state, input]);
  const errors = issues.filter((i) => i.severity === 'error');

  const submit = async () => {
    if (errors.length > 0) return;
    try {
      await api.submitWFH(input);
      setDate(addDaysISO(todayISO(), 1));
      setReason('');
      pushToast({ tone: 'success', message: 'WFH request submitted for approval.' });
    } catch {
      /* handled */
    }
  };

  const withdraw = async (id: string) => {
    try {
      await api.withdrawWFH(id, currentUser.id);
      pushToast({ tone: 'info', message: 'WFH request withdrawn.' });
    } catch {
      /* handled */
    }
  };

  const teamScope =
    currentUser.role === 'admin'
      ? state.employees.filter((e) => e.active)
      : currentUser.role === 'manager'
        ? employeeService.reports(state, currentUser.id)
        : [currentUser, ...employeeService.team(state, currentUser.id)];

  return (
    <>
      <PageHeader
        title="Work From Home"
        description="View your weekly schedule and request exceptions"
        breadcrumbs={['People', 'Work From Home']}
      />

      <Tabs
        items={[
          { value: 'my', label: 'My schedule' },
          { value: 'team', label: 'Team schedule' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as 'my' | 'team')}
        className="mb-4"
      />

      {tab === 'my' ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Your week</CardTitle>
                <CardDescription>Default policy + approved exceptions</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-7 gap-2">
                {week.map((d) => {
                  const iso = toISO(d);
                  const mode = resolveDailyWorkMode(state, currentUser.id, iso);
                  const isToday = iso === todayISO();
                  return <DayPill key={iso} iso={iso} mode={mode} dow={DOW_LABEL[d.getDay()]} isToday={isToday} />;
                })}
              </div>
              <WFHLegend />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Request WFH exception</CardTitle>
                <CardDescription>For an office-designated day</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div>
                <Label required>Date</Label>
                <Input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
                <FieldError>{issues.find((i) => i.field === 'date' && i.severity === 'error')?.message}</FieldError>
                <FieldHint>
                  {issues.find((i) => i.field === 'date' && i.severity === 'warning')?.message}
                </FieldHint>
              </div>
              <div>
                <Label>Reason</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why do you need to WFH that day?" />
              </div>
              {issues.find((i) => i.field === 'conflict') ? (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {issues.find((i) => i.field === 'conflict')!.message}
                </p>
              ) : null}
              <Button className="w-full" onClick={submit} disabled={errors.length > 0 || busy} loading={busy}>
                Submit for approval
              </Button>
            </CardBody>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <div>
                <CardTitle>My WFH requests</CardTitle>
                <CardDescription>History of exceptions you've requested</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              {myRequests.length === 0 ? (
                <EmptyState icon={<Home className="h-5 w-5" />} title="No WFH requests yet" />
              ) : (
                <div className="overflow-hidden rounded border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Date</th>
                        <th className="px-3 py-2 text-left font-medium">Reason</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myRequests.map((r) => (
                        <tr key={r.id}>
                          <td className="px-3 py-2 text-slate-800">{formatHuman(r.date)}</td>
                          <td className="px-3 py-2 text-slate-600">{r.reason || '—'}</td>
                          <td className="px-3 py-2">
                            <Badge tone={r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'neutral'}>
                              {r.status}
                            </Badge>
                            {r.reviewerComment ? (
                              <span className="ml-2 text-xs italic text-slate-500">"{r.reviewerComment}"</span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {r.status === 'pending' ? (
                              <Button size="sm" variant="ghost" onClick={() => withdraw(r.id)}>
                                <Trash2 className="h-3.5 w-3.5" /> Withdraw
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      ) : (
        <TeamWeekGrid week={week} people={teamScope} />
      )}
    </>
  );
}

function DayPill({ iso, mode, dow, isToday }: { iso: string; mode: ReturnType<typeof resolveDailyWorkMode>; dow: string; isToday: boolean }) {
  const label =
    mode === 'holiday'
      ? 'Holiday'
      : mode === 'off'
        ? 'Off'
        : mode === 'leave'
          ? 'Leave'
          : mode === 'wfh'
            ? 'WFH'
            : mode === 'wfh-exception'
              ? 'WFH (approved)'
              : 'Office';
  const tone =
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
    <div className={cn('rounded-md border p-2 text-center text-xs', tone, isToday && 'ring-2 ring-brand-500 ring-offset-1')}>
      <p className="font-medium">{dow}</p>
      <p className="mt-0.5 text-[11px] opacity-70">{formatHumanShort(iso)}</p>
      <p className="mt-1 font-semibold">{label}</p>
    </div>
  );
}

function WFHLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Office</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> WFH / Approved WFH</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Leave</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Holiday</span>
    </div>
  );
}

function TeamWeekGrid({ week, people }: { week: Date[]; people: { id: string; firstName: string; lastName: string; department: string; avatarColor: string; designation: string }[] }) {
  const { state } = useAppState();
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Team attendance this week</CardTitle>
          <CardDescription>Where everyone is expected to work</CardDescription>
        </div>
        <Users className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardBody className="overflow-x-auto">
        {people.length === 0 ? (
          <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="No teammates to display" />
        ) : (
          <table className="min-w-full border-separate border-spacing-y-1 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Employee
                </th>
                {week.map((d) => (
                  <th key={toISO(d)} className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                    <div>{d.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                    <div className="text-[11px] font-normal text-slate-400">{formatHumanShort(toISO(d))}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td className="sticky left-0 bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar firstName={p.firstName} lastName={p.lastName} color={p.avatarColor} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{p.department}</p>
                      </div>
                    </div>
                  </td>
                  {week.map((d) => {
                    const iso = toISO(d);
                    const mode = resolveDailyWorkMode(state, p.id, iso);
                    const label =
                      mode === 'holiday' ? 'Hol' : mode === 'off' ? '—' : mode === 'leave' ? 'Leave' : mode === 'wfh' || mode === 'wfh-exception' ? 'WFH' : 'Office';
                    const tone =
                      mode === 'holiday'
                        ? 'bg-violet-50 text-violet-700'
                        : mode === 'off'
                          ? 'bg-slate-50 text-slate-400'
                          : mode === 'leave'
                            ? 'bg-amber-50 text-amber-700'
                            : mode === 'wfh' || mode === 'wfh-exception'
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-emerald-50 text-emerald-700';
                    return (
                      <td key={iso} className="px-1 py-2 text-center">
                        <span className={cn('inline-flex min-w-[62px] justify-center rounded px-2 py-1 text-xs font-medium', tone)}>
                          {label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}

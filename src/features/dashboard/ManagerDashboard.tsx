'use client';
import Link from 'next/link';
import { CalendarRange, ClipboardList, Home, Users } from 'lucide-react';
import { useApp } from '@/shell/useApp';
import { Stat } from '@/components/ui/Stat';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { employeeService } from '@/services/employee.service';
import { leaveTypeById } from '@/services/leave.service';
import { resolveDailyWorkMode } from '@/services/wfh.service';
import { addDaysISO, formatHuman, todayISO } from '@/utils/date';

export function ManagerDashboard() {
  const { state, currentUser } = useApp();
  const reports = employeeService.reports(state, currentUser.id).filter((e) => e.active);
  const reportIds = new Set(reports.map((r) => r.id));

  const pendingLeave = state.leaveRequests.filter((r) => r.status === 'pending' && reportIds.has(r.employeeId));
  const pendingWFH = state.wfhRequests.filter((r) => r.status === 'pending' && reportIds.has(r.employeeId));

  const onLeaveToday = reports.filter((r) => resolveDailyWorkMode(state, r.id, todayISO()) === 'leave');

  const next14 = addDaysISO(todayISO(), 14);
  const upcomingAbsences = state.leaveRequests
    .filter(
      (r) => reportIds.has(r.employeeId) && r.status === 'approved' && r.startDate <= next14 && r.endDate >= todayISO(),
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const todayModes = reports.map((emp) => ({ emp, mode: resolveDailyWorkMode(state, emp.id, todayISO()) }));
  const atOffice = todayModes.filter((t) => t.mode === 'office').length;
  const wfhToday = todayModes.filter((t) => t.mode === 'wfh' || t.mode === 'wfh-exception').length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending approvals" value={pendingLeave.length + pendingWFH.length} icon={<ClipboardList className="h-4 w-4" />} tone="warning" />
        <Stat label="On leave today" value={onLeaveToday.length} hint={onLeaveToday.map((e) => e.firstName).join(', ') || '—'} icon={<CalendarRange className="h-4 w-4" />} />
        <Stat label="In office today" value={atOffice} hint="Direct reports" icon={<Users className="h-4 w-4" />} tone="success" />
        <Stat label="WFH today" value={wfhToday} icon={<Home className="h-4 w-4" />} tone="brand" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Pending approvals</CardTitle>
              <CardDescription>Requests from your direct reports</CardDescription>
            </div>
            <Link href="/approvals">
              <Button size="sm" variant="outline">
                Open inbox
              </Button>
            </Link>
          </CardHeader>
          <CardBody>
            {pendingLeave.length === 0 && pendingWFH.length === 0 ? (
              <EmptyState title="You're caught up" description="No pending leave or WFH requests from your reports." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingLeave.map((r) => {
                  const emp = employeeService.byId(state, r.employeeId);
                  const t = leaveTypeById(state.leaveTypes, r.leaveTypeId);
                  if (!emp) return null;
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar firstName={emp.firstName} lastName={emp.lastName} color={emp.avatarColor} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {emp.firstName} {emp.lastName}
                            <span className="ml-2 text-xs font-normal text-slate-500">
                              {t?.name} · {formatHuman(r.startDate)} → {formatHuman(r.endDate)}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">{r.reason || 'No reason provided'}</p>
                        </div>
                      </div>
                      <Badge tone={statusTone(r.status)}>Leave · Pending</Badge>
                    </li>
                  );
                })}
                {pendingWFH.map((r) => {
                  const emp = employeeService.byId(state, r.employeeId);
                  if (!emp) return null;
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar firstName={emp.firstName} lastName={emp.lastName} color={emp.avatarColor} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {emp.firstName} {emp.lastName}
                            <span className="ml-2 text-xs font-normal text-slate-500">WFH · {formatHuman(r.date)}</span>
                          </p>
                          <p className="text-xs text-slate-500">{r.reason || 'No reason provided'}</p>
                        </div>
                      </div>
                      <Badge tone="sky">WFH · Pending</Badge>
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
              <CardTitle>Upcoming absences</CardTitle>
              <CardDescription>Next 14 days</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            {upcomingAbsences.length === 0 ? (
              <EmptyState title="No upcoming absences" />
            ) : (
              <ul className="space-y-3">
                {upcomingAbsences.map((r) => {
                  const emp = employeeService.byId(state, r.employeeId);
                  if (!emp) return null;
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                      <div className="flex items-center gap-3">
                        <Avatar firstName={emp.firstName} lastName={emp.lastName} color={emp.avatarColor} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatHuman(r.startDate)} → {formatHuman(r.endDate)}
                          </p>
                        </div>
                      </div>
                      <Badge tone="success">Approved</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Team today</CardTitle>
              <CardDescription>Work mode for each direct report</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            {reports.length === 0 ? (
              <EmptyState title="No direct reports" description="You can still view the organization directory and your personal requests." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {todayModes.map(({ emp, mode }) => (
                  <div key={emp.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 p-3">
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
                      <Badge tone="warning">Leave</Badge>
                    ) : mode === 'holiday' ? (
                      <Badge tone="violet">Holiday</Badge>
                    ) : mode === 'wfh' || mode === 'wfh-exception' ? (
                      <Badge tone="sky">WFH</Badge>
                    ) : mode === 'off' ? (
                      <Badge tone="neutral">Off</Badge>
                    ) : (
                      <Badge tone="success">Office</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

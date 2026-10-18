'use client';
import { useState } from 'react';
import { AlertTriangle, Home, Users } from 'lucide-react';
import { useApp } from '@/shell/useApp';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Label, Select } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Tabs } from '@/components/ui/Tabs';
import { employeeService } from '@/services/employee.service';
import { todayISO } from '@/utils/date';
import type { Weekday } from '@/types';

const DAYS: { v: Weekday; label: string }[] = [
  { v: 1, label: 'Monday' },
  { v: 2, label: 'Tuesday' },
  { v: 3, label: 'Wednesday' },
  { v: 4, label: 'Thursday' },
  { v: 5, label: 'Friday' },
  { v: 6, label: 'Saturday' },
  { v: 0, label: 'Sunday' },
];

export function AdminSettingsPage() {
  const { state, currentUser, api, pushToast } = useApp();
  const [tab, setTab] = useState<'policy' | 'leave' | 'leavePolicy' | 'reporting' | 'danger'>('policy');
  const [confirmReset, setConfirmReset] = useState(false);

  const workMode = state.policy.workMode;
  const setMode = (day: Weekday, mode: 'office' | 'wfh' | 'off') => {
    void api.updatePolicy(currentUser.id, { workMode: { ...state.policy.workMode, [day]: mode } });
  };

  const [effectiveFrom, setEffectiveFrom] = useState(state.policy.effectiveFrom);
  const saveEffective = async () => {
    try {
      await api.updatePolicy(currentUser.id, { effectiveFrom });
      pushToast({ tone: 'success', message: 'Effective date updated.' });
    } catch {
      /* handled */
    }
  };

  const totalApprovedWFHConflicts = state.wfhRequests.filter((r) => {
    if (r.status !== 'approved') return false;
    const dow = new Date(r.date).getDay() as Weekday;
    return state.policy.workMode[dow] === 'wfh' || state.policy.workMode[dow] === 'off';
  }).length;

  return (
    <>
      <PageHeader
        title="Admin Settings"
        description="Shape company policies, leave quotas, and reporting lines"
        breadcrumbs={['Admin', 'Settings']}
      />

      <Tabs
        items={[
          { value: 'policy', label: 'Hybrid policy' },
          { value: 'leave', label: 'Leave types' },
          { value: 'leavePolicy', label: 'Leave policy' },
          { value: 'reporting', label: 'Reporting lines' },
          { value: 'danger', label: 'Danger zone' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
        className="mb-4"
      />

      {tab === 'policy' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Weekly hybrid schedule</CardTitle>
                <CardDescription>
                  Default is Tuesday and Friday as WFH, Monday/Wednesday/Thursday as office days.
                </CardDescription>
              </div>
              <Home className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-7">
                {DAYS.map(({ v, label }) => {
                  const mode = workMode[v];
                  return (
                    <div key={v} className="rounded-md border border-slate-200 p-3 text-center">
                      <p className="text-xs font-medium text-slate-500">{label.slice(0, 3)}</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {mode === 'office' ? 'Office' : mode === 'wfh' ? 'WFH' : 'Off'}
                      </p>
                      <Select
                        className="mt-2"
                        value={mode}
                        onChange={(e) => setMode(v, e.target.value as 'office' | 'wfh' | 'off')}
                      >
                        <option value="office">Office</option>
                        <option value="wfh">WFH</option>
                        <option value="off">Off</option>
                      </Select>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div>
                  <Label htmlFor="eff">Effective from</Label>
                  <Input id="eff" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" onClick={saveEffective}>
                  Update effective date
                </Button>
                <p className="ml-auto text-xs text-slate-500">
                  Last updated {new Date(state.policy.updatedAt).toLocaleString()} by {employeeService.byId(state, state.policy.updatedBy)?.firstName ?? 'admin'}
                </p>
              </div>
              {totalApprovedWFHConflicts > 0 ? (
                <div className="mt-3 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <span>
                    {totalApprovedWFHConflicts} previously approved WFH exception(s) now sit on a default WFH or off day. They remain approved — treat them as duplicates and inform the employees if needed.
                  </span>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === 'leave' ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Leave types & demo balances</CardTitle>
              <CardDescription>Change the default annual quota applied to new employees and the demo seed.</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {state.leaveTypes.map((t) => (
                <div key={t.id} className="rounded-md border border-slate-200 p-4">
                  <div className="grid gap-3 sm:grid-cols-5">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: t.color }} />
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500">{t.code} · {t.accrual}</p>
                    </div>
                    <div>
                      <Label>Annual quota</Label>
                      <Input
                        type="number"
                        min={0}
                        value={t.defaultAnnualQuota}
                        onChange={(e) => {
                          const n = Math.max(0, parseInt(e.target.value || '0', 10));
                          void api.updateLeaveType(t.id, { defaultAnnualQuota: n });
                        }}
                      />
                    </div>
                    <div>
                      <Label>Max negative</Label>
                      <Input
                        type="number"
                        min={0}
                        value={t.maxNegativeBalance}
                        onChange={(e) => {
                          const n = Math.max(0, parseInt(e.target.value || '0', 10));
                          void api.updateLeaveType(t.id, { maxNegativeBalance: n, allowNegativeBalance: n > 0 });
                        }}
                        disabled={!t.allowNegativeBalance}
                      />
                    </div>
                    <div className="flex items-end gap-4">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={t.allowHalfDay}
                          onChange={(e) => {
                            void api.updateLeaveType(t.id, { allowHalfDay: e.target.checked });
                          }}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Half-day
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={t.allowNegativeBalance}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            void api.updateLeaveType(t.id, {
                              allowNegativeBalance: enabled,
                              maxNegativeBalance: enabled ? t.maxNegativeBalance || 1 : 0,
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Negative OK
                      </label>
                    </div>
                    <div className="flex items-end justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await api.applyLeaveTypeToAll(t.id, t.defaultAnnualQuota);
                            pushToast({ tone: 'success', message: `${t.name} quotas applied to all employees.` });
                          } catch {
                            /* handled */
                          }
                        }}
                      >
                        Apply to employees
                      </Button>
                    </div>
                  </div>
                  {t.description ? <p className="mt-2 text-xs text-slate-500">{t.description}</p> : null}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}

      {tab === 'leavePolicy' ? <LeavePolicyPanel /> : null}

      {tab === 'reporting' ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Reporting relationships</CardTitle>
              <CardDescription>Change who approves each employee's requests</CardDescription>
            </div>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardBody>
            <div className="overflow-hidden rounded border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Employee</th>
                    <th className="px-3 py-2 text-left font-medium">Department</th>
                    <th className="px-3 py-2 text-left font-medium">Manager</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.employees.map((emp) => {
                    const invalid = emp.managerId
                      ? employeeService.wouldCreateCycle(state, emp.id, emp.managerId)
                      : false;
                    return (
                      <tr key={emp.id}>
                        <td className="px-3 py-2 text-slate-800">
                          {emp.firstName} {emp.lastName}
                          <p className="text-xs text-slate-500">{emp.designation}</p>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{emp.department}</td>
                        <td className="px-3 py-2">
                          <Select
                            value={emp.managerId ?? ''}
                            onChange={(e) => {
                              const v = e.target.value || null;
                              if (employeeService.wouldCreateCycle(state, emp.id, v)) {
                                pushToast({ tone: 'error', message: 'That assignment would create a reporting cycle.' });
                                return;
                              }
                              void api.setManager(currentUser.id, emp.id, v).then(() => {
                                pushToast({ tone: 'success', message: 'Manager updated.' });
                              });
                            }}
                          >
                            <option value="">No manager</option>
                            {state.employees
                              .filter((m) => m.id !== emp.id && !employeeService.wouldCreateCycle(state, emp.id, m.id))
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.firstName} {m.lastName}
                                </option>
                              ))}
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          {emp.active ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
                          {invalid ? <Badge tone="danger" className="ml-1">cycle</Badge> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {tab === 'danger' ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>Irreversible changes affecting all mock data</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="rounded border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-900">Reset demo data</p>
              <p className="mt-1 text-xs text-slate-500">
                Clears localStorage and reseeds all employees, holidays, policies, requests and audit history. Only affects this browser.
              </p>
              <div className="mt-3">
                <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
                  Reset demo data
                </Button>
              </div>
            </div>
            <div className="rounded border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-900">Audit log</p>
              <p className="mt-1 text-xs text-slate-500">{state.audit.length} events recorded</p>
              <ul className="mt-2 max-h-56 overflow-y-auto text-xs text-slate-600 scrollbar-thin">
                {state.audit.slice(0, 50).map((a) => (
                  <li key={a.id} className="border-b border-slate-100 py-1.5">
                    <span className="font-medium">{a.action}</span> · {a.actorId} ·{' '}
                    <span className="text-slate-400">{new Date(a.at).toLocaleString()}</span>
                    {a.note ? <> · <em>"{a.note}"</em></> : null}
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data?"
        description={`This clears the server-side state and reseeds data as of ${todayISO()}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={async () => {
                try {
                  await api.resetState();
                  pushToast({ tone: 'success', message: 'Demo data has been reset.' });
                } catch {
                  /* handled */
                }
                setConfirmReset(false);
              }}
            >
              Reset now
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Current active persona: <strong>{currentUser.firstName} {currentUser.lastName}</strong>. After reset you'll land on the Priya Sharma employee persona.
        </p>
      </Dialog>

    </>
  );
}

function LeavePolicyPanel() {
  const { state, currentUser, api, pushToast } = useApp();
  const lp = state.leavePolicy;
  const update = (patch: Partial<typeof lp>) => {
    void api.updateLeavePolicy(patch);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Policy constants</CardTitle>
            <CardDescription>
              Reflects the Novelty Wealth Leave Policy effective 1 January 2026. Edits apply across the app immediately.
            </CardDescription>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Max carry-forward</Label>
              <Input
                type="number"
                min={0}
                value={lp.maxCarryForward}
                onChange={(e) => update({ maxCarryForward: Math.max(0, parseInt(e.target.value || '0', 10)) })}
              />
              <p className="mt-1 text-xs text-slate-500">Days carried into next year</p>
            </div>
            <div>
              <Label>Excess carry-forward</Label>
              <Select
                value={lp.excessCarryForwardTreatment}
                onChange={(e) => update({ excessCarryForwardTreatment: e.target.value as typeof lp.excessCarryForwardTreatment })}
              >
                <option value="encash-at-basic-pay">Encash at Basic Pay</option>
                <option value="lapse">Lapse</option>
              </Select>
            </div>
            <div>
              <Label>Q1–Q3 negative tolerance</Label>
              <Input
                type="number"
                min={0}
                value={lp.qEndNegativeAllowance}
                onChange={(e) => update({ qEndNegativeAllowance: Math.max(0, parseInt(e.target.value || '0', 10)) })}
              />
              <p className="mt-1 text-xs text-slate-500">Max days negative tolerated at quarter close</p>
            </div>
            <div>
              <Label>Q4 negative treatment</Label>
              <Select
                value={lp.q4NegativeTreatment}
                onChange={(e) => update({ q4NegativeTreatment: e.target.value as typeof lp.q4NegativeTreatment })}
              >
                <option value="loss-of-pay">Loss of Pay</option>
                <option value="carry">Carry into next year</option>
              </Select>
            </div>
            <div>
              <Label>Half-day</Label>
              <Select
                value={lp.halfDayRequiresManagerApproval ? 'manager' : 'open'}
                onChange={(e) => update({ halfDayRequiresManagerApproval: e.target.value === 'manager' })}
              >
                <option value="manager">Manager approval required</option>
                <option value="open">Open (any employee can log)</option>
              </Select>
            </div>
            <div>
              <Label>Retrospective leave</Label>
              <Select
                value={lp.retrospectiveLeaveTreatment}
                onChange={(e) => update({ retrospectiveLeaveTreatment: e.target.value as typeof lp.retrospectiveLeaveTreatment })}
              >
                <option value="loss-of-pay">Loss of Pay</option>
                <option value="allow">Allowed</option>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                pushToast({ tone: 'success', message: `Policy saved (${currentUser.firstName}).` });
              }}
            >
              Confirm
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Policy summary</CardTitle>
            <CardDescription>Snapshot of what employees see across the app</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="space-y-2 text-sm text-slate-700">
          <p><strong>Entity:</strong> FW Fintech Private Limited (Novelty Wealth) · people@noveltywealth.in</p>
          <p><strong>Leave year:</strong> 1 Jan → 31 Dec</p>
          <p><strong>Paid Leave:</strong> 20 days / year, accrued 5 per quarter in advance. Up to {lp.qEndNegativeAllowance} negative at end of Q1–Q3; residual negative at Q4 close ⇒ {lp.q4NegativeTreatment === 'loss-of-pay' ? 'Loss of Pay' : 'carried forward'}.</p>
          <p><strong>Special Day:</strong> 1 day / year — birthday, anniversary.</p>
          <p><strong>Year-End Shutdown:</strong> 30–31 Dec 2026 (listed as company holidays).</p>
          <p><strong>Bereavement:</strong> case-by-case, management discretion.</p>
          <p><strong>Maternity:</strong> 26 weeks · <strong>Paternity:</strong> 15 working days (within 6 months of birth, up to two children).</p>
          <p><strong>Carry-forward:</strong> up to {lp.maxCarryForward} days; excess ⇒ {lp.excessCarryForwardTreatment === 'encash-at-basic-pay' ? 'encashed at Basic Pay' : 'lapses'}.</p>
          <p><strong>Half-day:</strong> {lp.halfDayRequiresManagerApproval ? 'manager approval required' : 'open'}.</p>
          <p><strong>Retrospective / unauthorized leave:</strong> treated as {lp.retrospectiveLeaveTreatment === 'loss-of-pay' ? 'Loss of Pay' : 'allowed'}.</p>
          <p className="mt-2 text-xs text-slate-500">
            This UI treats carry-forward, encashment, and Q4 LOP settlement as year-end operations and does not simulate them. The negative-balance cap configured per leave type is enforced at submission time.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

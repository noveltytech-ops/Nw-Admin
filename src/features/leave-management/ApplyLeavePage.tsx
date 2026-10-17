'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Info } from 'lucide-react';
import { useAppState } from '@/shell/AppStateContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { FieldError, FieldHint, Input, Label, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { leaveService, type LeaveApplicationInput } from '@/services/leave.service';
import { computeWorkingDays } from '@/services/working-days.service';
import { todayISO } from '@/utils/date';

export function ApplyLeavePage() {
  const { state, currentUser, api, pushToast, busy } = useAppState();
  const router = useRouter();

  const [input, setInput] = useState<LeaveApplicationInput>({
    employeeId: currentUser.id,
    leaveTypeId: state.leaveTypes[0]?.id ?? '',
    startDate: todayISO(),
    endDate: todayISO(),
    halfDay: null,
    reason: '',
  });

  const type = state.leaveTypes.find((t) => t.id === input.leaveTypeId);
  const balance = type
    ? leaveService.getAccruedBalance(type, currentUser)
    : { accrued: 0, used: 0, remaining: 0, allocated: 0 };

  const workingDays = useMemo(
    () =>
      input.startDate && input.endDate
        ? computeWorkingDays(input.startDate, input.endDate, input.halfDay, {
            holidays: state.holidays,
            policy: state.policy,
          })
        : 0,
    [input.startDate, input.endDate, input.halfDay, state.holidays, state.policy],
  );

  const issues = useMemo(() => leaveService.validate(state, input), [state, input]);
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  const field = (name: keyof LeaveApplicationInput) => issues.find((i) => i.field === name)?.message;

  const update = <K extends keyof LeaveApplicationInput>(k: K, v: LeaveApplicationInput[K]) =>
    setInput((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (errors.length > 0) {
      pushToast({ tone: 'error', message: 'Please fix the errors before submitting.' });
      return;
    }
    try {
      await api.submitLeave(input);
      pushToast({ tone: 'success', message: 'Leave request submitted for approval.' });
      router.push('/my-requests');
    } catch {
      // toast already surfaced by context
    }
  };

  const sameDate = input.startDate === input.endDate;

  return (
    <>
      <PageHeader
        title="Apply for Leave"
        description="Submit a leave request to your reporting manager"
        breadcrumbs={['People', 'Apply for Leave']}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>New leave request</CardTitle>
              <CardDescription>
                Working days exclude company holidays and weekends automatically.
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody className="space-y-5">
            <div>
              <Label required>Leave type</Label>
              <Select value={input.leaveTypeId} onChange={(e) => update('leaveTypeId', e.target.value)}>
                {state.leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </Select>
              <FieldHint>
                {type ? (
                  <>
                    {type.description ?? ''}
                    {type.allowHalfDay ? ' Half-day permitted (manager approval required).' : ''}
                    {type.allowNegativeBalance ? ` Negative balance tolerated up to ${type.maxNegativeBalance} day(s).` : ' Negative balance not permitted.'}
                  </>
                ) : null}
              </FieldHint>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label required>Start date</Label>
                <Input
                  type="date"
                  value={input.startDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    update('startDate', v);
                    if (input.endDate < v) update('endDate', v);
                  }}
                />
                <FieldError>{field('startDate')}</FieldError>
              </div>
              <div>
                <Label required>End date</Label>
                <Input
                  type="date"
                  value={input.endDate}
                  min={input.startDate}
                  onChange={(e) => update('endDate', e.target.value)}
                />
                <FieldError>{field('endDate')}</FieldError>
              </div>
            </div>

            {sameDate && type?.allowHalfDay ? (
              <div>
                <Label>Half day</Label>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="halfDay"
                      checked={input.halfDay === null}
                      onChange={() => update('halfDay', null)}
                    />
                    Full day
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="halfDay"
                      checked={input.halfDay === 'first'}
                      onChange={() => update('halfDay', 'first')}
                    />
                    First half
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="halfDay"
                      checked={input.halfDay === 'second'}
                      onChange={() => update('halfDay', 'second')}
                    />
                    Second half
                  </label>
                </div>
              </div>
            ) : null}

            <div>
              <Label>Reason / notes</Label>
              <Textarea value={input.reason} onChange={(e) => update('reason', e.target.value)} placeholder="Context for your manager (optional)" />
            </div>

            {issues.filter((i) => !i.field).map((i, idx) => (
              <div key={idx} className={`rounded border px-3 py-2 text-sm ${i.severity === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                {i.message}
              </div>
            ))}
            {issues
              .filter((i) => i.field === 'overlap' || i.field === 'balance' || i.field === 'window')
              .map((i, idx) => (
                <div key={idx} className={`rounded border px-3 py-2 text-sm ${i.severity === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                  {i.message}
                </div>
              ))}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={errors.length > 0 || workingDays === 0 || busy} loading={busy}>
                Submit for approval
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Request summary</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Working days</span>
                <span className="text-lg font-semibold text-slate-900">{workingDays}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Leave type</span>
                <span className="font-medium text-slate-800">{type?.name ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Accrued balance</span>
                <span className="font-medium text-slate-800">
                  {balance.remaining} of {balance.accrued}
                  {type?.accrual === 'quarterly' ? ` (annual ${balance.allocated})` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">After this request</span>
                <span className="font-medium text-slate-800">{balance.remaining - workingDays}</span>
              </div>
              {warnings.length > 0 ? (
                <div className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                  <Info className="mt-0.5 h-3.5 w-3.5" />
                  <span>{warnings[0].message}</span>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Approval route</CardTitle>
                <CardDescription>Single-manager approval</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <ApproverInfo />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Balance snapshot</CardTitle>
                <CardDescription>Current allocation</CardDescription>
              </div>
              <CalendarCheck className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardBody className="space-y-2">
              {state.leaveTypes.map((t) => {
                const b = currentUser.balances.find((x) => x.leaveTypeId === t.id);
                if (!b) return null;
                const info = leaveService.getAccruedBalance(t, currentUser);
                return (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{t.name}</span>
                    <Badge tone="neutral">
                      {info.remaining} / {t.accrual === 'quarterly' ? info.accrued : info.allocated}
                    </Badge>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function ApproverInfo() {
  const { state, currentUser } = useAppState();
  const manager = state.employees.find((e) => e.id === currentUser.managerId);
  if (!manager) {
    return (
      <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
        You don't have an assigned manager. An admin needs to assign one before you can submit requests for approval.
      </p>
    );
  }
  return (
    <div className="text-sm text-slate-700">
      <p>
        <span className="font-medium text-slate-900">
          {manager.firstName} {manager.lastName}
        </span>{' '}
        <span className="text-slate-500">· {manager.designation}</span>
      </p>
      <p className="mt-1 text-xs text-slate-500">Phase 1 uses a single approver. Multi-level flow is planned for Phase 2.</p>
    </div>
  );
}

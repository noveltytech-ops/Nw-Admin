'use client';
import { useMemo, useState } from 'react';
import { Check, Inbox, ShieldAlert, X } from 'lucide-react';
import { useAppState } from '@/shell/AppStateContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { Label, Textarea } from '@/components/ui/Input';
import { approvalService } from '@/services/approval.service';
import { employeeService } from '@/services/employee.service';
import { leaveTypeById } from '@/services/leave.service';
import { formatHuman } from '@/utils/date';
import type { LeaveRequest, WFHRequest } from '@/types';

type Decision = { kind: 'approve' | 'reject'; type: 'leave' | 'wfh'; id: string };

export function ApprovalsPage() {
  const { state, currentUser, api, pushToast, busy } = useAppState();
  const [tab, setTab] = useState<'pending' | 'decided'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'leave' | 'wfh'>('all');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [comment, setComment] = useState('');

  const scope = currentUser.role === 'admin' ? state.employees : employeeService.reports(state, currentUser.id);
  const scopeIds = new Set(scope.map((e) => e.id));

  const leaveRequests = state.leaveRequests.filter((r) => scopeIds.has(r.employeeId));
  const wfhRequests = state.wfhRequests.filter((r) => scopeIds.has(r.employeeId));

  const pendingLeave = leaveRequests.filter((r) => r.status === 'pending');
  const pendingWFH = wfhRequests.filter((r) => r.status === 'pending');
  const decidedLeave = leaveRequests.filter((r) => r.status !== 'pending');
  const decidedWFH = wfhRequests.filter((r) => r.status !== 'pending');

  const shownLeave = tab === 'pending' ? pendingLeave : decidedLeave;
  const shownWFH = tab === 'pending' ? pendingWFH : decidedWFH;

  const filteredLeave = typeFilter === 'wfh' ? [] : shownLeave;
  const filteredWFH = typeFilter === 'leave' ? [] : shownWFH;

  const commitDecision = async () => {
    if (!decision) return;
    const commentTrimmed = comment.trim() || undefined;
    try {
      if (decision.type === 'leave') {
        if (decision.kind === 'approve') {
          await api.approveLeave(decision.id, currentUser.id, commentTrimmed);
          pushToast({ tone: 'success', message: 'Leave approved. Balance updated.' });
        } else {
          await api.rejectLeave(decision.id, currentUser.id, commentTrimmed);
          pushToast({ tone: 'info', message: 'Leave rejected.' });
        }
      } else if (decision.kind === 'approve') {
        await api.approveWFH(decision.id, currentUser.id, commentTrimmed);
        pushToast({ tone: 'success', message: 'WFH approved.' });
      } else {
        await api.rejectWFH(decision.id, currentUser.id, commentTrimmed);
        pushToast({ tone: 'info', message: 'WFH rejected.' });
      }
      setDecision(null);
      setComment('');
    } catch {
      /* handled */
    }
  };

  const needsAttention = pendingLeave.length + pendingWFH.length;

  const tabs = useMemo(
    () => [
      { value: 'pending' as const, label: 'Pending', count: needsAttention },
      { value: 'decided' as const, label: 'Decided', count: decidedLeave.length + decidedWFH.length },
    ],
    [needsAttention, decidedLeave.length, decidedWFH.length],
  );

  const showNothing = filteredLeave.length === 0 && filteredWFH.length === 0;

  return (
    <>
      <PageHeader
        title="Approval Inbox"
        description={currentUser.role === 'admin' ? 'Organization-wide requests' : 'Requests from your direct reports'}
        breadcrumbs={['People', 'Approvals']}
        actions={
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-1 text-xs">
            {(['all', 'leave', 'wfh'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTypeFilter(v)}
                className={`rounded px-3 py-1 ${typeFilter === v ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {v === 'all' ? 'All' : v === 'leave' ? 'Leave' : 'WFH'}
              </button>
            ))}
          </div>
        }
      />

      <Tabs items={tabs} value={tab} onChange={setTab} className="mb-4" />

      {scope.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="h-5 w-5" />}
          title="No direct reports"
          description="You can still view your own requests, but there's nothing to approve here."
        />
      ) : showNothing ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title={tab === 'pending' ? 'All caught up' : 'No historical records'}
          description={tab === 'pending' ? 'No requests waiting on you.' : 'Approve or reject a request to see it here.'}
        />
      ) : (
        <div className="space-y-3">
          {filteredLeave.map((r) => (
            <LeaveRow key={r.id} request={r} onDecision={(kind) => setDecision({ kind, type: 'leave', id: r.id })} />
          ))}
          {filteredWFH.map((r) => (
            <WFHRow key={r.id} request={r} onDecision={(kind) => setDecision({ kind, type: 'wfh', id: r.id })} />
          ))}
        </div>
      )}

      <Dialog
        open={!!decision}
        onClose={() => {
          setDecision(null);
          setComment('');
        }}
        title={decision?.kind === 'approve' ? 'Approve request' : 'Reject request'}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setDecision(null); setComment(''); }}>
              Cancel
            </Button>
            <Button
              variant={decision?.kind === 'approve' ? 'primary' : 'danger'}
              onClick={commitDecision}
              loading={busy}
              disabled={busy}
            >
              {decision?.kind === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Label>Reviewer comment {decision?.kind === 'reject' ? '(recommended)' : '(optional)'}</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={decision?.kind === 'approve' ? 'A short note for the employee' : 'Explain why this is being rejected'}
          />
          <p className="text-xs text-slate-500">The employee will see this on their request.</p>
        </div>
      </Dialog>
    </>
  );
}

function LeaveRow({ request, onDecision }: { request: LeaveRequest; onDecision: (k: 'approve' | 'reject') => void }) {
  const { state, currentUser } = useAppState();
  const emp = employeeService.byId(state, request.employeeId);
  const t = leaveTypeById(state.leaveTypes, request.leaveTypeId);
  if (!emp) return null;
  const canAct = approvalService.canApproveLeave(state, currentUser.id, request) && request.status === 'pending';

  return (
    <Card>
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Avatar firstName={emp.firstName} lastName={emp.lastName} color={emp.avatarColor} />
          <div>
            <p className="text-sm font-medium text-slate-900">
              {emp.firstName} {emp.lastName}
              <span className="ml-2 text-xs text-slate-500">
                {emp.designation} · {emp.department}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              {t?.name} · {formatHuman(request.startDate)}
              {request.startDate !== request.endDate ? <> → {formatHuman(request.endDate)}</> : null}
              {' · '} {request.workingDays} day{request.workingDays === 1 ? '' : 's'}
              {request.halfDay ? ` · ${request.halfDay} half` : ''}
            </p>
            {request.reason ? <p className="mt-1 max-w-xl text-sm text-slate-700">"{request.reason}"</p> : null}
            {request.reviewerComment ? (
              <p className="mt-1 max-w-xl text-xs italic text-slate-500">Reviewer: "{request.reviewerComment}"</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(request.status)}>Leave · {request.status}</Badge>
          {canAct ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onDecision('reject')}>
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
              <Button size="sm" onClick={() => onDecision('approve')}>
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
            </>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}

function WFHRow({ request, onDecision }: { request: WFHRequest; onDecision: (k: 'approve' | 'reject') => void }) {
  const { state, currentUser } = useAppState();
  const emp = employeeService.byId(state, request.employeeId);
  if (!emp) return null;
  const canAct = approvalService.canApproveWFH(state, currentUser.id, request) && request.status === 'pending';
  return (
    <Card>
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Avatar firstName={emp.firstName} lastName={emp.lastName} color={emp.avatarColor} />
          <div>
            <p className="text-sm font-medium text-slate-900">
              {emp.firstName} {emp.lastName}
              <span className="ml-2 text-xs text-slate-500">
                {emp.designation} · {emp.department}
              </span>
            </p>
            <p className="text-xs text-slate-500">WFH · {formatHuman(request.date)}</p>
            {request.reason ? <p className="mt-1 max-w-xl text-sm text-slate-700">"{request.reason}"</p> : null}
            {request.reviewerComment ? (
              <p className="mt-1 max-w-xl text-xs italic text-slate-500">Reviewer: "{request.reviewerComment}"</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="sky">WFH · {request.status}</Badge>
          {canAct ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onDecision('reject')}>
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
              <Button size="sm" onClick={() => onDecision('approve')}>
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
            </>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}

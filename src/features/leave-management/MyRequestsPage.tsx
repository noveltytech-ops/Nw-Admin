'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Inbox, Trash2, XCircle } from 'lucide-react';
import { useAppState } from '@/shell/AppStateContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Select, Input, Textarea, Label } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { leaveTypeById } from '@/services/leave.service';
import { formatHuman } from '@/utils/date';
import type { RequestStatus, LeaveRequest } from '@/types';

const STATUS_TABS: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export function MyRequestsPage() {
  const { state, currentUser, api, pushToast } = useAppState();
  const [tab, setTab] = useState<RequestStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cancelReq, setCancelReq] = useState<LeaveRequest | null>(null);
  const [cancelNote, setCancelNote] = useState('');

  const requests = useMemo(() => {
    return state.leaveRequests
      .filter((r) => r.employeeId === currentUser.id)
      .filter((r) => tab === 'all' || r.status === tab)
      .filter((r) => typeFilter === 'all' || r.leaveTypeId === typeFilter)
      .filter((r) => (from ? r.endDate >= from : true))
      .filter((r) => (to ? r.startDate <= to : true))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [state.leaveRequests, currentUser.id, tab, typeFilter, from, to]);

  const counts: Partial<Record<RequestStatus | 'all', number>> = { all: 0 };
  for (const r of state.leaveRequests.filter((x) => x.employeeId === currentUser.id)) {
    counts.all = (counts.all ?? 0) + 1;
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }

  const withdraw = async (id: string) => {
    try {
      await api.withdrawLeave(id, currentUser.id);
      pushToast({ tone: 'info', message: 'Request withdrawn.' });
    } catch {
      /* handled by context */
    }
  };

  const confirmCancel = async () => {
    if (!cancelReq) return;
    try {
      await api.cancelLeave(cancelReq.id, currentUser.id, cancelNote || undefined);
      pushToast({ tone: 'info', message: 'Approved leave cancelled. Balance restored.' });
      setCancelReq(null);
      setCancelNote('');
    } catch {
      /* handled */
    }
  };

  return (
    <>
      <PageHeader
        title="My Requests"
        description="Track your leave requests, decisions and comments"
        breadcrumbs={['People', 'My Requests']}
        actions={
          <Link href="/apply">
            <Button size="sm">Apply for leave</Button>
          </Link>
        }
      />

      <Tabs
        items={STATUS_TABS.map((t) => ({ ...t, count: counts[t.value] }))}
        value={tab}
        onChange={setTab}
        className="mb-4"
      />

      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="type-filter">Leave type</Label>
            <Select id="type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="min-w-[140px]">
              <option value="all">All</option>
              {state.leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {(typeFilter !== 'all' || from || to) && (
            <Button variant="ghost" size="sm" onClick={() => { setTypeFilter('all'); setFrom(''); setTo(''); }}>
              Clear filters
            </Button>
          )}
        </CardBody>
      </Card>

      {requests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="No requests found"
          description="Try widening the filters or submit a new leave request."
          action={<Link href="/apply"><Button size="sm">Apply for leave</Button></Link>}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Dates</th>
                <th className="px-4 py-3 text-left font-medium">Days</th>
                <th className="px-4 py-3 text-left font-medium">Submitted</th>
                <th className="px-4 py-3 text-left font-medium">Approver</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => {
                const t = leaveTypeById(state.leaveTypes, r.leaveTypeId);
                const approver = state.employees.find((e) => e.id === r.decidedBy);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t?.color }} />
                        <span className="font-medium text-slate-800">{t?.code}</span>
                        <span className="text-slate-500">{t?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatHuman(r.startDate)}
                      {r.startDate !== r.endDate ? <> → {formatHuman(r.endDate)}</> : null}
                      {r.halfDay ? <span className="ml-1 text-xs text-slate-500">({r.halfDay} half)</span> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.workingDays}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(r.submittedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {approver ? `${approver.firstName} ${approver.lastName}` : '—'}
                      {r.reviewerComment ? <p className="truncate text-xs italic">"{r.reviewerComment}"</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'pending' ? (
                        <Button variant="ghost" size="sm" onClick={() => withdraw(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Withdraw
                        </Button>
                      ) : r.status === 'approved' && r.endDate >= todayStr() ? (
                        <Button variant="ghost" size="sm" onClick={() => setCancelReq(r)}>
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 inline-flex items-center gap-1"><Clock className="h-3 w-3" />Closed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={!!cancelReq}
        onClose={() => setCancelReq(null)}
        title="Cancel approved leave"
        description="Policy: cancelling restores the deducted days to your balance and keeps an audit entry."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelReq(null)}>
              Keep leave
            </Button>
            <Button variant="danger" onClick={confirmCancel}>
              Cancel leave
            </Button>
          </>
        }
      >
        {cancelReq ? (
          <div className="space-y-3 text-sm">
            <p className="text-slate-700">
              You're about to cancel {cancelReq.workingDays} day(s) of leave starting {formatHuman(cancelReq.startDate)}.
            </p>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} placeholder="Context for the audit log" />
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

'use client';
import { useMemo, useState } from 'react';
import { Edit3, PartyPopper, Plus, Trash2 } from 'lucide-react';
import { useAppState } from '@/shell/AppStateContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatHuman, todayISO } from '@/utils/date';
import type { Holiday } from '@/types';

export function HolidaysPage() {
  const { state, currentUser, api, pushToast, busy } = useAppState();
  const isAdmin = currentUser.role === 'admin';

  const [editor, setEditor] = useState<Holiday | 'new' | null>(null);
  const [form, setForm] = useState({ name: '', date: todayISO(), description: '' });

  const upcoming = useMemo(() => state.holidays.filter((h) => h.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date)), [state.holidays]);
  const past = useMemo(() => state.holidays.filter((h) => h.date < todayISO()).sort((a, b) => b.date.localeCompare(a.date)), [state.holidays]);

  const openCreate = () => {
    setForm({ name: '', date: todayISO(), description: '' });
    setEditor('new');
  };
  const openEdit = (h: Holiday) => {
    setForm({ name: h.name, date: h.date, description: h.description ?? '' });
    setEditor(h);
  };
  const close = () => setEditor(null);

  const save = async () => {
    if (!form.name.trim() || !form.date) {
      pushToast({ tone: 'error', message: 'Name and date are required.' });
      return;
    }
    const payload = {
      name: form.name.trim(),
      date: form.date,
      description: form.description.trim() || undefined,
    };
    try {
      if (editor === 'new') {
        await api.addHoliday(currentUser.id, payload);
        pushToast({ tone: 'success', message: 'Holiday added.' });
      } else if (editor) {
        await api.updateHoliday(currentUser.id, editor.id, payload);
        pushToast({ tone: 'success', message: 'Holiday updated.' });
      }
      close();
    } catch {
      /* handled */
    }
  };

  const remove = async (h: Holiday) => {
    try {
      await api.removeHoliday(currentUser.id, h.id);
      pushToast({ tone: 'info', message: 'Holiday removed.' });
    } catch {
      /* handled */
    }
  };

  return (
    <>
      <PageHeader
        title="Company Holidays"
        description="Shared calendar of non-working days"
        breadcrumbs={['Admin', 'Holidays']}
        actions={isAdmin ? <Button size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add holiday</Button> : null}
      />

      <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        These seed holidays are illustrative, not an authoritative list. Admins should curate this calendar for the real company.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <HolidayList title="Upcoming" items={upcoming} isAdmin={isAdmin} onEdit={openEdit} onDelete={remove} />
        <HolidayList title="Past" items={past} isAdmin={isAdmin} onEdit={openEdit} onDelete={remove} />
      </div>

      <Dialog
        open={!!editor}
        onClose={close}
        title={editor === 'new' ? 'Add holiday' : 'Edit holiday'}
        footer={
          <>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={save} loading={busy} disabled={busy}>{editor === 'new' ? 'Add' : 'Save'}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label required>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label required>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <p className="text-xs text-slate-500">
            Changing holidays recomputes working-day counts on all pending and approved leave requests.
          </p>
        </div>
      </Dialog>
    </>
  );
}

function HolidayList({ title, items, isAdmin, onEdit, onDelete }: { title: string; items: Holiday[]; isAdmin: boolean; onEdit: (h: Holiday) => void; onDelete: (h: Holiday) => void }) {
  return (
    <Card>
      <CardBody>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">{title}</h2>
        {items.length === 0 ? (
          <EmptyState icon={<PartyPopper className="h-5 w-5" />} title={`No ${title.toLowerCase()} holidays`} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((h) => (
              <li key={h.id} className="flex items-start justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">{h.name}</p>
                  <p className="text-xs text-slate-500">{formatHuman(h.date)}</p>
                  {h.description ? <p className="mt-0.5 text-xs text-slate-500">{h.description}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="violet">Holiday</Badge>
                  {isAdmin ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => onEdit(h)} aria-label="Edit holiday">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDelete(h)} aria-label="Delete holiday">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

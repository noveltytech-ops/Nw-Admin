'use client';
import { useMemo, useState } from 'react';
import { Edit3, Plus, Search, UserMinus } from 'lucide-react';
import { useApp } from '@/shell/useApp';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { employeeService } from '@/services/employee.service';
import { formatHuman } from '@/utils/date';
import type { Employee, Role } from '@/types';

const AVATAR_COLORS = ['#2f5df0', '#9333ea', '#0f766e', '#ea580c', '#db2777', '#2563eb', '#0ea5e9', '#be123c', '#f59e0b', '#4338ca'];

export function OrganizationPage() {
  const { state, currentUser, api, pushToast } = useApp();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);

  const departments = useMemo(() => Array.from(new Set(state.employees.map((e) => e.department))).sort(), [state.employees]);
  const employees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.employees
      .filter((e) => (department === 'all' ? true : e.department === department))
      .filter(
        (e) =>
          q === ''
            ? true
            : `${e.firstName} ${e.lastName} ${e.email} ${e.designation} ${e.department}`.toLowerCase().includes(q),
      )
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [state.employees, search, department]);

  const selected = selectedId ? state.employees.find((e) => e.id === selectedId) ?? null : null;
  const isAdmin = currentUser.role === 'admin';

  const deactivate = async (emp: Employee) => {
    try {
      await api.deactivateEmployee(currentUser.id, emp.id);
      pushToast({ tone: 'info', message: `${emp.firstName} deactivated.` });
    } catch {
      /* handled */
    }
  };

  return (
    <>
      <PageHeader
        title="Organization"
        description="Directory of all employees and reporting lines"
        breadcrumbs={['People', 'Organization']}
        actions={
          isAdmin ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" /> Add employee
            </Button>
          ) : null
        }
      />

      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Name, email, designation" />
            </div>
          </div>
          <div>
            <Label htmlFor="dept">Department</Label>
            <Select id="dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="all">All</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-2">
          {employees.length === 0 ? (
            <EmptyState title="No employees match" description="Try widening the filters." />
          ) : (
            employees.map((emp) => {
              const manager = state.employees.find((e) => e.id === emp.managerId);
              return (
                <button
                  type="button"
                  key={emp.id}
                  onClick={() => setSelectedId(emp.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border bg-white px-4 py-3 text-left shadow-card hover:border-brand-300 ${
                    selectedId === emp.id ? 'border-brand-400 ring-1 ring-brand-200' : 'border-slate-200'
                  }`}
                >
                  <Avatar firstName={emp.firstName} lastName={emp.lastName} color={emp.avatarColor} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {emp.firstName} {emp.lastName} {!emp.active && <span className="ml-1 text-xs text-slate-400">(inactive)</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {emp.designation} · {emp.department}
                      {manager ? <> · reports to {manager.firstName} {manager.lastName}</> : ' · no manager'}
                    </p>
                  </div>
                  <Badge tone={emp.role === 'admin' ? 'brand' : emp.role === 'manager' ? 'violet' : 'neutral'}>{emp.role}</Badge>
                </button>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          {selected ? (
            <EmployeeProfile employee={selected} onEdit={() => setEditing(selected)} onDeactivate={() => deactivate(selected)} />
          ) : (
            <Card>
              <CardBody>
                <EmptyState title="Select an employee" description="Pick a person from the list to see their profile." />
              </CardBody>
            </Card>
          )}

          <ReportingTree />
        </div>
      </div>

      <EmployeeFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        existing={null}
      />
      <EmployeeFormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        existing={editing}
      />
    </>
  );
}

function EmployeeProfile({ employee, onEdit, onDeactivate }: { employee: Employee; onEdit: () => void; onDeactivate: () => void }) {
  const { state, currentUser } = useApp();
  const manager = state.employees.find((e) => e.id === employee.managerId);
  const reports = employeeService.reports(state, employee.id);
  const isAdmin = currentUser.role === 'admin';
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar firstName={employee.firstName} lastName={employee.lastName} color={employee.avatarColor} size="lg" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-sm text-slate-500">{employee.designation}</p>
          </div>
        </div>
        <Badge tone={employee.role === 'admin' ? 'brand' : employee.role === 'manager' ? 'violet' : 'neutral'}>{employee.role}</Badge>
      </CardHeader>
      <CardBody className="space-y-3 text-sm">
        <dl className="grid grid-cols-3 gap-y-2">
          <dt className="col-span-1 text-slate-500">Email</dt>
          <dd className="col-span-2 text-slate-800">{employee.email}</dd>
          <dt className="col-span-1 text-slate-500">Department</dt>
          <dd className="col-span-2 text-slate-800">{employee.department}</dd>
          <dt className="col-span-1 text-slate-500">Manager</dt>
          <dd className="col-span-2 text-slate-800">
            {manager ? `${manager.firstName} ${manager.lastName}` : 'No manager assigned'}
          </dd>
          <dt className="col-span-1 text-slate-500">Joined</dt>
          <dd className="col-span-2 text-slate-800">{formatHuman(employee.joiningDate)}</dd>
          <dt className="col-span-1 text-slate-500">Status</dt>
          <dd className="col-span-2 text-slate-800">
            {employee.active ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
          </dd>
        </dl>
        {reports.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Direct reports</p>
            <ul className="divide-y divide-slate-100">
              {reports.map((r) => (
                <li key={r.id} className="flex items-center gap-2 py-1.5">
                  <Avatar firstName={r.firstName} lastName={r.lastName} color={r.avatarColor} size="sm" />
                  <span className="text-sm text-slate-700">
                    {r.firstName} {r.lastName}
                  </span>
                  <span className="ml-auto text-xs text-slate-500">{r.designation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {isAdmin ? (
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </Button>
            {employee.active && employee.id !== currentUser.id ? (
              <Button size="sm" variant="danger" onClick={onDeactivate}>
                <UserMinus className="h-3.5 w-3.5" /> Deactivate
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

function ReportingTree() {
  const { state } = useApp();
  const roots = state.employees.filter((e) => e.active && !e.managerId);
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Reporting hierarchy</CardTitle>
          <CardDescription>Simplified org tree</CardDescription>
        </div>
      </CardHeader>
      <CardBody className="space-y-2">
        {roots.map((root) => (
          <TreeNode key={root.id} node={root} depth={0} />
        ))}
      </CardBody>
    </Card>
  );
}

function TreeNode({ node, depth }: { node: Employee; depth: number }) {
  const { state } = useApp();
  const kids = employeeService.reports(state, node.id).filter((e) => e.active);
  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <div className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
        <Avatar firstName={node.firstName} lastName={node.lastName} color={node.avatarColor} size="sm" />
        <span className="font-medium text-slate-800">
          {node.firstName} {node.lastName}
        </span>
        <span className="text-xs text-slate-500">· {node.designation}</span>
      </div>
      {kids.map((k) => (
        <TreeNode key={k.id} node={k} depth={depth + 1} />
      ))}
    </div>
  );
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  managerId: string | null;
  joiningDate: string;
  role: Role;
  active: boolean;
  avatarColor: string;
}

function EmployeeFormDialog({ open, onClose, existing }: { open: boolean; onClose: () => void; existing: Employee | null }) {
  const { state, currentUser, api, pushToast, busy } = useApp();
  const [form, setForm] = useState<FormState>(() => defaultForm(existing));
  const [cycleWarn, setCycleWarn] = useState('');

  // Reset on open
  useMemoReset(open, existing, (next) => setForm(defaultForm(next)));

  const title = existing ? 'Edit employee' : 'Add employee';

  const validateManager = (newManagerId: string | null) => {
    if (!existing) {
      setCycleWarn('');
      return;
    }
    if (employeeService.wouldCreateCycle(state, existing.id, newManagerId)) {
      setCycleWarn('Choosing that manager would create a reporting cycle.');
    } else {
      setCycleWarn('');
    }
  };

  const submit = async () => {
    const trimmedEmail = form.email.trim();
    if (!form.firstName.trim() || !trimmedEmail) {
      pushToast({ tone: 'error', message: 'First name and email are required.' });
      return;
    }
    if (cycleWarn) {
      pushToast({ tone: 'error', message: cycleWarn });
      return;
    }
    try {
      if (existing) {
        await api.updateEmployee(currentUser.id, existing.id, { ...form, email: trimmedEmail });
        pushToast({ tone: 'success', message: 'Employee updated.' });
      } else {
        await api.createEmployee(currentUser.id, { ...form, email: trimmedEmail });
        pushToast({ tone: 'success', message: 'Employee added.' });
      }
      onClose();
    } catch {
      /* handled */
    }
  };

  const managerOptions = state.employees.filter((e) =>
    existing ? e.id !== existing.id && !employeeService.wouldCreateCycle(state, existing.id, e.id) : true,
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={busy}>{existing ? 'Save' : 'Create'}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label required>First name</Label>
          <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </div>
        <div>
          <Label>Last name</Label>
          <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Label required>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label>Department</Label>
          <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </div>
        <div>
          <Label>Designation</Label>
          <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
        <div>
          <Label>Manager</Label>
          <Select
            value={form.managerId ?? ''}
            onChange={(e) => {
              const v = e.target.value || null;
              setForm({ ...form, managerId: v });
              validateManager(v);
            }}
          >
            <option value="">None</option>
            {managerOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} · {m.designation}
              </option>
            ))}
          </Select>
          <FieldError>{cycleWarn}</FieldError>
        </div>
        <div>
          <Label>Joining date</Label>
          <Input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
        </div>
        <div>
          <Label>Avatar color</Label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, avatarColor: c })}
                className={`h-7 w-7 rounded-full border-2 ${form.avatarColor === c ? 'border-slate-900' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
                aria-label={`Choose color ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            Active
          </label>
        </div>
      </div>
      {!existing ? (
        <p className="mt-4 text-xs text-slate-500">
          Demo-only: adding an employee seeds default leave balances. No real account is created and no email is sent.
        </p>
      ) : (
        <div className="mt-4">
          <Label>Internal note</Label>
          <Textarea placeholder="For your reference only" disabled />
        </div>
      )}
    </Dialog>
  );
}

function defaultForm(existing: Employee | null): FormState {
  if (existing) {
    return {
      firstName: existing.firstName,
      lastName: existing.lastName,
      email: existing.email,
      department: existing.department,
      designation: existing.designation,
      managerId: existing.managerId,
      joiningDate: existing.joiningDate,
      role: existing.role,
      active: existing.active,
      avatarColor: existing.avatarColor,
    };
  }
  return {
    firstName: '',
    lastName: '',
    email: '',
    department: 'Engineering',
    designation: '',
    managerId: null,
    joiningDate: new Date().toISOString().slice(0, 10),
    role: 'employee',
    active: true,
    avatarColor: AVATAR_COLORS[0],
  };
}

import { useEffect } from 'react';
function useMemoReset<T>(open: boolean, dep: T, cb: (dep: T) => void) {
  useEffect(() => {
    if (open) cb(dep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dep]);
}

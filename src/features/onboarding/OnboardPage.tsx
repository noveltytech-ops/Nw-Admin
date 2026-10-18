'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { useApp } from '@/shell/useApp';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldError, FieldHint, Input, Label, Select } from '@/components/ui/Input';
import { employeeService } from '@/services/employee.service';
import { todayISO } from '@/utils/date';
import type { Role } from '@/types';

const EMAIL_DOMAIN = 'noveltywealth.in';
const AVATAR_COLORS = [
  '#2f5df0', '#9333ea', '#0f766e', '#ea580c', '#db2777', '#2563eb',
  '#0ea5e9', '#be123c', '#f59e0b', '#4338ca', '#059669', '#c026d3',
  '#dc2626', '#0891b2', '#7c3aed',
];

interface FormState {
  firstName: string;
  lastName: string;
  emailPrefix: string;
  department: string;
  designation: string;
  managerId: string;
  joiningDate: string;
  role: Role;
  avatarColor: string;
}

function buildDefaultForm(managerDefault: string): FormState {
  return {
    firstName: '',
    lastName: '',
    emailPrefix: '',
    department: '',
    designation: '',
    managerId: managerDefault,
    joiningDate: todayISO(),
    role: 'employee',
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  };
}

export function OnboardPage() {
  const router = useRouter();
  const { state, currentUser, api, pushToast, busy } = useApp();
  const isAdmin = currentUser.role === 'admin';
  // Managers can only onboard employees into their own team; admins can pick anyone.
  const defaultManager = isAdmin ? '' : currentUser.id;

  const [form, setForm] = useState<FormState>(() => buildDefaultForm(defaultManager));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const departments = useMemo(
    () => Array.from(new Set(state.employees.map((e) => e.department))).sort(),
    [state.employees],
  );

  const managerOptions = useMemo(() => {
    if (!isAdmin) return [];
    return state.employees
      .filter(
        (e) => e.active && (e.role === 'lead' || e.role === 'manager' || e.role === 'admin'),
      )
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [state.employees, isAdmin]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const email = form.emailPrefix.trim().toLowerCase()
    ? `${form.emailPrefix.trim().toLowerCase()}@${EMAIL_DOMAIN}`
    : '';

  const duplicateEmail =
    email && state.employees.some((e) => e.email.toLowerCase() === email);

  const canSubmit =
    !!form.firstName.trim() &&
    !!form.emailPrefix.trim() &&
    !!form.department.trim() &&
    !!form.designation.trim() &&
    !!form.managerId &&
    !!form.joiningDate &&
    !duplicateEmail &&
    !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!form.emailPrefix.trim() || !/^[a-z0-9._-]+$/i.test(form.emailPrefix.trim())) {
      setError('Enter a valid email prefix (letters, numbers, dots, hyphens, underscores)');
      return;
    }
    if (duplicateEmail) {
      setError(`An employee with ${email} already exists`);
      return;
    }
    if (!form.department.trim() || !form.designation.trim()) {
      setError('Department and designation are required');
      return;
    }
    if (!form.managerId) {
      setError('Pick a reporting manager');
      return;
    }

    try {
      await api.createEmployee(currentUser.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        department: form.department.trim(),
        designation: form.designation.trim(),
        managerId: form.managerId,
        joiningDate: form.joiningDate,
        role: isAdmin ? form.role : 'employee',
        active: true,
        avatarColor: form.avatarColor,
      });
      const name = `${form.firstName.trim()}${form.lastName.trim() ? ` ${form.lastName.trim()}` : ''}`;
      pushToast({
        tone: 'success',
        message: `${name} added. They can now sign up at /signup with ${email}.`,
      });
      setSuccess(`${name} added. They can now sign up with ${email}.`);
      setForm(buildDefaultForm(defaultManager));
    } catch {
      /* toast surfaced by store */
    }
  };

  const selectedManager =
    !isAdmin
      ? currentUser
      : employeeService.byId(state, form.managerId) ?? null;

  return (
    <>
      <PageHeader
        title="Add Employee"
        description={
          isAdmin
            ? 'Create an employee record. They can then sign up with their work email.'
            : 'Add a new teammate who reports to you. They can then sign up with their work email.'
        }
        breadcrumbs={['People', 'Add Employee']}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>New employee</CardTitle>
              <CardDescription>Required fields are marked *</CardDescription>
            </div>
            <UserPlus className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardBody>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label required>First name</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Last name</Label>
                <Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
              </div>

              <div className="sm:col-span-2">
                <Label required>Work email</Label>
                <div className="flex items-stretch rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
                  <input
                    type="text"
                    value={form.emailPrefix}
                    onChange={(e) => update('emailPrefix', e.target.value)}
                    placeholder="firstname.lastname"
                    className="min-w-0 flex-1 rounded-l-md bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    required
                  />
                  <span className="flex items-center border-l border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 rounded-r-md">
                    @{EMAIL_DOMAIN}
                  </span>
                </div>
                {duplicateEmail ? (
                  <FieldError>An employee with {email} already exists</FieldError>
                ) : email ? (
                  <FieldHint>Signup email: {email}</FieldHint>
                ) : (
                  <FieldHint>Only the local part — the @{EMAIL_DOMAIN} suffix is fixed</FieldHint>
                )}
              </div>

              <div>
                <Label required>Department</Label>
                {departments.length > 0 ? (
                  <>
                    <Input
                      list="dept-options"
                      value={form.department}
                      onChange={(e) => update('department', e.target.value)}
                      placeholder="e.g. Tech"
                      required
                    />
                    <datalist id="dept-options">
                      {departments.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                    <FieldHint>Pick existing or type a new one</FieldHint>
                  </>
                ) : (
                  <Input
                    value={form.department}
                    onChange={(e) => update('department', e.target.value)}
                    required
                  />
                )}
              </div>
              <div>
                <Label required>Designation</Label>
                <Input
                  value={form.designation}
                  onChange={(e) => update('designation', e.target.value)}
                  placeholder="e.g. Software Engineer"
                  required
                />
              </div>

              <div>
                <Label required>Reports to</Label>
                {isAdmin ? (
                  <Select
                    value={form.managerId}
                    onChange={(e) => update('managerId', e.target.value)}
                    required
                  >
                    <option value="">— choose —</option>
                    {managerOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName}
                        {m.lastName ? ` ${m.lastName}` : ''} · {m.designation}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    value={`${currentUser.firstName}${currentUser.lastName ? ` ${currentUser.lastName}` : ''} (you)`}
                    disabled
                    readOnly
                  />
                )}
                {!isAdmin ? (
                  <FieldHint>Managers can only onboard direct reports</FieldHint>
                ) : null}
              </div>
              <div>
                <Label required>Joining date</Label>
                <Input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => update('joiningDate', e.target.value)}
                  required
                />
              </div>

              {isAdmin ? (
                <div>
                  <Label>Role</Label>
                  <Select value={form.role} onChange={(e) => update('role', e.target.value as Role)}>
                    <option value="employee">Employee</option>
                    <option value="lead">Team Lead</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
              ) : null}

              <div className={isAdmin ? '' : 'sm:col-span-2'}>
                <Label>Avatar color</Label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update('avatarColor', c)}
                      className={`h-7 w-7 rounded-full border-2 ${form.avatarColor === c ? 'border-slate-900' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Choose color ${c}`}
                    />
                  ))}
                </div>
              </div>

              {error ? (
                <div className="sm:col-span-2">
                  <FieldError>{error}</FieldError>
                </div>
              ) : null}
              {success ? (
                <div className="sm:col-span-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {success}
                </div>
              ) : null}

              <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => router.push('/organization')}>
                  View organization
                </Button>
                <Button type="submit" loading={busy} disabled={!canSubmit}>
                  Add employee
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>What happens next</CardTitle>
                <CardDescription>How onboarding works</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="space-y-3 text-sm text-slate-700">
              <ol className="list-decimal space-y-2 pl-5">
                <li>Record is created in HR records right away.</li>
                <li>
                  The new hire goes to <code className="rounded bg-slate-100 px-1 text-xs">/signup</code> and
                  enters their email prefix + a password.
                </li>
                <li>Supabase creates their auth account; they're redirected to the dashboard.</li>
                <li>
                  Their default leave balances are pre-filled from the configured leave types.
                </li>
              </ol>
            </CardBody>
          </Card>

          {selectedManager ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Approval chain</CardTitle>
                  <CardDescription>Who signs off this hire's requests</CardDescription>
                </div>
              </CardHeader>
              <CardBody className="text-sm text-slate-700">
                <p>
                  Leave + WFH requests from this hire will route to{' '}
                  <strong>
                    {selectedManager.firstName}
                    {selectedManager.lastName ? ` ${selectedManager.lastName}` : ''}
                  </strong>{' '}
                  <span className="text-slate-500">· {selectedManager.designation}</span>.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Admins can see and approve requests for anyone.
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

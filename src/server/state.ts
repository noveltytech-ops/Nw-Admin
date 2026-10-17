import {
  SEED_EMPLOYEES,
  SEED_HOLIDAYS,
  SEED_LEAVE_POLICY,
  SEED_LEAVE_REQUESTS,
  SEED_LEAVE_TYPES,
  SEED_POLICY,
  SEED_WFH_REQUESTS,
} from '@/data/seed-data';
import type { AppState } from '@/services/storage.service';
import { DATA_VERSION } from '@/services/storage.service';
import type {
  AuditEvent,
  Employee,
  Holiday,
  LeavePolicy,
  LeaveRequest,
  LeaveTypeConfig,
  Role,
  WFHRequest,
  Weekday,
  WorkPolicy,
} from '@/types';
import { createServiceClient } from './db';

type Supa = ReturnType<typeof createServiceClient>;

// ---------- row ↔ model mappers ----------
const toEmployee = (r: any): Employee => ({
  id: r.id,
  firstName: r.first_name ?? '',
  lastName: r.last_name ?? '',
  email: r.email,
  department: r.department,
  designation: r.designation,
  managerId: r.manager_id ?? null,
  joiningDate: r.joining_date,
  active: !!r.active,
  role: r.role as Role,
  avatarColor: r.avatar_color,
  balances: [],
});
const employeeRow = (e: Employee) => ({
  id: e.id,
  first_name: e.firstName,
  last_name: e.lastName,
  email: e.email,
  department: e.department,
  designation: e.designation,
  manager_id: e.managerId,
  joining_date: e.joiningDate,
  active: e.active,
  role: e.role,
  avatar_color: e.avatarColor,
});

const toLeaveType = (r: any): LeaveTypeConfig => ({
  id: r.id,
  code: r.code,
  name: r.name,
  color: r.color,
  defaultAnnualQuota: Number(r.default_annual_quota),
  allowHalfDay: !!r.allow_half_day,
  allowNegativeBalance: !!r.allow_negative_balance,
  maxNegativeBalance: Number(r.max_negative_balance),
  accrual: r.accrual as 'yearly' | 'quarterly',
  description: r.description ?? undefined,
});
const leaveTypeRow = (t: LeaveTypeConfig) => ({
  id: t.id,
  code: t.code,
  name: t.name,
  color: t.color,
  default_annual_quota: t.defaultAnnualQuota,
  allow_half_day: t.allowHalfDay,
  allow_negative_balance: t.allowNegativeBalance,
  max_negative_balance: t.maxNegativeBalance,
  accrual: t.accrual,
  description: t.description ?? null,
});

const toLeaveRequest = (r: any): LeaveRequest => ({
  id: r.id,
  employeeId: r.employee_id,
  leaveTypeId: r.leave_type_id,
  startDate: r.start_date,
  endDate: r.end_date,
  halfDay: (r.half_day ?? null) as LeaveRequest['halfDay'],
  workingDays: Number(r.working_days),
  reason: r.reason ?? '',
  status: r.status,
  submittedAt: r.submitted_at,
  decidedAt: r.decided_at ?? undefined,
  decidedBy: r.decided_by ?? undefined,
  reviewerComment: r.reviewer_comment ?? undefined,
});
const leaveRequestRow = (r: LeaveRequest) => ({
  id: r.id,
  employee_id: r.employeeId,
  leave_type_id: r.leaveTypeId,
  start_date: r.startDate,
  end_date: r.endDate,
  half_day: r.halfDay,
  working_days: r.workingDays,
  reason: r.reason ?? '',
  status: r.status,
  submitted_at: r.submittedAt,
  decided_at: r.decidedAt ?? null,
  decided_by: r.decidedBy ?? null,
  reviewer_comment: r.reviewerComment ?? null,
});

const toWFHRequest = (r: any): WFHRequest => ({
  id: r.id,
  employeeId: r.employee_id,
  date: r.date,
  reason: r.reason ?? '',
  status: r.status,
  submittedAt: r.submitted_at,
  decidedAt: r.decided_at ?? undefined,
  decidedBy: r.decided_by ?? undefined,
  reviewerComment: r.reviewer_comment ?? undefined,
});
const wfhRequestRow = (r: WFHRequest) => ({
  id: r.id,
  employee_id: r.employeeId,
  date: r.date,
  reason: r.reason ?? '',
  status: r.status,
  submitted_at: r.submittedAt,
  decided_at: r.decidedAt ?? null,
  decided_by: r.decidedBy ?? null,
  reviewer_comment: r.reviewerComment ?? null,
});

const toHoliday = (r: any): Holiday => ({
  id: r.id,
  name: r.name,
  date: r.date,
  description: r.description ?? undefined,
});
const holidayRow = (h: Holiday) => ({
  id: h.id,
  name: h.name,
  date: h.date,
  description: h.description ?? null,
});

const toWorkPolicy = (r: any): WorkPolicy => ({
  workMode: r.work_mode as Record<Weekday, 'office' | 'wfh' | 'off'>,
  effectiveFrom: r.effective_from,
  updatedAt: r.updated_at,
  updatedBy: r.updated_by ?? '',
});
const workPolicyRow = (p: WorkPolicy) => ({
  id: 1,
  work_mode: p.workMode,
  effective_from: p.effectiveFrom,
  updated_at: new Date().toISOString(),
  updated_by: p.updatedBy || null,
});

const toLeavePolicy = (r: any): LeavePolicy => ({
  leaveYearStartMonth: 1,
  maxCarryForward: Number(r.max_carry_forward),
  excessCarryForwardTreatment: r.excess_carry_forward_treatment,
  qEndNegativeAllowance: Number(r.q_end_negative_allowance),
  q4NegativeTreatment: r.q4_negative_treatment,
  halfDayRequiresManagerApproval: !!r.half_day_requires_manager_approval,
  retrospectiveLeaveTreatment: r.retrospective_leave_treatment,
});
const leavePolicyRow = (p: LeavePolicy) => ({
  id: 1,
  leave_year_start_month: p.leaveYearStartMonth ?? 1,
  max_carry_forward: p.maxCarryForward,
  excess_carry_forward_treatment: p.excessCarryForwardTreatment,
  q_end_negative_allowance: p.qEndNegativeAllowance,
  q4_negative_treatment: p.q4NegativeTreatment,
  half_day_requires_manager_approval: p.halfDayRequiresManagerApproval,
  retrospective_leave_treatment: p.retrospectiveLeaveTreatment,
  updated_at: new Date().toISOString(),
});

const toAudit = (r: any): AuditEvent => ({
  id: r.id,
  entityId: r.entity_id,
  action: r.action,
  actorId: r.actor_id ?? '',
  at: r.at,
  note: r.note ?? undefined,
});
const auditRow = (a: AuditEvent) => ({
  id: a.id,
  entity_id: a.entityId,
  action: a.action,
  actor_id: a.actorId || null,
  at: a.at,
  note: a.note ?? null,
});

// ---------- helpers ----------
async function orThrow<T>(res: { data: T; error: any }, label: string): Promise<T> {
  if (res.error) {
    throw new Error(`[supabase:${label}] ${res.error.message || res.error}`);
  }
  return res.data;
}

async function syncArrayById<T extends { id: string }>(
  supa: Supa,
  table: string,
  rows: T[],
) {
  if (rows.length > 0) {
    const { error } = await supa.from(table).upsert(rows as any);
    if (error) throw new Error(`[supabase:${table}.upsert] ${error.message}`);
  }
  const { data: existing, error: readErr } = await supa.from(table).select('id');
  if (readErr) throw new Error(`[supabase:${table}.select] ${readErr.message}`);
  const keep = new Set(rows.map((r) => r.id));
  const toDelete = (existing ?? []).map((r: any) => r.id).filter((id: string) => !keep.has(id));
  if (toDelete.length) {
    const { error } = await supa.from(table).delete().in('id', toDelete);
    if (error) throw new Error(`[supabase:${table}.delete] ${error.message}`);
  }
}

// ---------- load full state ----------
export async function loadState(): Promise<AppState> {
  const supa = createServiceClient();
  const [emps, types, bals, lrs, wfhs, hols, work, lp, audit] = await Promise.all([
    supa.from('employees').select('*'),
    supa.from('leave_types').select('*'),
    supa.from('leave_balances').select('*'),
    supa.from('leave_requests').select('*').order('submitted_at', { ascending: false }),
    supa.from('wfh_requests').select('*').order('submitted_at', { ascending: false }),
    supa.from('holidays').select('*').order('date', { ascending: true }),
    supa.from('work_policy').select('*').eq('id', 1).maybeSingle(),
    supa.from('leave_policy').select('*').eq('id', 1).maybeSingle(),
    supa.from('audit_events').select('*').order('at', { ascending: false }).limit(500),
  ]);

  const empRows = await orThrow(emps, 'employees');
  const typeRows = await orThrow(types, 'leave_types');
  const balRows = await orThrow(bals, 'leave_balances');
  const lrRows = await orThrow(lrs, 'leave_requests');
  const wfhRows = await orThrow(wfhs, 'wfh_requests');
  const holRows = await orThrow(hols, 'holidays');
  const workRow = await orThrow(work, 'work_policy');
  const lpRow = await orThrow(lp, 'leave_policy');
  const auditRows = await orThrow(audit, 'audit_events');

  const employees: Employee[] = (empRows ?? []).map((r: any) => {
    const emp = toEmployee(r);
    emp.balances = (balRows ?? [])
      .filter((b: any) => b.employee_id === r.id)
      .map((b: any) => ({
        leaveTypeId: b.leave_type_id,
        allocated: Number(b.allocated),
        used: Number(b.used),
      }));
    return emp;
  });

  const state: AppState = {
    version: DATA_VERSION,
    employees,
    leaveTypes: (typeRows ?? []).map(toLeaveType),
    leaveRequests: (lrRows ?? []).map(toLeaveRequest),
    wfhRequests: (wfhRows ?? []).map(toWFHRequest),
    holidays: (holRows ?? []).map(toHoliday),
    policy: workRow ? toWorkPolicy(workRow) : SEED_POLICY,
    leavePolicy: lpRow ? toLeavePolicy(lpRow) : SEED_LEAVE_POLICY,
    audit: (auditRows ?? []).map(toAudit),
  };

  // Autoseed if the DB is empty (no employees means fresh database).
  if (state.employees.length === 0 && state.leaveTypes.length === 0) {
    console.warn('[server/state] empty database, running autoseed');
    const seed = buildSeedState();
    await saveState(seed);
    return seed;
  }

  return state;
}

// ---------- save full state ----------
export async function saveState(state: AppState): Promise<void> {
  const supa = createServiceClient();

  // Employees first (FK targets).
  await syncArrayById(supa, 'employees', state.employees.map(employeeRow));

  // Leave types (also FK target for balances & requests).
  await syncArrayById(supa, 'leave_types', state.leaveTypes.map(leaveTypeRow));

  // Balances — composite key (employee_id, leave_type_id).
  const balanceRows = state.employees.flatMap((e) =>
    e.balances.map((b) => ({
      employee_id: e.id,
      leave_type_id: b.leaveTypeId,
      allocated: b.allocated,
      used: b.used,
    })),
  );
  if (balanceRows.length) {
    const { error } = await supa
      .from('leave_balances')
      .upsert(balanceRows, { onConflict: 'employee_id,leave_type_id' });
    if (error) throw new Error(`[supabase:leave_balances.upsert] ${error.message}`);
  }

  // Transactional rows.
  await Promise.all([
    syncArrayById(supa, 'leave_requests', state.leaveRequests.map(leaveRequestRow)),
    syncArrayById(supa, 'wfh_requests', state.wfhRequests.map(wfhRequestRow)),
    syncArrayById(supa, 'holidays', state.holidays.map(holidayRow)),
  ]);

  // Singletons.
  const { error: wpErr } = await supa.from('work_policy').upsert(workPolicyRow(state.policy));
  if (wpErr) throw new Error(`[supabase:work_policy.upsert] ${wpErr.message}`);
  const { error: lpErr } = await supa.from('leave_policy').upsert(leavePolicyRow(state.leavePolicy));
  if (lpErr) throw new Error(`[supabase:leave_policy.upsert] ${lpErr.message}`);

  // Audit events are append-only — upsert without delete-sync.
  if (state.audit.length) {
    const { error } = await supa.from('audit_events').upsert(state.audit.map(auditRow));
    if (error) throw new Error(`[supabase:audit_events.upsert] ${error.message}`);
  }
}

// ---------- reset ----------
function buildSeedState(): AppState {
  return JSON.parse(
    JSON.stringify({
      version: DATA_VERSION,
      employees: SEED_EMPLOYEES,
      leaveTypes: SEED_LEAVE_TYPES,
      leaveRequests: SEED_LEAVE_REQUESTS,
      wfhRequests: SEED_WFH_REQUESTS,
      holidays: SEED_HOLIDAYS,
      policy: SEED_POLICY,
      leavePolicy: SEED_LEAVE_POLICY,
      audit: [],
    }),
  );
}

export async function resetState(): Promise<AppState> {
  const seed = buildSeedState();
  // Wipe transactional + policy history first so stale FK refs don't block us.
  const supa = createServiceClient();
  await supa.from('audit_events').delete().neq('id', '');
  await supa.from('leave_requests').delete().neq('id', '');
  await supa.from('wfh_requests').delete().neq('id', '');
  // Then full save (which syncs employees, types, holidays, balances, policies).
  await saveState(seed);
  return seed;
}

// ---------- generic mutation runner (keeps the service-function pattern intact) ----------
export async function withState<T extends { state: AppState } | AppState>(
  mutator: (s: AppState) => T,
): Promise<AppState> {
  const current = await loadState();
  const result = mutator(current);
  const next = (
    typeof result === 'object' && result !== null && 'state' in result ? result.state : result
  ) as AppState;
  await saveState(next);
  return next;
}

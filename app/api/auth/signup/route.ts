import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createServiceClient } from '@/server/db';

export const runtime = 'nodejs';

const EMAIL_DOMAIN = 'noveltywealth.in';

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = (body.email ?? '').toLowerCase().trim();
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }
  if (!email.endsWith(`@${EMAIL_DOMAIN}`)) {
    return NextResponse.json(
      { error: `Email must end with @${EMAIL_DOMAIN}` },
      { status: 403 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !serviceKey) {
    return NextResponse.json(
      {
        error:
          'Signup requires SUPABASE_SERVICE_ROLE_KEY on the server. Add it to .env.local (and Vercel env).',
      },
      { status: 500 },
    );
  }

  // 1. Look up the employee record using the service client (bypasses RLS).
  //    Case-insensitive match on email.
  const service = createServiceClient();
  const { data: emp, error: empErr } = await service
    .from('employees')
    .select('id, email, active')
    .ilike('email', email)
    .maybeSingle();
  if (empErr) {
    return NextResponse.json({ error: empErr.message }, { status: 500 });
  }
  if (!emp) {
    return NextResponse.json(
      { error: 'No employee is registered with this email. Contact an admin.' },
      { status: 403 },
    );
  }
  if (!emp.active) {
    return NextResponse.json({ error: 'Employee account is inactive' }, { status: 403 });
  }

  // 2. Create the Supabase Auth user via the admin API (auto-confirms email).
  const admin = createSupabaseAdmin(supaUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Pre-check: has anyone already signed up with this email?
  const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const alreadyExists = existing?.users?.some(
    (u) => (u.email ?? '').toLowerCase() === email,
  );
  if (alreadyExists) {
    return NextResponse.json(
      { error: 'An account already exists for this email. Try signing in.' },
      { status: 409 },
    );
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { employeeId: emp.id as string },
  });
  if (createErr) {
    return NextResponse.json({ error: createErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email,
    userId: created.user?.id ?? null,
  });
}

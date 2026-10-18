'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { http } from '@/lib/axios';
import { createClient } from '@/utils/supabase/client';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldError, FieldHint, Input, Label } from '@/components/ui/Input';

const EMAIL_DOMAIN = 'noveltywealth.in';

export default function SignupPage() {
  const router = useRouter();
  const [prefix, setPrefix] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = `${prefix.trim().toLowerCase()}@${EMAIL_DOMAIN}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const localPart = prefix.trim();
    if (!localPart) {
      setError('Enter the part of your email before @');
      return;
    }
    if (!/^[a-z0-9._-]+$/i.test(localPart)) {
      setError('Email prefix can only contain letters, numbers, dots, hyphens and underscores');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setBusy(true);
    try {
      await http.post('/api/auth/signup', { email, password });
      // Auto-login after signup
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw new Error(signInErr.message);
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Only employees already in HR records can sign up</CardDescription>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email-prefix" required>
              Work email
            </Label>
            <div className="flex items-stretch rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
              <input
                id="email-prefix"
                type="text"
                autoComplete="username"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="firstname"
                className="min-w-0 flex-1 rounded-l-md bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                required
                autoFocus
              />
              <span className="flex items-center border-l border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 rounded-r-md">
                @{EMAIL_DOMAIN}
              </span>
            </div>
            <FieldHint>
              Your HR-registered work email. The @{EMAIL_DOMAIN} suffix is fixed.
            </FieldHint>
          </div>

          <div>
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <FieldHint>At least 8 characters</FieldHint>
          </div>

          <div>
            <Label htmlFor="confirm" required>
              Confirm password
            </Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error ? <FieldError>{error}</FieldError> : null}

          <Button type="submit" className="w-full" loading={busy} disabled={busy}>
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

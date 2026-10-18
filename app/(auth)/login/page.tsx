'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label } from '@/components/ui/Input';
import { createClient } from '@/utils/supabase/client';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const nextUrl = search.get('next') || '/dashboard';
  const initialError = search.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === 'no-employee-match'
      ? 'Signed-in account has no matching employee record. Contact an admin.'
      : null,
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setError(signInErr.message);
        setBusy(false);
        return;
      }
      router.replace(nextUrl);
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
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to the Novelty Wealth people portal</CardDescription>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email" required>
              Work email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@noveltywealth.in"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <FieldError>{error}</FieldError> : null}
          <Button type="submit" className="w-full" loading={busy} disabled={busy}>
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          First time here?{' '}
          <Link href="/signup" className="font-medium text-brand-600 hover:underline">
            Create an account
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card><CardBody>Loading…</CardBody></Card>}>
      <LoginForm />
    </Suspense>
  );
}

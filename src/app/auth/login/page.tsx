'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Spade } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl');
  const callbackUrl =
    rawCallback &&
    rawCallback.startsWith('/') &&
    !rawCallback.startsWith('//') &&
    !rawCallback.startsWith('/\\') &&
    /^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/.test(rawCallback)
      ? rawCallback
      : '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] animate-fade-in">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-[0_0_24px_rgba(249,115,22,0.4)]">
            <Spade className="h-6 w-6 text-white" />
          </div>
          <p className="font-display text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            PokerPay
          </p>
        </div>

        <Card className="border-border/60 bg-card shadow-2xl">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-2xl font-extrabold tracking-tight">Welcome Back</CardTitle>
            <CardDescription>Sign in to your PokerPay account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <span className="text-sm">⚠ {error}</span>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:text-orange-400 no-underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="spinner" />
                    Signing in…
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-primary">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

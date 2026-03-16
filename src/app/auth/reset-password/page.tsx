'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Spade, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!tokenFromUrl) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromUrl, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenFromUrl) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <Card className="border-border/60 bg-card shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-extrabold">Reset Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <span className="text-sm">
                  ⚠ Invalid or missing reset link. Please use the link from your email, or{' '}
                  <Link href="/auth/forgot-password">request a new one</Link>.
                </span>
              </Alert>
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/auth/login" className="font-semibold text-primary">Back to Sign in</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] animate-fade-in">
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
            <CardTitle className="text-2xl font-extrabold tracking-tight">Set New Password</CardTitle>
            <CardDescription>Enter your new password below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <span className="text-sm">⚠ {error}</span>
              </Alert>
            )}

            {success ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Password reset successfully! Redirecting to sign in…
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="spinner" />
                      Resetting…
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}

            <p className="text-center text-xs text-muted-foreground">
              <Link href="/auth/login" className="font-semibold text-primary">Back to Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

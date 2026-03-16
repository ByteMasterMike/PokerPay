'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Spade, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <CardTitle className="text-2xl font-extrabold tracking-tight">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send a reset link.
            </CardDescription>
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
                  <MailCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  If an account exists with that email, you&apos;ll receive a reset link. Check your inbox and spam folder. The link expires in 1 hour.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="spinner" />
                      Sending…
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Remember your password?{' '}
              <Link href="/auth/login" className="font-semibold text-primary">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

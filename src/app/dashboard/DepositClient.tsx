'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DepositClient({ currentBalance }: { currentBalance: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDeposit = async () => {
    if (amount <= 0) {
      setError('Amount must be greater than $0');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process deposit');
      setSuccess(`Successfully deposited $${amount}.`);
      setAmount(100);
      router.refresh();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" />
              Add Funds
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Instantly fund your PokerPay wallet</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Wallet Balance</p>
            <p className="font-mono text-xl font-extrabold text-primary">
              ${currentBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error  && <Alert variant="destructive" className="py-2 text-xs">{error}</Alert>}
        {success && <Alert variant="success"    className="py-2 text-xs">{success}</Alert>}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold text-muted-foreground">$</span>
            <Input
              type="number"
              className="pl-7 font-mono text-base font-semibold"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              step={10}
            />
          </div>
          <Button onClick={handleDeposit} disabled={loading} className="px-6">
            {loading ? <span className="spinner" /> : 'Deposit'}
          </Button>
        </div>

        <div className="flex gap-2">
          {[50, 100, 250, 500].map((val) => (
            <Button
              key={val}
              variant="secondary"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setAmount(val)}
            >
              ${val}
            </Button>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-md bg-muted/40 p-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Simulated transaction for the prototype — no real payment is charged.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

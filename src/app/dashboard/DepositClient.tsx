'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process deposit');
      }

      setSuccess(`Successfully deposited $${amount}.`);
      setAmount(100);
      router.refresh();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ border: '1px solid var(--color-gold-glow)', background: 'linear-gradient(to bottom right, var(--color-bg-card), var(--color-bg-secondary))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Add Funds</h2>
          <p className="text-muted text-xs">Instantly fund your PokerPay wallet</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-xs text-muted">Wallet Balance</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-gold)' }}>
            ${currentBalance.toFixed(2)}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error text-xs">{error}</div>}
      {success && <div className="alert alert-success text-xs">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontWeight: 600 }}>$</span>
          <input
            type="number"
            className="form-input"
            style={{ paddingLeft: '28px', fontSize: 'var(--text-lg)', fontWeight: 600 }}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={1}
            step={10}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ padding: '0 var(--space-8)' }}
          onClick={handleDeposit}
          disabled={loading}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
              Processing...
            </div>
          ) : 'Deposit'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
        {[50, 100, 250, 500].map(val => (
          <button 
            key={val} 
            className="btn btn-secondary btn-sm" 
            style={{ flex: 1, padding: 'var(--space-2) 0' }}
            onClick={() => setAmount(val)}
          >
            ${val}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs text-muted" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ color: 'var(--color-gold)' }}>ℹ</span>
          This is a simulated transaction for the prototype. No real payment methods are charged.
        </p>
      </div>
    </div>
  );
}

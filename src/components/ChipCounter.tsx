'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ChipDenomination {
  id: string;
  label: string;
  color: string;
  value: number;
}

export default function ChipCounter({
  tableId,
  chipDenominations,
  onSuccess,
}: {
  tableId: string;
  chipDenominations: ChipDenomination[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(chipDenominations.map((d) => [d.id, 0]))
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const adjust = (id: string, delta: number) => {
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
    setConfirmed(false);
    setError('');
  };

  const setCount = (id: string, raw: string) => {
    const parsed = parseInt(raw, 10);
    setCounts((prev) => ({ ...prev, [id]: isNaN(parsed) ? 0 : Math.max(0, parsed) }));
    setConfirmed(false);
    setError('');
  };

  const total = chipDenominations.reduce(
    (sum, d) => sum + d.value * (counts[d.id] ?? 0),
    0
  );

  const hasAnyChips = Object.values(counts).some((c) => c > 0);

  const handleConfirmCashout = async () => {
    if (!hasAnyChips) {
      setError('Add at least one chip before cashing out.');
      return;
    }
    setIsProcessing(true);
    setError('');
    try {
      const res = await fetch(`/api/tables/${tableId}/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Cashout failed');
      }

      setConfirmed(true);
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCounts(Object.fromEntries(chipDenominations.map((d) => [d.id, 0])));
    setConfirmed(false);
    setError('');
  };

  return (
    <div
      className="card"
      style={{
        marginTop: 'var(--space-4)',
        border: '1px solid var(--color-gold-glow)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-2)',
            background: 'var(--color-gold-glow)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xl)' }}>🎰</span>
        </div>
        <div>
          <h3
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 700,
              margin: 0,
              color: 'var(--color-gold)',
            }}
          >
            Count Your Chips
          </h3>
          <p className="text-xs text-muted">Tap + / − to count each denomination</p>
        </div>
      </div>

      {error && <div className="alert alert-error text-xs" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {confirmed && (
        <div className="alert alert-success text-sm" style={{ marginBottom: 'var(--space-4)' }}>
          Cashout successful!
        </div>
      )}

      {/* Chip rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {chipDenominations.map((d) => {
          const count = counts[d.id] ?? 0;
          const subtotal = d.value * count;
          return (
            <div
              key={d.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              {/* Chip swatch */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: d.color,
                  border: '2px solid rgba(255,255,255,0.25)',
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${d.color}55`,
                }}
              />

              {/* Label + value */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{d.label}</div>
                <div className="text-xs text-muted">${d.value.toFixed(2)} each</div>
              </div>

              {/* Subtotal */}
              <div
                style={{
                  minWidth: '60px',
                  textAlign: 'right',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: subtotal > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ${subtotal.toFixed(2)}
              </div>

              {/* Counter controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => adjust(d.id, -1)}
                  disabled={count === 0 || isProcessing}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '1.2rem',
                    cursor: count === 0 ? 'not-allowed' : 'pointer',
                    opacity: count === 0 ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={count === 0 ? '' : count}
                  placeholder="0"
                  onChange={(e) => setCount(d.id, e.target.value)}
                  disabled={isProcessing}
                  style={{
                    width: '48px',
                    height: '34px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: 'var(--text-base)',
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text)',
                    padding: '0 4px',
                  }}
                />
                <button
                  onClick={() => adjust(d.id, 1)}
                  disabled={isProcessing}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-gold)',
                    background: 'var(--color-gold-glow)',
                    color: 'var(--color-gold)',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div
        style={{
          marginTop: 'var(--space-5)',
          padding: 'var(--space-4)',
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span className="text-sm text-muted font-bold uppercase tracking-wider">Total Stack</span>
        <span
          style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 900,
            color: total > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          ${total.toFixed(2)}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <button
          className="btn btn-secondary"
          onClick={handleReset}
          disabled={isProcessing || !hasAnyChips}
          style={{ flex: 1 }}
        >
          Reset
        </button>
        <button
          className="btn btn-primary"
          onClick={handleConfirmCashout}
          disabled={isProcessing || !hasAnyChips}
          style={{
            flex: 2,
            background: 'var(--color-success)',
            borderColor: 'var(--color-success)',
          }}
        >
          {isProcessing ? 'Processing...' : `Cash Out $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}

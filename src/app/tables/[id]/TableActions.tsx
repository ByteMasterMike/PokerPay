'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChipCounter from '@/components/ChipCounter';

interface ChipDenomination {
  id: string;
  label: string;
  color: string;
  value: number;
}

interface PendingPlayer {
  id: string;
  userId: string;
  name: string;
}

interface ActivePlayer {
  name: string;
  status: string;
  cashoutAmount: number | null;
}

export default function TableActions({
  tableId,
  status,
  isOrganizer,
  isPlayer,
  isPending,
  isFull,
  chipDenominations,
  pendingPlayers,
  activePlayers,
  buyInAmount,
}: {
  tableId: string;
  status: string;
  isOrganizer: boolean;
  isPlayer: boolean;
  isPending: boolean;
  isFull: boolean;
  chipDenominations: ChipDenomination[];
  pendingPlayers: PendingPlayer[];
  activePlayers: ActivePlayer[];
  buyInAmount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showCashout, setShowCashout] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const handleTableAction = async (action: 'join' | 'close') => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} table`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, approve: boolean) => {
    setApprovalLoading(userId);
    setError('');
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: approve ? 'approve' : 'reject', userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process request');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApprovalLoading(null);
    }
  };

  if (status === 'CLOSED') {
    return (
      <div className="card text-center" style={{ backgroundColor: '#2a2a2a', opacity: 0.8 }}>
        <h3>Table is Closed</h3>
        <p className="text-sm">This session has ended.</p>
      </div>
    );
  }

  // Payout modal data
  const payoutRows = activePlayers.map((p) => {
    const cashout = p.cashoutAmount ?? 0;
    const net = cashout - buyInAmount;
    return { name: p.name, status: p.status, cashout, net };
  });
  const totalBuyIns = activePlayers.length * buyInAmount;
  const totalCashouts = payoutRows.reduce((s, r) => s + r.cashout, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

      {/* ── Pending Approvals (organizer only) ── */}
      {isOrganizer && pendingPlayers.length > 0 && (
        <div className="card" style={{ border: '1px solid rgba(245,158,11,0.4)' }}>
          <h3 style={{ color: '#f59e0b', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span>⏳</span> Pending Approval
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {pendingPlayers.map((p) => (
              <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2)', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem', flexShrink: 0 }}>{p.name[0]}</div>
                <span className="text-sm" style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                <button
                  className="btn btn-success"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  disabled={approvalLoading === p.userId}
                  onClick={() => handleApproval(p.userId, true)}
                >
                  {approvalLoading === p.userId ? '...' : '✓'}
                </button>
                <button
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                  disabled={approvalLoading === p.userId}
                  onClick={() => handleApproval(p.userId, false)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted" style={{ marginTop: 'var(--space-2)' }}>
            Confirm you received ${buyInAmount.toFixed(2)} cash from each player before approving.
          </p>
        </div>
      )}

      {/* ── Main Actions Card ── */}
      <div className="card">
        <h3>Actions</h3>

        {error && <div className="alert alert-error text-sm mt-3">{error}</div>}

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Organizer: Close Table → opens payout modal */}
          {isOrganizer && (
            <button
              className="btn btn-outline"
              onClick={() => setShowPayoutModal(true)}
              disabled={loading}
            >
              Close Table
            </button>
          )}

          {/* Player: not yet joined */}
          {!isOrganizer && !isPlayer && !isPending && !isFull && (
            <button
              className="btn btn-primary"
              onClick={() => handleTableAction('join')}
              disabled={loading}
            >
              {loading ? 'Requesting...' : 'Request to Join'}
            </button>
          )}

          {!isOrganizer && !isPlayer && !isPending && isFull && (
            <button className="btn btn-secondary" disabled>Table Full</button>
          )}

          {/* Player: pending */}
          {isPending && (
            <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'rgba(245,158,11,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <p className="text-sm" style={{ color: '#f59e0b', fontWeight: 600 }}>Awaiting Approval</p>
              <p className="text-xs text-muted">Pay the organizer ${buyInAmount.toFixed(2)} and they will approve your seat.</p>
            </div>
          )}

          {/* Player: active — cash out */}
          {isPlayer && status !== 'CLOSED' && (
            <>
              {!showCashout ? (
                <button className="btn btn-success" onClick={() => setShowCashout(true)}>
                  Cash Out
                </button>
              ) : (
                <button className="btn btn-outline" onClick={() => setShowCashout(false)}>
                  Cancel Cash Out
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Chip Counter ── */}
      {showCashout && (
        <ChipCounter
          tableId={tableId}
          chipDenominations={chipDenominations}
          onSuccess={() => setShowCashout(false)}
        />
      )}

      {/* ── Payout Summary Modal ── */}
      {showPayoutModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--space-4)',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-gold-glow)' }}>
            <h2 style={{ color: 'var(--color-gold)', marginBottom: 'var(--space-2)' }}>End of Night Payout</h2>
            <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-4)' }}>
              Here is how much cash to hand back to each player.
            </p>

            {payoutRows.length === 0 ? (
              <p className="text-sm text-muted">No players joined this table.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 'var(--space-2)', padding: '0 var(--space-2)', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  <span>Player</span>
                  <span style={{ textAlign: 'right' }}>Buy-in</span>
                  <span style={{ textAlign: 'right' }}>Cashout</span>
                  <span style={{ textAlign: 'right' }}>Net</span>
                </div>

                {payoutRows.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-2)', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{row.name}</div>
                      {row.status !== 'CASHED_OUT' && (
                        <div className="text-xs" style={{ color: '#f59e0b' }}>Not cashed out yet</div>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', textAlign: 'right' }}>
                      ${buyInAmount.toFixed(2)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', textAlign: 'right', color: row.cashout > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      ${row.cashout.toFixed(2)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, textAlign: 'right', color: row.net > 0 ? 'var(--color-success)' : row.net < 0 ? 'var(--color-error, #ef4444)' : 'var(--color-text-muted)' }}>
                      {row.net >= 0 ? '+' : ''}${row.net.toFixed(2)}
                    </span>
                  </div>
                ))}

                {/* Totals row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-2)', borderTop: '1px solid var(--color-border-light)', marginTop: 'var(--space-1)' }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, textAlign: 'right' }}>${totalBuyIns.toFixed(2)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, textAlign: 'right' }}>${totalCashouts.toFixed(2)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, textAlign: 'right', color: (totalCashouts - totalBuyIns) >= 0 ? 'var(--color-success)' : 'var(--color-error, #ef4444)' }}>
                    {(totalCashouts - totalBuyIns) >= 0 ? '+' : ''}${(totalCashouts - totalBuyIns).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowPayoutModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={loading}
                onClick={async () => {
                  await handleTableAction('close');
                  setShowPayoutModal(false);
                }}
              >
                {loading ? 'Closing...' : 'Confirm & Close Table'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

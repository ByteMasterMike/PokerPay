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

export default function TableActions({
  tableId,
  status,
  isOrganizer,
  isPlayer,
  isFull,
  chipDenominations,
}: {
  tableId: string;
  status: string;
  isOrganizer: boolean;
  isPlayer: boolean;
  isFull: boolean;
  chipDenominations: ChipDenomination[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCashout, setShowCashout] = useState(false);

  const handleAction = async (action: 'join' | 'close') => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} table`);
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
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

  return (
    <div className="card">
      <h3>Actions</h3>
      
      {error && <div className="alert alert-error text-sm mt-3">{error}</div>}

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isOrganizer && (
          <button
            className="btn btn-outline"
            onClick={() => handleAction('close')}
            disabled={loading}
          >
            {loading ? 'Closing...' : 'Close Table'}
          </button>
        )}

        {!isOrganizer && !isPlayer && !isFull && (
          <button
            className="btn btn-primary"
            onClick={() => handleAction('join')}
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Table'}
          </button>
        )}

        {!isOrganizer && !isPlayer && isFull && (
          <button className="btn btn-secondary" disabled>
            Table Full
          </button>
        )}

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

      {showCashout && (
        <ChipCounter
          tableId={tableId}
          chipDenominations={chipDenominations}
          onSuccess={() => setShowCashout(false)}
        />
      )}
    </div>
  );
}

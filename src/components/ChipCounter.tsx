'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ChipDenomination {
  id: string;
  label: string;
  color: string;
  value: number;
}

/* Generate the conic-gradient that creates the serrated outer ring of a poker chip */
function pokerChipGradient(color: string): string {
  const light = 'rgba(255,255,255,0.42)';
  const segs: string[] = [];
  for (let i = 0; i < 12; i++) {
    const s = i * 30;
    segs.push(`${color} ${s}deg ${s + 20}deg`);
    segs.push(`${light} ${s + 20}deg ${s + 30}deg`);
  }
  return `conic-gradient(${segs.join(', ')})`;
}

/* Black text for light chips, white for dark */
function chipTextColor(hex: string): string {
  if (!hex.startsWith('#') || hex.length < 7) return '#fff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#000' : '#fff';
}

/* Compress an image File to a base64 JPEG at ≤800px wide, ~65% quality */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 900;
      const scale = img.width > MAX ? MAX / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
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
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

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

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    setError('');
    try {
      const compressed = await compressImage(file);
      setPhoto(compressed);
    } catch {
      setError('Could not process photo. Please try again.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleConfirmCashout = async () => {
    if (!hasAnyChips) {
      setError('Add at least one chip before cashing out.');
      return;
    }
    if (!photo) {
      setError('Take a photo of your chip stack before cashing out.');
      return;
    }
    setIsProcessing(true);
    setError('');
    try {
      const res = await fetch(`/api/tables/${tableId}/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, stackPhoto: photo }),
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
    setPhoto(null);
  };

  return (
    <div style={{
      marginTop: 'var(--space-4)',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderTop: '3px solid var(--lime)',
      padding: 'var(--space-6)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          letterSpacing: '0.06em',
          color: 'var(--text)',
          lineHeight: 1,
        }}>
          COUNT YOUR STACK
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'var(--text-3)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginTop: '4px',
        }}>
          Tap +/− or type a count per denomination
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {confirmed && (
        <div className="alert alert-success" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          Cashout confirmed!
        </div>
      )}

      {/* Chip rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {chipDenominations.map((d) => {
          const count = counts[d.id] ?? 0;
          const subtotal = d.value * count;
          const textCol = chipTextColor(d.color);

          return (
            <div
              key={d.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                background: 'var(--surface-2)',
                border: `1px solid ${count > 0 ? 'rgba(203,255,0,0.25)' : 'var(--border)'}`,
                transition: 'border-color 100ms ease',
              }}
            >
              {/* CSS Poker chip */}
              <div
                className="poker-chip"
                style={{ background: pokerChipGradient(d.color) }}
              >
                <div
                  className="poker-chip-inner"
                  style={{ background: d.color }}
                >
                  <span
                    className="poker-chip-value"
                    style={{ color: textCol }}
                  >
                    ${d.value % 1 === 0 ? d.value : d.value.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text)',
                }}>
                  {d.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.58rem',
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  ${d.value.toFixed(2)} ea
                </div>
              </div>

              {/* Subtotal */}
              <div style={{
                minWidth: '58px',
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: subtotal > 0 ? 'var(--green)' : 'var(--text-3)',
              }}>
                ${subtotal.toFixed(2)}
              </div>

              {/* Counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={() => adjust(d.id, -1)}
                  disabled={count === 0 || isProcessing}
                  style={{
                    width: '32px', height: '32px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '1.1rem',
                    cursor: count === 0 ? 'not-allowed' : 'pointer',
                    opacity: count === 0 ? 0.3 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 80ms ease',
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
                    width: '44px', height: '32px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 'var(--text-sm)',
                    background: 'var(--surface)',
                    border: `1px solid ${count > 0 ? 'rgba(203,255,0,0.4)' : 'var(--border)'}`,
                    color: 'var(--text)',
                    padding: '0 4px',
                    borderRadius: 0,
                    outline: 'none',
                  }}
                />

                <button
                  onClick={() => adjust(d.id, 1)}
                  disabled={isProcessing}
                  style={{
                    width: '32px', height: '32px',
                    background: 'var(--lime)',
                    border: '1px solid var(--lime)',
                    color: '#000',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 900,
                    transition: 'all 80ms ease',
                    boxShadow: '2px 2px 0 rgba(203,255,0,0.4)',
                  }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total bar */}
      <div style={{
        marginTop: 'var(--space-5)',
        padding: 'var(--space-4) var(--space-5)',
        background: 'var(--surface-3)',
        borderLeft: '3px solid var(--lime)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
        }}>
          Total Stack
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-4xl)',
          fontWeight: 700,
          color: total > 0 ? 'var(--lime)' : 'var(--text-3)',
          lineHeight: 1,
        }}>
          ${total.toFixed(2)}
        </span>
      </div>

      {/* Photo capture */}
      <div style={{ marginTop: 'var(--space-5)', border: `2px solid ${photo ? 'var(--green)' : 'var(--border-2)'}`, transition: 'border-color 150ms' }}>
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', letterSpacing: '0.06em', color: photo ? 'var(--green)' : 'var(--text)', lineHeight: 1 }}>
              {photo ? '✓ STACK PHOTO TAKEN' : 'PHOTO REQUIRED'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '3px' }}>
              {photo ? 'Tap to retake' : 'Take a photo of your full chip stack'}
            </div>
          </div>
          <label style={{ cursor: 'pointer', flexShrink: 0 }}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhoto}
              disabled={isProcessing}
              style={{ display: 'none' }}
            />
            <div style={{
              padding: '8px 16px',
              background: photo ? 'var(--surface-2)' : 'var(--lime)',
              color: photo ? 'var(--text-2)' : '#000',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-base)',
              letterSpacing: '0.06em',
              border: photo ? '1px solid var(--border)' : 'none',
              cursor: 'pointer',
              opacity: isProcessing ? 0.5 : 1,
            }}>
              {photoLoading ? '...' : photo ? 'RETAKE' : '📷 SNAP'}
            </div>
          </label>
        </div>
        {photo && (
          <div style={{ position: 'relative', lineHeight: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Stack preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 10px', background: 'rgba(0,0,0,0.6)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Stack verified — photo will be sent to organizer
            </div>
          </div>
        )}
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
          className="btn btn-success"
          onClick={handleConfirmCashout}
          disabled={isProcessing || !hasAnyChips}
          style={{ flex: 2 }}
        >
          {isProcessing ? 'Processing...' : `Cash Out  $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}

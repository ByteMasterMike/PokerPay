'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

function chipTextColor(hex: string): string {
  if (!hex.startsWith('#') || hex.length < 7) return '#fff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#000' : '#fff';
}

export default function CreateTablePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: 'Friday Night Poker',
    maxPlayers: 9,
    buyInAmount: 100,
  });
  const [denominations, setDenominations] = useState([
    { label: 'White', color: '#FFFFFF', value: 1 },
    { label: 'Red', color: '#FF0000', value: 5 },
    { label: 'Green', color: '#00FF00', value: 25 },
    { label: 'Black', color: '#000000', value: 100 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addDenomination = () => {
    setDenominations([
      ...denominations,
      { label: 'New', color: '#888888', value: 1 },
    ]);
  };

  const removeDenomination = (index: number) => {
    setDenominations(denominations.filter((_, i) => i !== index));
  };

  const updateDenomination = (index: number, field: string, value: string | number) => {
    const updated = [...denominations];
    updated[index] = { ...updated[index], [field]: value };
    setDenominations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!Number.isFinite(form.maxPlayers) || form.maxPlayers < 2 || form.maxPlayers > 20) {
      setError('Max players must be between 2 and 20');
      return;
    }
    if (!Number.isFinite(form.buyInAmount) || form.buyInAmount <= 0) {
      setError('Buy-in amount must be a positive number');
      return;
    }
    const invalidDenom = denominations.find(
      (d) => !Number.isFinite(d.value) || d.value <= 0
    );
    if (invalidDenom) {
      setError('Each chip denomination must have a positive value');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, chipDenominations: denominations }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create table');
      }

      router.push(`/tables/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h1>Create a New Table</h1>
      <p className="subtitle">Set up the rules, buy-in, and chips for your game.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-section">
          <h2>1. Basic Settings</h2>
          <div className="form-group row">
            <div className="col">
              <label className="form-label">Table Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="col">
              <label className="form-label">Max Players</label>
              <input
                type="number"
                className="form-input"
                value={form.maxPlayers}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setForm({ ...form, maxPlayers: Number.isFinite(v) ? v : 9 });
                }}
                min={2}
                max={20}
                required
              />
            </div>
          </div>
          <div className="form-group row">
            <div className="col">
              <label className="form-label">Standard Buy-in ($)</label>
              <input
                type="number"
                className="form-input"
                value={form.buyInAmount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setForm({ ...form, buyInAmount: Number.isFinite(v) && v > 0 ? v : 100 });
                }}
                min={1}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section" style={{ marginTop: '2rem' }}>
          <h2>2. Chip Denominations</h2>
          <p className="help-text" style={{ marginBottom: '1.25rem' }}>Tap a chip to change its colour.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {denominations.map((denom, index) => {
              const textCol = chipTextColor(denom.color);
              const val = Number(denom.value);
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Clickable live chip preview — opens hidden color input */}
                  <label style={{ cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
                    <input
                      type="color"
                      value={denom.color}
                      onChange={(e) => updateDenomination(index, 'color', e.target.value)}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                    />
                    <div className="poker-chip" style={{ background: pokerChipGradient(denom.color) }}>
                      <div className="poker-chip-inner" style={{ background: denom.color }}>
                        <span className="poker-chip-value" style={{ color: textCol }}>
                          ${val % 1 === 0 ? val : val.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </label>

                  {/* Label + value inputs */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Name (e.g. Red)"
                      value={denom.label}
                      onChange={(e) => updateDenomination(index, 'label', e.target.value)}
                      style={{ fontWeight: 600 }}
                      required
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>$</span>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Value"
                        value={denom.value}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          updateDenomination(index, 'value', Number.isFinite(v) && v > 0 ? v : 1);
                        }}
                        min={0.01}
                        step={0.01}
                        style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                        required
                      />
                    </div>
                  </div>

                  {/* Remove */}
                  {denominations.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => removeDenomination(index)}
                      style={{ flexShrink: 0, borderColor: 'var(--red)', color: 'var(--red)', padding: '6px 14px', fontSize: 'var(--text-sm)' }}
                    >
                      REMOVE
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addDenomination}
            style={{ marginTop: 'var(--space-3)', width: '100%' }}
          >
            + ADD CHIP COLOR
          </button>
        </div>

        <div className="form-actions" style={{ marginTop: '3rem', textAlign: 'right' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => router.back()}
            style={{ marginRight: '1rem' }}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Creating...' : 'Create Table'}
          </button>
        </div>
      </form>
    </div>
  );
}

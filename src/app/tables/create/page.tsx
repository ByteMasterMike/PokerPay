'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      { label: 'New', color: '#888888', value: 0 },
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
                onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })}
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
                onChange={(e) => setForm({ ...form, buyInAmount: Number(e.target.value) })}
                min={1}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section" style={{ marginTop: '2rem' }}>
          <h2>2. Chip Denominations</h2>
          <p className="help-text">Define the chips used at your table.</p>

          <div className="denominations-list">
            {denominations.map((denom, index) => (
              <div key={index} className="denomination-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                <input
                  type="color"
                  value={denom.color}
                  onChange={(e) => updateDenomination(index, 'color', e.target.value)}
                  style={{ width: '50px', height: '50px', padding: '0', border: 'none' }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Label (e.g. Red)"
                  value={denom.label}
                  onChange={(e) => updateDenomination(index, 'label', e.target.value)}
                  required
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  $
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Value"
                    value={denom.value}
                    onChange={(e) => updateDenomination(index, 'value', Number(e.target.value))}
                    min={0.01}
                    step={0.01}
                    required
                  />
                </div>
                {denominations.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => removeDenomination(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-secondary mt-2"
            onClick={addDenomination}
          >
            + Add Chip Color
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

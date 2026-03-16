'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PokerChip, { pokerChipGradient, chipTextColor } from '@/components/PokerChip';

export default function CreateTablePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: 'Friday Night Poker',
    maxPlayers: 9,
    buyInAmount: 100,
  });
  const [denominations, setDenominations] = useState([
    { label: 'White', color: '#FFFFFF', value: 1 },
    { label: 'Red',   color: '#FF0000', value: 5 },
    { label: 'Green', color: '#00FF00', value: 25 },
    { label: 'Black', color: '#000000', value: 100 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addDenomination = () =>
    setDenominations([...denominations, { label: 'New', color: '#888888', value: 1 }]);

  const removeDenomination = (index: number) =>
    setDenominations(denominations.filter((_, i) => i !== index));

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
    if (denominations.find((d) => !Number.isFinite(d.value) || d.value <= 0)) {
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
      if (!res.ok) throw new Error(data.error || 'Failed to create table');
      router.push(`/tables/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
          Create a New Table
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Set up the rules, buy-in, and chips for your game.
        </p>
      </header>

      {error && <Alert variant="destructive" className="mb-6">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic settings */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">1. Basic Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Table Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Players</Label>
                <Input
                  type="number"
                  value={form.maxPlayers}
                  onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) || 9 })}
                  min={2} max={20}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Standard Buy-in ($)</Label>
                <Input
                  type="number"
                  value={form.buyInAmount}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setForm({ ...form, buyInAmount: v > 0 ? v : 100 });
                  }}
                  min={1} required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chip denominations */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">2. Chip Denominations</CardTitle>
            <p className="text-xs text-muted-foreground">Click the chip to change its colour.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {denominations.map((denom, index) => {
              const textCol = chipTextColor(denom.color);
              const val = Number(denom.value);
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3"
                >
                  {/* Clickable chip → opens color picker */}
                  <label className="cursor-pointer flex-shrink-0 relative">
                    <input
                      type="color"
                      value={denom.color}
                      onChange={(e) => updateDenomination(index, 'color', e.target.value)}
                      className="absolute opacity-0 w-0 h-0 pointer-events-none"
                    />
                    <div className="poker-chip" style={{ background: pokerChipGradient(denom.color) }}>
                      <div className="poker-chip-inner" style={{ background: denom.color }}>
                        <span className="poker-chip-value" style={{ color: textCol }}>
                          ${val % 1 === 0 ? val : val.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </label>

                  <div className="flex-1 space-y-2">
                    <Input
                      type="text"
                      placeholder="Name (e.g. Red)"
                      value={denom.label}
                      onChange={(e) => updateDenomination(index, 'label', e.target.value)}
                      className="font-semibold"
                      required
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-mono text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="Value"
                        value={denom.value}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          updateDenomination(index, 'value', v > 0 ? v : 1);
                        }}
                        min={0.01} step={0.01}
                        className="font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  {denominations.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => removeDenomination(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-1.5"
              onClick={addDenomination}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Chip Color
            </Button>
          </CardContent>
        </Card>

        <Separator className="opacity-40" />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Creating…' : 'Create Table'}
          </Button>
        </div>
      </form>
    </div>
  );
}

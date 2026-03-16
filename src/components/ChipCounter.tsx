'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { pokerChipGradient, chipTextColor } from '@/components/PokerChip';

interface ChipDenomination {
  id: string;
  label: string;
  color: string;
  value: number;
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 900;
      const scale = img.width > MAX ? MAX / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
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

  const total = chipDenominations.reduce((sum, d) => sum + d.value * (counts[d.id] ?? 0), 0);
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
    if (!hasAnyChips) { setError('Add at least one chip before cashing out.'); return; }
    if (!photo) { setError('Take a photo of your chip stack before cashing out.'); return; }
    setIsProcessing(true);
    setError('');
    try {
      const res = await fetch(`/api/tables/${tableId}/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          stackPhoto: photo,
          chipCounts: chipDenominations
            .filter((d) => (counts[d.id] ?? 0) > 0)
            .map((d) => ({ color: d.color, label: d.label, value: d.value, count: counts[d.id] ?? 0 })),
        }),
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
    <Card className="border-primary/30 bg-card shadow-[0_0_24px_rgba(249,115,22,0.08)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base tracking-tight">Count Your Stack</CardTitle>
        <p className="text-xs text-muted-foreground">Tap +/− or type a count per denomination</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error    && <Alert variant="destructive" className="text-xs py-2">{error}</Alert>}
        {confirmed && <Alert variant="success"    className="text-xs py-2 flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5" /> Cashout confirmed!</Alert>}

        {/* Chip rows */}
        <div className="space-y-2">
          {chipDenominations.map((d) => {
            const count    = counts[d.id] ?? 0;
            const subtotal = d.value * count;
            const textCol  = chipTextColor(d.color);

            return (
              <div
                key={d.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  count > 0 ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-secondary/20'
                }`}
              >
                {/* Chip visual */}
                <div className="poker-chip flex-shrink-0" style={{ background: pokerChipGradient(d.color) }}>
                  <div className="poker-chip-inner" style={{ background: d.color }}>
                    <span className="poker-chip-value" style={{ color: textCol }}>
                      ${d.value % 1 === 0 ? d.value : d.value.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{d.label}</p>
                  <p className="font-mono text-[0.6rem] text-muted-foreground uppercase tracking-wider">
                    ${d.value.toFixed(2)} ea
                  </p>
                </div>

                {/* Subtotal */}
                <p className={`min-w-[56px] text-right font-mono text-sm font-bold ${subtotal > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                  ${subtotal.toFixed(2)}
                </p>

                {/* Stepper */}
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-base"
                    onClick={() => adjust(d.id, -1)}
                    disabled={count === 0 || isProcessing}
                  >
                    −
                  </Button>
                  <input
                    type="number"
                    min={0}
                    value={count === 0 ? '' : count}
                    placeholder="0"
                    onChange={(e) => setCount(d.id, e.target.value)}
                    disabled={isProcessing}
                    className="h-8 w-11 rounded-md border border-input bg-secondary/40 text-center font-mono text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    type="button"
                    variant="default"
                    size="icon"
                    className="h-8 w-8 text-base"
                    onClick={() => adjust(d.id, 1)}
                    disabled={isProcessing}
                  >
                    +
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total bar */}
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Total Stack
          </span>
          <span className={`font-mono text-3xl font-bold ${total > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
            ${total.toFixed(2)}
          </span>
        </div>

        <Separator className="opacity-40" />

        {/* Photo capture */}
        <div className={`rounded-lg border-2 transition-colors ${photo ? 'border-emerald-500/40' : 'border-border'}`}>
          <div className="flex items-center justify-between p-3">
            <div>
              <p className={`text-sm font-semibold ${photo ? 'text-emerald-400' : 'text-foreground'}`}>
                {photo ? '✓ Stack Photo Taken' : 'Photo Required'}
              </p>
              <p className="text-xs text-muted-foreground">
                {photo ? 'Tap to retake' : 'Take a photo of your full chip stack'}
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhoto}
                disabled={isProcessing}
                className="hidden"
              />
              <Button
                type="button"
                variant={photo ? 'secondary' : 'default'}
                size="sm"
                className="gap-1.5 pointer-events-none"
                disabled={isProcessing}
                asChild
              >
                <span>
                  <Camera className="h-3.5 w-3.5" />
                  {photoLoading ? '…' : photo ? 'Retake' : 'Snap'}
                </span>
              </Button>
            </label>
          </div>
          {photo && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt="Stack preview"
                className="w-full max-h-44 object-cover rounded-b-lg"
              />
              <p className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/60 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-emerald-400">
                Stack verified — photo will be sent to organizer
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 gap-1.5"
            onClick={handleReset}
            disabled={isProcessing || !hasAnyChips}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            variant="success"
            className="flex-[2]"
            onClick={handleConfirmCashout}
            disabled={isProcessing || !hasAnyChips}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2"><span className="spinner" /> Processing…</span>
            ) : (
              `Cash Out $${total.toFixed(2)}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

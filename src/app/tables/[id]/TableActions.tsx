'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import ChipCounter from '@/components/ChipCounter';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface ChipDenomination { id: string; label: string; color: string; value: number; }
interface PendingPlayer     { id: string; userId: string; name: string; }
interface ActivePlayer      { userId: string; name: string; status: string; cashoutAmount: number | null; stackPhoto: string | null; rebuys: number; }

export default function TableActions({
  tableId, status, isOrganizer, isPlayer, isPending, isFull,
  chipDenominations, pendingPlayers, activePlayers, buyInAmount,
}: {
  tableId: string; status: string; isOrganizer: boolean; isPlayer: boolean;
  isPending: boolean; isFull: boolean; chipDenominations: ChipDenomination[];
  pendingPlayers: PendingPlayer[]; activePlayers: ActivePlayer[]; buyInAmount: number;
}) {
  const router = useRouter();
  const [loading, setLoading]               = useState(false);
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);
  const [rebuyLoading, setRebuyLoading]      = useState<string | null>(null);
  const [error, setError]                   = useState('');
  const [showCashout, setShowCashout]        = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const handleTableAction = async (action: 'join' | 'close', extra?: Record<string, unknown>) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
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

  const handleRebuy = async (userId: string) => {
    setRebuyLoading(userId);
    setError('');
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rebuy', userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record rebuy');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRebuyLoading(null);
    }
  };

  if (status === 'CLOSED') {
    return (
      <Card className="border-border/60 bg-card text-center">
        <CardContent className="py-8">
          <p className="text-sm font-semibold text-muted-foreground">Table is Closed</p>
          <p className="mt-1 text-xs text-muted-foreground">This session has ended.</p>
        </CardContent>
      </Card>
    );
  }

  const payoutRows    = activePlayers.map((p) => ({
    ...p,
    cashout:   p.cashoutAmount ?? 0,
    totalCost: (1 + p.rebuys) * buyInAmount,
    net:       (p.cashoutAmount ?? 0) - (1 + p.rebuys) * buyInAmount,
  }));
  const totalBuyIns   = payoutRows.reduce((s, r) => s + r.totalCost, 0);
  const totalCashouts = payoutRows.reduce((s, r) => s + r.cashout, 0);

  return (
    <div className="space-y-4">

      {/* Pending approvals */}
      {isOrganizer && pendingPlayers.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-400">
              <Clock className="h-4 w-4" />
              Pending Approval ({pendingPlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingPlayers.map((p) => (
              <div key={p.userId} className="flex items-center gap-2 rounded-md bg-secondary/30 p-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{p.name[0]}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-semibold">{p.name}</span>
                <Button
                  variant="success"
                  size="icon"
                  className="h-7 w-7"
                  disabled={approvalLoading === p.userId}
                  onClick={() => handleApproval(p.userId, true)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  disabled={approvalLoading === p.userId}
                  onClick={() => handleApproval(p.userId, false)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Confirm you received ${buyInAmount.toFixed(2)} cash from each player before approving.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rebuy panel — organizer sees active players and can record a rebuy */}
      {isOrganizer && activePlayers.filter(p => p.status === 'ACTIVE').length > 0 && (
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 text-primary" />
              Record Rebuy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activePlayers.filter(p => p.status === 'ACTIVE').map((p) => (
              <div key={p.userId} className="flex items-center gap-2 rounded-md bg-secondary/30 p-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{p.name[0]}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-semibold">{p.name}</span>
                {p.rebuys > 0 && (
                  <span className="text-[0.65rem] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    ×{p.rebuys + 1}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={rebuyLoading === p.userId}
                  onClick={() => handleRebuy(p.userId)}
                >
                  <RefreshCw className="h-3 w-3" />
                  {rebuyLoading === p.userId ? '…' : `+$${buyInAmount.toFixed(0)}`}
                </Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Confirm you received ${buyInAmount.toFixed(2)} cash before recording a rebuy.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main action card */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <Alert variant="destructive" className="text-xs py-2">{error}</Alert>}

          {isOrganizer && (
            <Button
              variant="outline"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowPayoutModal(true)}
              disabled={loading}
            >
              Close Table
            </Button>
          )}

          {!isOrganizer && !isPlayer && !isPending && !isFull && (
            <Button className="w-full" onClick={() => handleTableAction('join')} disabled={loading}>
              {loading ? <span className="flex items-center gap-2"><span className="spinner" /> Requesting…</span> : 'Request to Join'}
            </Button>
          )}

          {!isOrganizer && !isPlayer && !isPending && isFull && (
            <Button className="w-full" variant="secondary" disabled>Table Full</Button>
          )}

          {isPending && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 p-3 text-center">
              <p className="text-sm font-semibold text-amber-400">Awaiting Approval</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pay the organizer ${buyInAmount.toFixed(2)} and they will approve your seat.
              </p>
            </div>
          )}

          {isPlayer && status !== 'CLOSED' && (
            !showCashout ? (
              <Button variant="success" className="w-full" onClick={() => setShowCashout(true)}>
                Cash Out
              </Button>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setShowCashout(false)}>
                Cancel Cash Out
              </Button>
            )
          )}
        </CardContent>
      </Card>

      {/* Chip counter */}
      {showCashout && (
        <ChipCounter
          tableId={tableId}
          chipDenominations={chipDenominations}
          onSuccess={() => setShowCashout(false)}
        />
      )}

      {/* Payout modal */}
      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-primary">End of Night Payout</DialogTitle>
            <DialogDescription>Here is how much cash to hand back to each player.</DialogDescription>
          </DialogHeader>

          {payoutRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No players joined this table.</p>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2 text-[0.67rem] uppercase tracking-wider text-muted-foreground font-semibold">
                <span>Player</span>
                <span className="text-right">Buy-in</span>
                <span className="text-right">Cashout</span>
                <span className="text-right">Net</span>
              </div>

              {payoutRows.map((row, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-secondary/30 overflow-hidden">
                  {row.stackPhoto && (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={row.stackPhoto} alt={`${row.name}'s stack`} className="w-full block" />
                      <span className="absolute top-1.5 left-2 bg-black/70 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-emerald-400 rounded">
                        📷 Stack photo
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-3 py-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold">{row.name}</p>
                        {row.rebuys > 0 && (
                          <span className="text-[0.6rem] font-bold bg-primary/10 text-primary px-1 py-0.5 rounded-full">
                            ×{row.rebuys + 1} buy-ins
                          </span>
                        )}
                      </div>
                      {row.status !== 'CASHED_OUT' && (
                        <p className="text-xs text-amber-400">Not cashed out yet</p>
                      )}
                      {row.status === 'CASHED_OUT' && !row.stackPhoto && (
                        <p className="text-xs text-red-400">No photo provided</p>
                      )}
                    </div>
                    <span className="font-mono text-xs text-right">${row.totalCost.toFixed(2)}</span>
                    <span className={`font-mono text-xs text-right ${row.cashout > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      ${row.cashout.toFixed(2)}
                    </span>
                    <span className={`font-mono text-xs font-bold text-right ${row.net > 0 ? 'text-emerald-400' : row.net < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {row.net >= 0 ? '+' : ''}${row.net.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              <Separator className="opacity-40" />

              {/* Totals */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-3 py-2">
                <span className="text-sm font-bold">Total</span>
                <span className="font-mono text-sm font-bold text-right">${totalBuyIns.toFixed(2)}</span>
                <span className="font-mono text-sm font-bold text-right">${totalCashouts.toFixed(2)}</span>
                <span className={`font-mono text-sm font-bold text-right ${(totalCashouts - totalBuyIns) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(totalCashouts - totalBuyIns) >= 0 ? '+' : ''}${(totalCashouts - totalBuyIns).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowPayoutModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="flex-[2]"
              disabled={loading}
              onClick={async () => {
                const payoutSummary = {
                  closedAt: new Date().toISOString(),
                  buyInAmount,
                  rows: payoutRows,
                  totalBuyIns,
                  totalCashouts,
                };
                await handleTableAction('close', { payoutSummary });
                setShowPayoutModal(false);
              }}
            >
              {loading ? 'Closing…' : 'Confirm & Close Table'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

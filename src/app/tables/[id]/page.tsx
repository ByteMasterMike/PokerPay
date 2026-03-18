import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import Link from 'next/link';
import { headers } from 'next/headers';
import { ArrowLeft, Users, DollarSign, Clock } from 'lucide-react';
import TableActions from './TableActions';
import AutoRefresh from '@/components/AutoRefresh';
import PokerChip from '@/components/PokerChip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function TablePageWrapper({ params }: { params: Promise<{ id: string }> }) {
  return <TablePage params={params} />;
}

async function TablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/tables/${id}`)}`);
  }

  const table = await prisma.table.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      chipDenominations: { orderBy: { value: 'asc' } },
      players: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!table) notFound();

  // Non-members can view an OPEN table so they can request to join.
  // For CLOSED tables, only members get to see the payout details.
  const isMember =
    table.organizerId === session.user.id ||
    table.players.some((p) => p.userId === session.user.id);
  if (!isMember && table.status !== 'OPEN') notFound();

  const isOrganizer    = table.organizerId === session.user.id;
  const currentPlayer  = table.players.find((p) => p.userId === session.user.id);
  const isPlayer       = !!currentPlayer && currentPlayer.status !== 'PENDING';
  const isPending      = currentPlayer?.status === 'PENDING';

  type PayoutRow = { name: string; status: string; cashout: number; net: number; totalCost: number; rebuys: number; stackPhoto?: string | null };
  type PayoutSummary = {
    closedAt: string;
    buyInAmount: number;
    rows: PayoutRow[];
    totalBuyIns: number;
    totalCashouts: number;
  };

  const payoutSummary =
    table.status === 'CLOSED' && table.payoutSummary
      ? (table.payoutSummary as PayoutSummary)
      : null;

  const activePlayers  = table.players.filter((p) => p.status === 'ACTIVE' || p.status === 'CASHED_OUT');
  const pendingPlayers = table.players.filter((p) => p.status === 'PENDING');

  const headersList = await headers();
  const host  = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const qrCodeDataUrl = await QRCode.toDataURL(`${proto}://${host}/tables/${table.id}`);

  return (
    <div className="container py-8">
      <AutoRefresh intervalMs={5000} disabled={table.status === 'CLOSED'} />

      {/* Back link */}
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground no-underline transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>

      {/* Header card */}
      <Card className="mb-6 border-border/60 bg-card">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                {table.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Organized by {table.organizer.name}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={table.status === 'OPEN' ? 'success' : 'secondary'}>
                  {table.status}
                </Badge>
                <Badge variant="outline">
                  <Users className="mr-1 h-3 w-3" />
                  {activePlayers.length} / {table.maxPlayers}
                </Badge>
                <Badge variant="outline">
                  <DollarSign className="mr-1 h-3 w-3" />
                  ${Number(table.buyInAmount)} buy-in
                </Badge>
                {pendingPlayers.length > 0 && isOrganizer && (
                  <Badge variant="warning">
                    <Clock className="mr-1 h-3 w-3" />
                    {pendingPlayers.length} Pending
                  </Badge>
                )}
              </div>
            </div>

            {/* QR Code */}
            {isOrganizer && table.status === 'OPEN' && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-secondary/30 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeDataUrl} alt="Join Table QR" className="w-28 h-28 rounded-lg" />
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Scan to Join
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending notice for current player */}
      {isPending && (
        <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="text-sm font-bold text-amber-400">Waiting for organizer approval</p>
              <p className="text-xs text-muted-foreground">The organizer will confirm your cash payment and approve your seat.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

        <div className="space-y-6">
          {/* Players */}
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Players at Table</CardTitle>
            </CardHeader>
            <CardContent>
              {activePlayers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No players have joined yet.</p>
              ) : (
                <div className="space-y-2">
                  {activePlayers.map((player, i) => (
                    <div key={player.id}>
                      <div className="flex items-center gap-3 py-1.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{player.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{player.user.name}</p>
                          <p className={`text-xs ${player.status === 'CASHED_OUT' ? 'text-muted-foreground' : 'text-emerald-400'}`}>
                            {player.status === 'CASHED_OUT' ? 'Cashed Out' : 'Active'}
                          </p>
                        </div>
                        {player.status === 'CASHED_OUT' && player.cashoutAmount !== null && (
                          <span className="font-mono text-sm font-bold text-emerald-400">
                            ${Number(player.cashoutAmount).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {i < activePlayers.length - 1 && <Separator className="opacity-30" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payout summary (closed table, organizer) */}
          {table.status === 'CLOSED' && isOrganizer && payoutSummary && (
            <Card className="border-border/60 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-primary">Payout Summary</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Closed {new Date(payoutSummary.closedAt).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2 text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">
                  <span>Player</span>
                  <span className="text-right">Buy-in</span>
                  <span className="text-right">Cashout</span>
                  <span className="text-right">Net</span>
                </div>
                {payoutSummary.rows.map((row, i) => (
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
                        {row.status !== 'CASHED_OUT' && <p className="text-xs text-amber-400">Did not cash out</p>}
                      </div>
                      <span className="font-mono text-xs text-right">${(row.totalCost ?? payoutSummary.buyInAmount).toFixed(2)}</span>
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
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-2 py-1">
                  <span className="text-sm font-bold">Total</span>
                  <span className="font-mono text-sm font-bold text-right">${payoutSummary.totalBuyIns.toFixed(2)}</span>
                  <span className="font-mono text-sm font-bold text-right">${payoutSummary.totalCashouts.toFixed(2)}</span>
                  <span className={`font-mono text-sm font-bold text-right ${(payoutSummary.totalCashouts - payoutSummary.totalBuyIns) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(payoutSummary.totalCashouts - payoutSummary.totalBuyIns) >= 0 ? '+' : ''}${(payoutSummary.totalCashouts - payoutSummary.totalBuyIns).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chip denominations (organizer) */}
          {isOrganizer && (
            <Card className="border-border/60 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Chip Denominations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {table.chipDenominations.map((chip) => (
                    <div key={chip.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 px-4 py-3 flex-1 min-w-[140px]">
                      <PokerChip color={chip.color} label={chip.label} value={Number(chip.value)} />
                      <div>
                        <p className="text-sm font-semibold">{chip.label}</p>
                        <p className="font-mono text-xs text-muted-foreground">${Number(chip.value).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar actions */}
        <div>
          <TableActions
            tableId={table.id}
            status={table.status}
            isOrganizer={isOrganizer}
            isPlayer={isPlayer}
            isPending={isPending}
            isFull={activePlayers.length >= table.maxPlayers}
            chipDenominations={table.chipDenominations.map(d => ({ ...d, value: Number(d.value) }))}
            pendingPlayers={isOrganizer ? pendingPlayers.map(p => ({ id: p.id, userId: p.userId, name: p.user.name })) : []}
            activePlayers={activePlayers.map(p => ({
              userId: p.userId,
              name: p.user.name,
              status: p.status,
              rebuys: p.rebuys ?? 0,
              cashoutAmount: isOrganizer ? (p.cashoutAmount !== null ? Number(p.cashoutAmount) : null) : null,
              stackPhoto: isOrganizer ? (p.stackPhoto ?? null) : null,
            }))}
            buyInAmount={Number(table.buyInAmount)}
          />
        </div>
      </div>
    </div>
  );
}

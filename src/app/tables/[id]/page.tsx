import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import Link from 'next/link';
import TableActions from './TableActions';
import AutoRefresh from '@/components/AutoRefresh';
import { headers } from 'next/headers';

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
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!table) {
    return (
      <div className="container">
        <h1>Table Not Found</h1>
        <Link href="/dashboard" className="btn btn-secondary mt-4">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isOrganizer = table.organizerId === session.user.id;
  const currentPlayer = table.players.find((p) => p.userId === session.user.id);
  const isPlayer = !!currentPlayer && currentPlayer.status !== 'PENDING';
  const isPending = currentPlayer?.status === 'PENDING';

  type PayoutRow = { name: string; status: string; cashout: number; net: number };
  type PayoutSummary = {
    closedAt: string;
    buyInAmount: number;
    rows: PayoutRow[];
    totalBuyIns: number;
    totalCashouts: number;
  };
  const payoutSummary = table.status === 'CLOSED' && table.payoutSummary
    ? (table.payoutSummary as PayoutSummary)
    : null;

  const activePlayers = table.players.filter((p) => p.status === 'ACTIVE' || p.status === 'CASHED_OUT');
  const pendingPlayers = table.players.filter((p) => p.status === 'PENDING');

  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}`;
  const qrCodeDataUrl = await QRCode.toDataURL(`${baseUrl}/tables/${table.id}`);

  return (
    <div className="container">
      {/* Auto-refresh every 5 seconds for live updates */}
      <AutoRefresh intervalMs={5000} />

      <div className="table-header card">
        <div className="table-header-content">
          <div>
            <h1>{table.name}</h1>
            <p className="subtitle">Organized by {table.organizer.name}</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`badge ${table.status === 'OPEN' ? 'badge-success' : 'badge-neutral'}`}>
                {table.status}
              </span>
              <span className="badge badge-primary">
                {activePlayers.length} / {table.maxPlayers} Players
              </span>
              <span className="badge badge-secondary">
                Buy-in: ${Number(table.buyInAmount)}
              </span>
              {pendingPlayers.length > 0 && isOrganizer && (
                <span className="badge" style={{ background: 'var(--color-warning, #f59e0b)', color: '#000' }}>
                  {pendingPlayers.length} Pending
                </span>
              )}
            </div>
          </div>

          {isOrganizer && table.status === 'OPEN' && (
            <div className="qr-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeDataUrl} alt="Join Table QR" style={{ width: '120px', height: '120px', borderRadius: '8px' }} />
              <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-muted)' }}>Scan to Join</p>
            </div>
          )}
        </div>
      </div>

      <div className="table-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginTop: '2rem' }}>

        {/* Main Content Area */}
        <div className="main-content">

          {/* Pending approval notice for the current player */}
          {isPending && (
            <div className="alert" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: '1.5rem' }}>⏳</span>
              <div>
                <div style={{ fontWeight: 700, color: '#f59e0b' }}>Waiting for organizer approval</div>
                <div className="text-xs text-muted">The organizer will confirm your cash payment and approve your seat.</div>
              </div>
            </div>
          )}

          {/* Players at Table */}
          <section className="card">
            <h2>Players at Table</h2>
            {activePlayers.length === 0 ? (
              <p className="empty-state">No players have joined yet.</p>
            ) : (
              <ul className="player-list">
                {activePlayers.map((player) => (
                  <li key={player.id} className="player-list-item">
                    <div className="avatar">{player.user.name[0]}</div>
                    <div className="player-info">
                      <strong>{player.user.name}</strong>
                      <span className={`player-status text-sm ${player.status === 'CASHED_OUT' ? 'text-muted' : 'text-success'}`}>
                        {player.status === 'CASHED_OUT' ? 'Cashed Out' : 'Active'}
                      </span>
                    </div>
                    {player.status === 'CASHED_OUT' && player.cashoutAmount !== null && (
                      <span className="text-sm font-bold" style={{ color: 'var(--color-success)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                        ${Number(player.cashoutAmount).toFixed(2)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Payout Summary — shown to organizer on closed tables */}
          {table.status === 'CLOSED' && isOrganizer && payoutSummary && (
            <section className="card" style={{ marginTop: '2rem', border: '1px solid var(--color-border-light)' }}>
              <h2 style={{ marginBottom: '0.25rem' }}>Payout Summary</h2>
              <p className="text-xs text-muted" style={{ marginBottom: '1.25rem' }}>
                Closed {new Date(payoutSummary.closedAt).toLocaleString()}
              </p>

              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', padding: '0 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                <span>Player</span>
                <span style={{ textAlign: 'right' }}>Buy-in</span>
                <span style={{ textAlign: 'right' }}>Cashout</span>
                <span style={{ textAlign: 'right' }}>Net</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {payoutSummary.rows.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', padding: '0.75rem 0.5rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{row.name}</div>
                      {row.status !== 'CASHED_OUT' && (
                        <div className="text-xs" style={{ color: '#f59e0b' }}>Did not cash out</div>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', textAlign: 'right' }}>
                      ${payoutSummary.buyInAmount.toFixed(2)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', textAlign: 'right', color: row.cashout > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      ${row.cashout.toFixed(2)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, textAlign: 'right', color: row.net > 0 ? 'var(--color-success)' : row.net < 0 ? 'var(--color-error, #ef4444)' : 'var(--color-text-muted)' }}>
                      {row.net >= 0 ? '+' : ''}${row.net.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', padding: '0.75rem 0.5rem', borderTop: '1px solid var(--color-border-light)', marginTop: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, textAlign: 'right' }}>${payoutSummary.totalBuyIns.toFixed(2)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, textAlign: 'right' }}>${payoutSummary.totalCashouts.toFixed(2)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, textAlign: 'right' }}>
                  {(payoutSummary.totalCashouts - payoutSummary.totalBuyIns) >= 0 ? '+' : ''}${(payoutSummary.totalCashouts - payoutSummary.totalBuyIns).toFixed(2)}
                </span>
              </div>
            </section>
          )}

          {isOrganizer && (
            <section className="card" style={{ marginTop: '2rem' }}>
              <h2>Chip Denominations</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1.25rem' }}>
                {table.chipDenominations.map((chip) => {
                  const val = Number(chip.value);
                  const textCol = chipTextColor(chip.color);
                  return (
                    <div key={chip.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--surface-2)', border: '1px solid var(--border)', flex: '1 1 160px', minWidth: '140px' }}>
                      {/* Poker chip */}
                      <div className="poker-chip" style={{ background: pokerChipGradient(chip.color), flexShrink: 0 }}>
                        <div className="poker-chip-inner" style={{ background: chip.color }}>
                          <span className="poker-chip-value" style={{ color: textCol }}>
                            ${val % 1 === 0 ? val : val.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {/* Info */}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text)' }}>{chip.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: '2px' }}>${val.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="sidebar">
          <TableActions
            tableId={table.id}
            status={table.status}
            isOrganizer={isOrganizer}
            isPlayer={isPlayer}
            isPending={isPending}
            isFull={activePlayers.length >= table.maxPlayers}
            chipDenominations={table.chipDenominations.map(d => ({ ...d, value: Number(d.value) }))}
            pendingPlayers={pendingPlayers.map(p => ({ id: p.id, userId: p.userId, name: p.user.name }))}
            activePlayers={activePlayers.map(p => ({
              name: p.user.name,
              status: p.status,
              cashoutAmount: p.cashoutAmount !== null ? Number(p.cashoutAmount) : null,
            }))}
            buyInAmount={Number(table.buyInAmount)}
          />
        </div>
      </div>
    </div>
  );
}

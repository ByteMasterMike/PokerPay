import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import Link from 'next/link';
import TableActions from './TableActions';
import AutoRefresh from '@/components/AutoRefresh';

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

  const activePlayers = table.players.filter((p) => p.status === 'ACTIVE' || p.status === 'CASHED_OUT');
  const pendingPlayers = table.players.filter((p) => p.status === 'PENDING');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
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

          {isOrganizer && (
            <section className="card" style={{ marginTop: '2rem' }}>
              <h2>Chip Denominations</h2>
              <div className="chip-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {table.chipDenominations.map((chip) => (
                  <div key={chip.id} className="chip-item" style={{ textAlign: 'center' }}>
                    <div className="chip-circle" style={{ backgroundColor: chip.color, width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto', border: '2px solid rgba(255,255,255,0.2)' }}></div>
                    <div className="chip-label" style={{ marginTop: '0.5rem', fontWeight: 500 }}>{chip.label}</div>
                    <div className="chip-val">${Number(chip.value)}</div>
                  </div>
                ))}
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

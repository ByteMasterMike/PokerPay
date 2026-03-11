import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import Link from 'next/link';
import TableActions from './TableActions'; // We will build this client component next

export default function TablePageWrapper({ params }: { params: Promise<{ id: string }> }) {
  // A wrapper to handle the `params` promise
  return <TablePage params={params} />;
}

async function TablePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  const { id } = await params;

  const table = await prisma.table.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      chipDenominations: { orderBy: { value: 'asc' } },
      players: {
        include: {
          user: { select: { id: true, name: true, email: true } },
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
  const isPlayer = table.players.some((p) => p.userId === session.user.id);
  
  // Quick absolute URL hack given NextJS server components no request
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const qrCodeDataUrl = await QRCode.toDataURL(`${baseUrl}/tables/${table.id}`);

  return (
    <div className="container">
      <div className="table-header card">
        <div className="table-header-content">
          <div>
            <h1>{table.name}</h1>
            <p className="subtitle">Organized by {table.organizer.name}</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <span className={`badge ${table.status === 'OPEN' ? 'badge-success' : 'badge-neutral'}`}>
                {table.status}
              </span>
              <span className="badge badge-primary">
                {table.players.length} / {table.maxPlayers} Players
              </span>
              <span className="badge badge-secondary">
                Buy-in: ${table.buyInAmount}
              </span>
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
          <section className="card">
            <h2>Players at Table</h2>
            {table.players.length === 0 ? (
              <p className="empty-state">No players have joined yet.</p>
            ) : (
              <ul className="player-list">
                {table.players.map((player) => (
                  <li key={player.id} className="player-list-item">
                    <div className="avatar">{player.user.name[0]}</div>
                    <div className="player-info">
                      <strong>{player.user.name}</strong>
                      <span className="player-status text-sm text-success">{player.status}</span>
                    </div>
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
                    <div className="chip-val">${chip.value}</div>
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
            isFull={table.players.length >= table.maxPlayers}
          />
        </div>
      </div>
    </div>
  );
}

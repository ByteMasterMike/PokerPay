import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DepositClient from './DepositClient';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  const userId = session.user.id;
  const isOrganizer = session.user.role === 'ORGANIZER';

  // Fetch data in parallel
  const [dbUser, organizedTables, joinedTables, ledgerEntries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    }),
    isOrganizer
      ? prisma.table.findMany({
          where: { organizerId: userId },
          include: { _count: { select: { players: true } } },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
    prisma.tablePlayer.findMany({
      where: { userId },
      include: { table: { include: { organizer: true } } },
      orderBy: { joinedAt: 'desc' },
    }),
    prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const balance = dbUser?.balance || 0;
  const totalPnL = ledgerEntries.reduce((acc, entry) => acc + (entry.type !== 'DEPOSIT' ? entry.amount : 0), 0);

  return (
    <div className="container page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {session.user.name}</p>
      </header>

      <section className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">${balance.toFixed(2)}</div>
          <div className="stat-label">Current Balance</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: totalPnL >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
          <div className="stat-label">Net Profit/Loss</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{joinedTables.length}</div>
          <div className="stat-label">Active Sessions</div>
        </div>
      </section>

      <div className="dashboard-grid">
        <div style={{ gridColumn: 'span 2' }}>
          <section className="dashboard-section" style={{ marginBottom: 'var(--space-8)' }}>
            <DepositClient currentBalance={balance} />
          </section>

          {isOrganizer && (
            <section className="dashboard-section" style={{ marginBottom: 'var(--space-8)' }}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2>Your Organized Tables</h2>
                <Link href="/tables/create" className="btn btn-primary btn-sm">+ Create Table</Link>
              </div>
              
              {organizedTables.length === 0 ? (
                <div className="card text-center" style={{ padding: 'var(--space-10)' }}>
                  <p className="text-muted">You haven&apos;t created any tables yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  {organizedTables.map((table) => (
                    <Link href={`/tables/${table.id}`} key={table.id} className="table-card">
                      <div className="table-card-header">
                        <div className="table-card-name">{table.name}</div>
                        <span className={`badge ${table.status === 'OPEN' ? 'badge-open' : 'badge-closed'}`}>
                          {table.status}
                        </span>
                      </div>
                      <div className="table-card-meta">
                        <div className="table-card-meta-item">
                          <span className="table-card-meta-label">Players</span>
                          <span className="table-card-meta-value">{table._count.players} / {table.maxPlayers}</span>
                        </div>
                        <div className="table-card-meta-item">
                          <span className="table-card-meta-label">Buy-in</span>
                          <span className="table-card-meta-value">${table.buyInAmount}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="dashboard-section">
            <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
              <h2>Active Game Sessions</h2>
            </div>
            {joinedTables.length === 0 ? (
              <div className="card text-center" style={{ padding: 'var(--space-10)' }}>
                <p className="text-muted">You are not currently in any games.</p>
                {!isOrganizer && (
                  <Link href="/tables/join" className="btn btn-primary mt-4">Join a Table</Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                {joinedTables.map(({ table, status }) => (
                  <Link href={`/tables/${table.id}`} key={table.id} className="table-card">
                    <div className="table-card-header">
                      <div className="table-card-name">{table.name}</div>
                      <span className={`badge ${status === 'ACTIVE' ? 'badge-gold' : 'badge-neutral'}`}>
                        {status}
                      </span>
                    </div>
                    <div className="table-card-body">
                      <p className="text-sm text-muted">Organized by {table.organizer.name}</p>
                      <p className="text-sm">Buy-in: ${table.buyInAmount}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="sidebar">
          <section className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-gold)' }}>Recent Activity</h3>
            {ledgerEntries.length === 0 ? (
              <p className="text-sm text-muted">No recent transactions.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {ledgerEntries.map((entry) => (
                  <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{entry.type.replace('_', ' ')}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: entry.amount >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {entry.amount >= 0 ? '+' : ''}${Math.abs(entry.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/ledger" className="text-xs text-center mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  View Full History →
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

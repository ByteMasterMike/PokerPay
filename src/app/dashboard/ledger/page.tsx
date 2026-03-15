import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function LedgerPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  const ledgerEntries = await prisma.ledgerEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1>Transaction History</h1>
          <p className="subtitle">Full ledger of all your PokerPay activity</p>
        </div>
        <Link href="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </header>

      <section className="card" style={{ marginTop: 'var(--space-6)' }}>
        {ledgerEntries.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: 'var(--space-10)' }}>
            No transactions yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ledgerEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                    {entry.type.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    {entry.description ?? new Date(entry.createdAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 'var(--text-lg)',
                    color: Number(entry.amount) >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                  }}
                >
                  {Number(entry.amount) >= 0 ? '+' : ''}${Math.abs(Number(entry.amount)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

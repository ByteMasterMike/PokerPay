import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function JoinTablePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return (
    <div className="container" style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
      <h1>Join a Table</h1>
      <p className="subtitle">To join a poker table, scan the QR code at the table location.</p>

      <div className="card" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📱</div>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>How to Join</h2>
        <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
          Ask the table organizer to show you the QR code, or find it displayed at the table. Scan it with your phone camera to open the table page, then tap &quot;Join Table&quot; to buy in.
        </p>
        <Link href="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

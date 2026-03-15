'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

export default function JoinTablePage() {
  const [scanning, setScanning] = useState(false);

  return (
    <div className="container" style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
      <h1>Join a Table</h1>
      <p className="subtitle">Scan the QR code displayed by your table organizer.</p>

      <div className="card" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📷</div>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Scan to Join</h2>
        <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
          Ask the organizer to open their table page and show you the QR code.
          Tap the button below to open your camera and scan it.
        </p>

        <button
          className="btn btn-primary btn-lg btn-block"
          onClick={() => setScanning(true)}
        >
          Open Camera &amp; Scan QR
        </button>

        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <Link href="/dashboard" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {scanning && <QRScanner onClose={() => setScanning(false)} />}
    </div>
  );
}

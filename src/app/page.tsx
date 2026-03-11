import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-content">
          <h1>Trustless Table Banking for Poker Clubs</h1>
          <p>
            No more designated banker. Players deposit via QR code into an
            isolated table account. Count your chips, cash out instantly.
            Track your P&L across every session.
          </p>
          <div className="hero-buttons">
            <Link href="/auth/register" className="btn btn-lg btn-primary">
              ♠ Get Started Free
            </Link>
            <Link href="/auth/login" className="btn btn-lg btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3>QR Code Buy-In</h3>
          <p>
            Scan the table&apos;s QR code with your phone. Confirm your deposit.
            Funds go straight to the table&apos;s isolated account — zero trust required.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Isolated Table Accounts</h3>
          <p>
            Every table has its own virtual bank account. No commingling of
            personal funds. No one person holds all the money.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎰</div>
          <h3>Chip Count Cashout</h3>
          <p>
            Enter your chip counts by denomination. The app calculates your
            exact payout. Funds transfer directly to your linked account.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>P&L Tracking</h3>
          <p>
            Automatic session history. See your all-time, monthly, and
            per-table profit and loss. Know exactly where you stand.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Instant Setup</h3>
          <p>
            Create a table in seconds. Configure chip denominations, set
            the buy-in, and share the QR code. Players join immediately.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🏆</div>
          <h3>Club Management</h3>
          <p>
            Organizers get a real-time dashboard showing pot size, active
            players, and session history. Close tables with one tap.
          </p>
        </div>
      </section>
    </div>
  );
}

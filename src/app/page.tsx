import Link from 'next/link';

export default function Home() {
  return (
    <>
      <div className="container">
        <section className="hero">
          <div className="hero-content">
            <div className="hero-eyebrow">
              ♠ ♥ ♦ ♣
            </div>
            <h1>
              Trustless Table Banking<br />
              for <em>Serious Players</em>
            </h1>
            <p>
              No designated banker. No disputes. Players deposit via QR code,
              cash out by chip count, and track their P&amp;L across every session.
            </p>
            <div className="hero-buttons">
              <Link href="/auth/register" className="btn btn-lg btn-primary">
                ♠ Get Started Free
              </Link>
              <Link href="/auth/login" className="btn btn-lg btn-outline">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="container">
        <section className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">📱</span>
            <h3>QR Code Buy-In</h3>
            <p>
              Scan the table&apos;s QR code. Confirm your deposit.
              Funds flow straight to the table&apos;s isolated account — zero trust required.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🔒</span>
            <h3>Isolated Table Accounts</h3>
            <p>
              Every table has its own virtual bank account. No commingling of
              personal funds. No single person holds the money.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🎰</span>
            <h3>AI Chip Counting</h3>
            <p>
              Snap a photo of your chip stack. Our AI counts by denomination
              and calculates your exact payout in seconds.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>P&amp;L Tracking</h3>
            <p>
              Automatic session history. See your all-time, monthly, and
              per-table profit and loss. Know exactly where you stand.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Instant Setup</h3>
            <p>
              Create a table in seconds. Configure chip denominations, set
              the buy-in, and share the QR code. Players join immediately.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🏆</span>
            <h3>Club Management</h3>
            <p>
              Organizers get a real-time dashboard showing pot size, active
              players, and session history. Close tables with one tap.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

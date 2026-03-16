import Link from 'next/link';

export default function Home() {
  return (
    <>
      <div className="container">
        <section className="hero">
          <div className="hero-content">
            <div className="hero-eyebrow">
              ♠ &nbsp; ♥ &nbsp; ♦ &nbsp; ♣ &nbsp;— Home Game Banking
            </div>
            <h1>
              Trustless<br />
              Table<br />
              <em>Banking.</em>
            </h1>
            <p>
              No designated banker. No disputes. Players request to join,
              organizers confirm cash — then chip count, cash out, track P&amp;L.
              Every session. Every table.
            </p>
            <div className="hero-buttons">
              <Link href="/auth/register" className="btn btn-lg btn-primary">
                ♠ &nbsp;Get Started Free
              </Link>
              <Link href="/auth/login" className="btn btn-lg btn-secondary">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="container">
        <section className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">♠</span>
            <h3>Payment Confirmation</h3>
            <p>
              Players request a seat. Organizer confirms cash received,
              then approves — no auto-deduction until you say so.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">♥</span>
            <h3>Isolated Table Accounts</h3>
            <p>
              Every table has its own virtual bank. No commingling of
              personal funds. Nobody holds the pot.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">♦</span>
            <h3>Chip Counter</h3>
            <p>
              Tap + / − or type a count per denomination.
              Total calculates instantly. One-tap cashout confirmation.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">♣</span>
            <h3>Payout Summary</h3>
            <p>
              When you close the table, get a full breakdown: who to pay,
              how much, and each player&apos;s net gain or loss for the night.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Live Table Updates</h3>
            <p>
              The table page refreshes automatically. See players join,
              approve requests, and watch cashouts happen in real time.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>P&amp;L Tracking</h3>
            <p>
              Full ledger history across every session. Know your exact
              all-time profit and loss without a spreadsheet.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <div className="brand-icon">♠</div>
          <span>PokerPay</span>
        </Link>

        <div className="navbar-links">
          {session ? (
            <>
              <Link href="/dashboard" className="navbar-link">
                Dashboard
              </Link>
              <Link href="/tables/join" className="navbar-link">
                Join Table
              </Link>
              <div className="navbar-user">
                <span className="navbar-user-role">
                  {(session.user as { role?: string }).role || 'PLAYER'}
                </span>
                <span className="navbar-user-name">{session.user?.name}</span>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="navbar-link">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn btn-sm btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

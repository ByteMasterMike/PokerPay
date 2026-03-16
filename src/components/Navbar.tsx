'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, ScanLine, Spade } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 no-underline hover:no-underline group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-[0_0_16px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_24px_rgba(249,115,22,0.5)] transition-shadow">
            <Spade className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-[1.15rem] font-extrabold tracking-tight text-foreground">
            PokerPay
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/tables/join">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  <ScanLine className="h-3.5 w-3.5" />
                  Join Table
                </Button>
              </Link>

              <div className="ml-2 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {session.user?.name?.[0]?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-xs font-medium text-muted-foreground sm:block">
                    {session.user?.name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-xs"
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

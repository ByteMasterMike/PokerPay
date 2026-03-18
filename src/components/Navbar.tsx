'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, ScanLine, Spade, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tables/join', label: 'Join Table', icon: ScanLine },
];

export default function Navbar() {
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 8);
  });

  return (
    <motion.nav
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl"
      animate={{ borderBottomWidth: scrolled ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      style={{ borderBottomColor: 'hsl(var(--border))' }}
    >
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
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {session ? (
            <>
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link key={href} href={href} className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1.5 transition-colors ${
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </Button>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-[17px] left-2 right-2 h-[2px] rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </Link>
                );
              })}

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
    </motion.nav>
  );
}

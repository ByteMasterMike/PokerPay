'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Spade, Heart, Diamond, Club, Zap, BarChart3,
  QrCode, CheckCircle2, ArrowRight, TrendingUp,
} from 'lucide-react';

/* ─── tiny helpers ─────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function InViewFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated table-card mockup (hero right panel) ───────── */
const mockPlayers = [
  { name: 'Jordan L.', status: 'ACTIVE',     chips: '$340' },
  { name: 'Maya P.',   status: 'ACTIVE',     chips: '$180' },
  { name: 'Alex K.',   status: 'CASHED_OUT', chips: '$520' },
  { name: 'Sam R.',    status: 'ACTIVE',     chips: '$90'  },
];

function TableMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.35 }}
      className="relative w-full max-w-sm mx-auto lg:mx-0"
    >
      {/* Glow behind card */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/20 blur-3xl scale-95 -z-10" />

      <div className="rounded-2xl border border-border/70 bg-card shadow-2xl overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Friday Night</p>
            <p className="font-display font-extrabold text-foreground">High Stakes Table</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[0.65rem] font-bold text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            LIVE
          </span>
        </div>

        {/* Player rows */}
        <div className="divide-y divide-border/40">
          {mockPlayers.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {p.name[0]}
                </div>
                <span className="text-sm font-medium text-foreground">{p.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-foreground">{p.chips}</span>
                <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold ${
                  p.status === 'CASHED_OUT'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-emerald-400/10 text-emerald-400'
                }`}>
                  {p.status === 'CASHED_OUT' ? 'OUT' : 'IN'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-5 py-3">
          <span className="text-xs text-muted-foreground">$100 buy-in · 4 players</span>
          <span className="font-mono text-xs font-bold text-primary">$1,130 in play</span>
        </div>
      </div>

      {/* Floating P&L badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
        className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-card px-3 py-2 shadow-lg"
      >
        <TrendingUp className="h-4 w-4 text-emerald-400" />
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">Alex&apos;s P&amp;L</p>
          <p className="font-mono text-sm font-extrabold text-emerald-400">+$420.00</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Feature bento grid data ──────────────────────────────── */
const bentoFeatures = [
  {
    icon: QrCode,
    title: 'QR Join Flow',
    desc: 'Players scan a code to request a seat. Organizer confirms cash in hand, then approves — no auto-deduction until you say so.',
    large: true,
  },
  {
    icon: CheckCircle2,
    title: 'One-Tap Cashout',
    desc: 'Snap a photo of your stack, enter your chip counts, and cash out in seconds.',
    large: false,
  },
  {
    icon: BarChart3,
    title: 'P&L Tracking',
    desc: 'Full ledger every session. Know your all-time edge without a spreadsheet.',
    large: false,
  },
  {
    icon: Heart,
    title: 'Isolated Accounts',
    desc: 'Every table has its own virtual bank. No commingling. Nobody holds the pot.',
    large: false,
  },
  {
    icon: Zap,
    title: 'Live Updates',
    desc: 'Table page auto-refreshes. Watch joins, approvals, and cashouts in real time.',
    large: false,
  },
  {
    icon: Club,
    title: 'Payout Summary',
    desc: 'Close the table and get a full breakdown — who owes who, net for every player.',
    large: true,
  },
];

/* ─── How it works steps ────────────────────────────────────── */
const steps = [
  {
    n: '01',
    icon: QrCode,
    title: 'Host creates a table',
    desc: 'Set buy-in, chip denominations, and max players. Share the QR code.',
  },
  {
    n: '02',
    icon: CheckCircle2,
    title: 'Players join & are approved',
    desc: 'Players scan and request. Organizer confirms cash received, taps Approve.',
  },
  {
    n: '03',
    icon: CheckCircle2,
    title: 'Cash out and close the table',
    desc: 'Photo your stack, enter chip counts, organizer confirms. Get a full payout summary.',
  },
];

/* ─── Page ──────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background glows */}
        <div className="pointer-events-none absolute -top-32 right-1/4 h-[600px] w-[600px] rounded-full bg-primary/6 blur-[140px]" />
        <div className="pointer-events-none absolute top-24 -left-24 h-[360px] w-[360px] rounded-full bg-orange-700/5 blur-[100px]" />

        <div className="container">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — copy */}
            <div>
              <FadeUp delay={0}>
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  Home Game Banking, Reimagined
                </div>
              </FadeUp>

              <FadeUp delay={0.08}>
                <h1 className="font-display text-[clamp(3rem,8vw,5.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-foreground">
                  Trustless<br />
                  Table{' '}
                  <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                    Banking.
                  </span>
                </h1>
              </FadeUp>

              <FadeUp delay={0.16}>
                <p className="mt-6 max-w-[480px] text-base leading-relaxed text-muted-foreground">
                  No designated banker. No disputes. Players request to join, organizers confirm cash — then chip count, cash out, and track P&amp;L. Every session. Every table.
                </p>
              </FadeUp>

              <FadeUp delay={0.24}>
                <div className="mt-10 flex flex-wrap gap-3">
                  <Link href="/auth/register">
                    <Button size="lg" className="gap-2 px-7 shadow-[0_4px_28px_rgba(249,115,22,0.32)]">
                      <Spade className="h-4 w-4" />
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline" className="px-7">
                      Sign In
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </FadeUp>

              {/* Social proof micro-row */}
              <FadeUp delay={0.32}>
                <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Free to use
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Fast cashout flow
                  </span>
                </div>
              </FadeUp>
            </div>

            {/* Right — animated table mockup */}
            <div className="flex justify-center lg:justify-end">
              <TableMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-muted/30 py-20">
        <div className="container">
          <InViewFade>
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground">
                From table creation to payout in minutes
              </h2>
            </div>
          </InViewFade>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* connecting line (desktop) */}
            <div className="pointer-events-none absolute inset-x-0 top-[2.1rem] hidden border-t border-dashed border-border/60 md:block" style={{ left: '16.67%', right: '16.67%' }} />

            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <InViewFade key={step.n} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border/70 bg-card shadow-sm">
                      <Icon className="h-6 w-6 text-primary" />
                      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[0.6rem] font-extrabold text-white">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                </InViewFade>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ────────────────────────────────────── */}
      <section className="py-24">
        <div className="container">
          <InViewFade>
            <div className="mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Features</p>
              <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-foreground">
                Everything you need at the table
              </h2>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                Built for serious home games. Secure, fast, and stupidly simple to use.
              </p>
            </div>
          </InViewFade>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bentoFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <InViewFade key={f.title} className={f.large ? 'lg:col-span-2' : ''}>
                  <motion.div
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="group h-full rounded-2xl border border-border/60 bg-card p-7 shadow-sm transition-shadow hover:border-primary/30 hover:shadow-[0_8px_40px_rgba(249,115,22,0.08)]"
                  >
                    <motion.div
                      whileHover={{ scale: 1.08, rotate: 3 }}
                      transition={{ duration: 0.2 }}
                      className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <h3 className="font-display text-lg font-bold text-foreground">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>

                  </motion.div>
                </InViewFade>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border/50 py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[100px]" />

        <InViewFade>
          <div className="container relative text-center">
            <Diamond className="mx-auto mb-5 h-8 w-8 text-primary opacity-80" />
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
              Ready to run a cleaner game?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Free to use. No credit card. No banker needed.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="px-10 shadow-[0_4px_28px_rgba(249,115,22,0.32)]">
                  Start for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground">
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>
        </InViewFade>
      </section>
    </>
  );
}

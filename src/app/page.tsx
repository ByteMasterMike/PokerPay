'use client';

import Link from 'next/link';
import { motion, AnimatePresence, useAnimationFrame, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  ScanLine, ShieldCheck, Zap, Users,
  ArrowRight, QrCode, CheckCircle2, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ═══════════════════════════════════════════════════════════
   SVG CHIP  —  centered at (0,0), sized by r
═══════════════════════════════════════════════════════════ */

function SvgChip({ color, value, tc = '#fff', r = 16 }: {
  color: string; value: string; tc?: string; r?: number;
}) {
  const isLight = tc === '#000';
  const dash   = isLight ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.40)';
  const border = isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.24)';
  return (
    <g>
      <circle r={r} fill={color} />
      <circle r={r} fill="none" stroke={dash}
        strokeWidth={r * 0.28} strokeDasharray={`${r * 0.42} ${r * 0.22}`} />
      <circle r={r * 0.64} fill={color} />
      <circle r={r * 0.64} fill="none" stroke={border} strokeWidth="1.5" />
      <text textAnchor="middle" dominantBaseline="central"
        fill={tc} fontSize={r * 0.48} fontWeight="700" fontFamily="ui-monospace,monospace">
        {value}
      </text>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════
   HERO SVG  —  phone + orbiting chips + scan animation
═══════════════════════════════════════════════════════════ */

const CX = 260, CY = 228;
const ORX = 150, ORY = 54;
const PL = 183, PT = 78;           // phone left / top
const SL = PL + 2, ST = PT + 12;  // screen left / top

const ORBIT = [
  { color: '#ef4444', value: '$5',   tc: '#fff', phase: 0      },
  { color: '#22c55e', value: '$25',  tc: '#fff', phase: 1.257  },
  { color: '#111827', value: '$100', tc: '#fff', phase: 2.513  },
  { color: '#f0f0f0', value: '$1',   tc: '#000', phase: 3.770  },
  { color: '#f97316', value: '$50',  tc: '#fff', phase: 5.027  },
] as const;

const ROWS = [
  { color: '#f0f0f0', tc: '#000', label: 'White', n: 3, sub: '$3.00'    },
  { color: '#ef4444', tc: '#fff', label: 'Red',   n: 7, sub: '$35.00'   },
  { color: '#22c55e', tc: '#fff', label: 'Green', n: 4, sub: '$100.00'  },
  { color: '#111827', tc: '#fff', label: 'Black', n: 2, sub: '$200.00'  },
];

function HeroSVG() {
  const chipRefs    = useRef<(SVGGElement   | null)[]>([]);
  const scanRectRef = useRef<SVGRectElement | null>(null);
  const scanLineRef = useRef<SVGLineElement | null>(null);
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const phaseRef = useRef<0 | 1 | 2>(0);
  const t0 = useRef(-1);

  useAnimationFrame((t) => {
    // Chip orbit — direct DOM, no React re-render
    ORBIT.forEach((c, i) => {
      const a     = c.phase + t * 0.00028;
      const x     = CX + ORX * Math.cos(a);
      const y     = CY + ORY * Math.sin(a);
      const depth = (Math.sin(a) + 1) / 2;
      const el    = chipRefs.current[i];
      if (el) {
        el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(0.72 + 0.28 * depth).toFixed(3)})`);
        el.setAttribute('opacity',   (0.50 + 0.50 * depth).toFixed(3));
      }
    });

    // Scan cycle timing
    if (t0.current < 0) t0.current = t;
    const e = t - t0.current;
    const np: 0 | 1 | 2 = e < 1200 ? 0 : e < 3400 ? 1 : 2;
    if (np !== phaseRef.current) { phaseRef.current = np; setPhase(np); }
    if (e > 6200) t0.current = t;

    // Scan line — direct DOM
    const sr = scanRectRef.current, sl = scanLineRef.current;
    if (sr && sl) {
      if (phaseRef.current === 1) {
        const prog = Math.min((e - 1200) / 2200, 1);
        const sy   = ST + 20 + prog * 246;
        sr.setAttribute('y', String(sy - 18));
        sr.style.display = sl.style.display = 'block';
        sl.setAttribute('y1', String(sy)); sl.setAttribute('y2', String(sy));
      } else {
        sr.style.display = sl.style.display = 'none';
      }
    }
  });

  return (
    <svg viewBox="0 0 520 460" className="w-full max-w-xl h-auto" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="hglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <clipPath id="scrclip">
          <rect x={SL} y={ST} width="152" height="270" rx="12" />
        </clipPath>
        <filter id="psh">
          <feDropShadow dx="0" dy="10" stdDeviation="22" floodColor="#f97316" floodOpacity="0.22" />
        </filter>
        <linearGradient id="sgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f97316" stopOpacity="0"    />
          <stop offset="50%"  stopColor="#f97316" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0"    />
        </linearGradient>
      </defs>

      {/* Ambient glow + orbit trail */}
      <ellipse cx={CX} cy={CY} rx="238" ry="200" fill="url(#hglow)" />
      <ellipse cx={CX} cy={CY} rx={ORX} ry={ORY} fill="none"
        stroke="#f97316" strokeWidth="0.5" strokeDasharray="3 9" opacity="0.12" />

      {/* Orbiting chips — positioned via RAF refs */}
      {ORBIT.map((c, i) => (
        <g key={i} ref={el => { chipRefs.current[i] = el; }} opacity="0">
          <SvgChip color={c.color} value={c.value} tc={c.tc} r={16} />
        </g>
      ))}

      {/* Phone frame */}
      <rect x={PL} y={PT} width="154" height="304" rx="22"
        fill="#0f172a" stroke="#1e293b" strokeWidth="2" filter="url(#psh)" />
      <rect x={SL} y={ST} width="152" height="270" rx="12" fill="#070d1a" />

      {/* ── App UI clipped to phone screen ── */}
      <g clipPath="url(#scrclip)">
        {/* Header bar */}
        <rect x={SL} y={ST} width="152" height="36" fill="#f97316" />
        <text x={CX} y={ST + 23} textAnchor="middle" fill="white"
          fontSize="11" fontWeight="800" fontFamily="'Inter',system-ui">
          Count Your Stack
        </text>

        {/* Chip denomination rows */}
        {ROWS.map((row, i) => (
          <g key={i}>
            <rect x={SL} y={ST + 38 + i * 40} width="152" height="38"
              fill={i % 2 === 0 ? '#070d1a' : '#0c1428'} />
            <circle cx={SL + 16} cy={ST + 57 + i * 40} r="10" fill={row.color} />
            <text x={SL + 32} y={ST + 52 + i * 40} fill="#3d5166" fontSize="8" fontFamily="system-ui">
              {row.label} ×{row.n}
            </text>
            <text x={SL + 146} y={ST + 63 + i * 40} textAnchor="end"
              fill={phase === 2 ? '#34d399' : '#0f2336'} fontSize="10" fontWeight="700"
              fontFamily="ui-monospace,monospace">
              {phase === 2 ? row.sub : '$—'}
            </text>
          </g>
        ))}

        {/* Total bar */}
        <rect x={SL} y={ST + 198} width="152" height="44" fill="#061510" />
        <text x={SL + 12} y={ST + 223} fill="#166534" fontSize="9" fontFamily="system-ui" fontWeight="600">TOTAL</text>
        <text x={SL + 146} y={ST + 225} textAnchor="end"
          fill={phase === 2 ? '#34d399' : '#0a1f0e'} fontSize="18" fontWeight="800" fontFamily="ui-monospace,monospace">
          {phase === 2 ? '$338' : '$—'}
        </text>

        {/* Cash Out button (phase 2) */}
        {phase === 2 && (
          <g>
            <rect x={SL + 8} y={ST + 248} width="136" height="28" rx="7" fill="#f97316" />
            <text x={CX} y={ST + 267} textAnchor="middle" fill="white"
              fontSize="10" fontWeight="700" fontFamily="system-ui">
              Cash Out $338.00
            </text>
          </g>
        )}

        {/* Scan line — DOM-driven via refs */}
        <rect ref={scanRectRef} x={SL} y={ST + 20} width="152" height="36"
          fill="url(#sgrad)" opacity="0.9" style={{ display: 'none' }} />
        <line ref={scanLineRef} x1={SL} y1={ST + 38} x2={SL + 152} y2={ST + 38}
          stroke="#f97316" strokeWidth="1.5" opacity="0.85" style={{ display: 'none' }} />
      </g>

      {/* Notch + home bar */}
      <rect x="230" y={PT + 6} width="60" height="10" rx="5" fill="#0f172a" />
      <circle cx="298" cy={PT + 11} r="3" fill="#1e293b" />
      <rect x="240" y={PT + 298} width="40" height="4" rx="2" fill="#1e293b" />

      {/* Phase 2 floating badges */}
      <AnimatePresence>
        {phase === 2 && (
          <>
            <motion.g key="ai"
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <rect x="348" y="162" width="118" height="30" rx="8" fill="#059669" />
              <text x="407" y="182" textAnchor="middle" fill="white"
                fontSize="10" fontWeight="700" fontFamily="system-ui">✓ AI Verified</text>
            </motion.g>
            <motion.g key="wallet"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.35 }}>
              <rect x="52" y="234" width="124" height="30" rx="8" fill="#f97316" />
              <text x="114" y="254" textAnchor="middle" fill="white"
                fontSize="10" fontWeight="700" fontFamily="system-ui">$338 → Wallet</text>
            </motion.g>
          </>
        )}
      </AnimatePresence>

      {/* Idle hint */}
      {phase === 0 && (
        <g opacity="0.65">
          <rect x="52" y="220" width="128" height="30" rx="8"
            fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="116" y="240" textAnchor="middle" fill="#94a3b8"
            fontSize="9" fontFamily="system-ui">📷 Tap to scan</text>
        </g>
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   COUNT-UP  — triggers once on scroll-into-view
═══════════════════════════════════════════════════════════ */

function CountUp({ to, prefix = '', suffix = '', duration = 1100 }: {
  to: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick  = () => {
      const prog  = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setV(Math.round(eased * to));
      if (prog < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, duration]);

  return <span ref={ref}>{prefix}{v.toLocaleString()}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD PROTOTYPE  —  browser-frame mockup
═══════════════════════════════════════════════════════════ */

const MOCK_TABLES = [
  { name: 'Friday Night Poker',    buyin: 50,  players: 6, max: 8,  status: 'OPEN'   },
  { name: 'High Stakes Saturday',  buyin: 200, players: 4, max: 6,  status: 'OPEN'   },
  { name: 'Last Week — Friendly',  buyin: 50,  players: 8, max: 8,  status: 'CLOSED' },
  { name: 'Monthly Tournament',    buyin: 100, players: 5, max: 10, status: 'CLOSED' },
] as const;

const MOCK_PLAYERS = [
  { name: 'Mike S.',   status: 'ACTIVE',     amount: null  },
  { name: 'Jordan L.', status: 'ACTIVE',     amount: null  },
  { name: 'Alex T.',   status: 'CASHED_OUT', amount: 127.50 },
  { name: 'Sam K.',    status: 'ACTIVE',     amount: null  },
  { name: 'Chris P.',  status: 'PENDING',    amount: null  },
  { name: 'Riley M.',  status: 'ACTIVE',     amount: null  },
] as const;

function MockTableRow({ name, buyin, players, max, status }: typeof MOCK_TABLES[0]) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 hover:border-primary/30 transition-colors cursor-pointer">
      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${status === 'OPEN' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">${buyin} buy-in · {players}/{max} players</p>
      </div>
      <span className={`text-[0.62rem] font-bold px-2 py-0.5 rounded-full ${
        status === 'OPEN'
          ? 'bg-emerald-500/10 text-emerald-600'
          : 'bg-muted text-muted-foreground'
      }`}>{status}</span>
    </div>
  );
}

function DashboardPrototype() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <Badge variant="outline" className="mb-4 border-primary/25 bg-primary/8 text-primary text-xs font-semibold">
            Dashboard Preview
          </Badge>
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
            Everything your organizer needs.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
            One screen to run your night — create tables, approve players, and watch the P&amp;L update live.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-2xl border border-border/60 shadow-[0_24px_80px_rgba(0,0,0,0.08)] overflow-hidden"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/60 border-b border-border/60">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <div className="flex-1 mx-4 max-w-xs">
              <div className="rounded-md bg-background border border-border/60 px-3 py-1 text-[0.65rem] text-muted-foreground font-mono">
                pokerpay.app/dashboard
              </div>
            </div>
          </div>

          {/* App content */}
          <div className="bg-background p-6 lg:p-8">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Your Balance',    val: <CountUp to={1240} prefix="$" />,  sub: 'Available to withdraw', cls: 'text-foreground' },
                { label: 'Active Tables',   val: <CountUp to={2} />,                sub: 'Running right now',      cls: 'text-foreground' },
                { label: 'Players Tonight', val: <CountUp to={14} />,               sub: 'Across all tables',      cls: 'text-foreground' },
                { label: 'All-Time P&L',    val: <CountUp to={340} prefix="+$" />,  sub: 'Net across 32 sessions', cls: 'text-emerald-600' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
                  <p className={`font-display text-2xl font-extrabold ${s.cls}`}>{s.val}</p>
                  <p className="text-[0.65rem] text-muted-foreground mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Two-column */}
            <div className="grid lg:grid-cols-[1fr_300px] gap-6">
              {/* Table list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-foreground">Your Tables</h3>
                  <span className="text-[0.62rem] bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full cursor-pointer hover:bg-primary/15 transition-colors">
                    + New Table
                  </span>
                </div>
                {MOCK_TABLES.map((t) => <MockTableRow key={t.name} {...t} />)}
              </div>

              {/* Detail panel */}
              <div className="rounded-xl border border-primary/20 bg-primary/3 p-4 space-y-4">
                <div>
                  <p className="text-[0.65rem] text-muted-foreground font-medium uppercase tracking-wide">Selected</p>
                  <h4 className="font-display font-extrabold text-foreground">Friday Night Poker</h4>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[0.62rem] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full">OPEN</span>
                    <span className="text-[0.62rem] bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full">$50 buy-in</span>
                    <span className="text-[0.62rem] bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full">6/8 players</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {MOCK_PLAYERS.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white flex-shrink-0 ${
                        p.status === 'ACTIVE'     ? 'bg-primary'     :
                        p.status === 'CASHED_OUT' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}>{p.name[0]}</div>
                      <span className="flex-1 text-xs font-medium text-foreground truncate">{p.name}</span>
                      {p.amount != null
                        ? <span className="font-mono text-xs text-emerald-600 font-bold">${(p.amount as number).toFixed(2)}</span>
                        : <span className={`text-[0.62rem] font-semibold ${p.status === 'PENDING' ? 'text-amber-500' : 'text-emerald-600'}`}>
                            {p.status === 'PENDING' ? '⏳ Pending' : '♠ Playing'}
                          </span>
                      }
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="w-full rounded-lg bg-amber-500/10 text-amber-600 text-xs font-bold py-2 text-center cursor-pointer hover:bg-amber-500/18 transition-colors">
                    1 Pending Approval →
                  </div>
                  <div className="w-full rounded-lg bg-destructive/8 text-destructive text-xs font-bold py-2 text-center cursor-pointer hover:bg-destructive/14 transition-colors">
                    Close Table
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE SECTIONS
═══════════════════════════════════════════════════════════ */

const FEATURES = [
  {
    icon: ScanLine,
    title: 'AI Chip Recognition',
    desc: 'Point your camera at any stack. Gemini Vision identifies every denomination and tallies the total in seconds. No manual counting, ever.',
    tag: 'Gemini 2.0 Flash',
  },
  {
    icon: QrCode,
    title: 'QR-Code Join Flow',
    desc: 'Players scan once. You approve with a tap after confirming their cash. Buy-in deducts automatically — no IOUs, no Venmo promises.',
    tag: 'Instant onboarding',
  },
  {
    icon: ShieldCheck,
    title: 'Tamper-Proof Ledger',
    desc: 'Every buy-in and cashout is an ACID transaction on PostgreSQL. Overdraft protection built in. Full audit trail, always.',
    tag: 'ACID compliant',
  },
  {
    icon: Zap,
    title: 'Instant Settlement',
    desc: 'Winnings hit player wallets the moment the table closes. Full P&L history across every session — no spreadsheet required.',
    tag: 'Real-time',
  },
] as const;

const STEPS = [
  {
    n: '01', icon: Layers,      title: 'Create a Table',
    desc: 'Name your game, set the buy-in, configure chip denominations. Takes 30 seconds.',
  },
  {
    n: '02', icon: Users,       title: 'Players Scan In',
    desc: 'Share your QR code. Each player scans, you confirm cash received, approve their seat with one tap.',
  },
  {
    n: '03', icon: CheckCircle2, title: 'AI Counts, App Pays',
    desc: 'Players photograph their stack. Gemini reads every chip. Cashout hits their wallet instantly.',
  },
] as const;

export default function Home() {
  return (
    <main className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-28">
        <div className="pointer-events-none absolute -top-40 right-1/3 h-[600px] w-[600px] rounded-full bg-primary/6 blur-[140px]" />
        <div className="pointer-events-none absolute top-10 -left-20 h-[300px] w-[300px] rounded-full bg-orange-400/5 blur-[90px]" />

        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <Badge variant="outline" className="mb-6 border-primary/25 bg-primary/8 text-primary gap-1.5 text-xs font-semibold">
                  ♠ Home Game Banking, Reimagined
                </Badge>
              </motion.div>

              <motion.h1
                className="font-display text-[clamp(2.8rem,7vw,5rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-foreground"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
              >
                End-of-Night<br />
                Payouts in{' '}
                <span className="text-primary">Seconds.</span>
              </motion.h1>

              <motion.p
                className="mt-6 text-[1.05rem] leading-relaxed text-muted-foreground max-w-md"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.16 }}
              >
                AI reads your chip stacks. PokerPay calculates the math. Every buy-in lives on an immutable ledger. The only thing disputed is whose bluff was worse.
              </motion.p>

              <motion.div
                className="mt-10 flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.24 }}
              >
                <Link href="/auth/register">
                  <Button size="lg" className="gap-2 px-8 shadow-[0_4px_28px_rgba(249,115,22,0.30)]">
                    Start a Table Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="px-8">Sign In</Button>
                </Link>
              </motion.div>

              {/* Trust signals */}
              <motion.div
                className="mt-10 flex flex-wrap gap-8"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              >
                {[
                  { label: '< 30 sec', sub: 'avg chip scan' },
                  { label: '100%',     sub: 'audit coverage' },
                  { label: '$0',       sub: 'manual math'   },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-2xl font-extrabold text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Animated SVG */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.12 }}
            >
              <HeroSVG />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="py-24 border-t border-border/40">
        <div className="container">
          <motion.div
            className="mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
              Built for serious home games.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md">
              Every feature exists to eliminate the three things that kill the vibe: money disputes, slow payouts, and shady counts.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-7 shadow-sm hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(249,115,22,0.07)] transition-all duration-200"
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, delay: i * 0.08 }}
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  <div className="mt-4">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary/70 border border-primary/20 bg-primary/5 px-2 py-0.5 rounded-full">
                      {f.tag}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-24 bg-secondary/40 border-y border-border/40">
        <div className="container">
          <motion.div
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
              Live in three steps.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              No spreadsheets. No Venmo threads. No disputed counts.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-border/60" />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.n}
                  className="relative z-10 flex flex-col items-center text-center"
                  initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.45, delay: i * 0.12 }}
                >
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary/20 bg-card shadow-sm">
                    <Icon className="h-9 w-9 text-primary" />
                  </div>
                  <p className="font-mono text-xs font-bold text-primary/50 mb-1">{s.n}</p>
                  <h3 className="font-display text-xl font-extrabold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PROTOTYPE ──────────────────────────────── */}
      <DashboardPrototype />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container">
          <motion.div
            className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center shadow-[0_16px_64px_rgba(249,115,22,0.26)]"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }}
          >
            {/* Suit watermarks */}
            <div className="pointer-events-none absolute inset-0 select-none opacity-[0.07] font-bold">
              <span className="absolute top-4  left-8  text-7xl">♠</span>
              <span className="absolute top-6  right-12 text-5xl">♥</span>
              <span className="absolute bottom-6 left-16 text-6xl">♣</span>
              <span className="absolute bottom-4 right-8  text-7xl">♦</span>
            </div>

            <div className="relative">
              <h2 className="font-display text-4xl font-extrabold text-white tracking-tight">
                Ready to run your best game yet?
              </h2>
              <p className="mt-4 text-white/75 text-base max-w-md mx-auto">
                Free to use. No credit card. Your first table is live in under 2 minutes.
              </p>
              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" variant="secondary" className="px-10 font-bold shadow-lg">
                    Create Free Account <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="ghost"
                    className="px-8 text-white border border-white/30 hover:bg-white/10">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

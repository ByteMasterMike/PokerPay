'use client';

import { motion } from 'framer-motion';
import { Spade, TrendingUp, Shield, Zap } from 'lucide-react';

const highlights = [
  { icon: Shield, text: 'No designated banker needed' },
  { icon: TrendingUp, text: 'Track P&L across every session' },
  { icon: Zap, text: 'Fast chip-count cashout flow' },
];

export default function AuthPanel() {
  return (
    <div className="relative hidden h-full min-h-[calc(100vh-4rem)] overflow-hidden bg-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute -top-16 -left-16 h-[300px] w-[300px] rounded-full bg-orange-600/10 blur-[80px]" />

      {/* Top — brand */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_24px_rgba(249,115,22,0.5)]">
          <Spade className="h-5 w-5 text-white" />
        </div>
        <span className="font-display text-lg font-extrabold tracking-tight text-background">PokerPay</span>
      </motion.div>

      {/* Middle — headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        className="relative z-10 space-y-6"
      >
        <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-background">
          Trustless<br />
          Table{' '}
          <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            Banking.
          </span>
        </h2>

        <div className="space-y-3">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <motion.div
                key={h.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center gap-3 text-sm text-background/70"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/20">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                {h.text}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Bottom — tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="relative z-10 text-xs text-background/40"
      >
        © {new Date().getFullYear()} PokerPay · Free to use
      </motion.p>
    </div>
  );
}

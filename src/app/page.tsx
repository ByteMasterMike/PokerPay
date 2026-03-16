import Link from 'next/link';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/FadeIn';
import { Button } from '@/components/ui/button';
import { Spade, Heart, Diamond, Club, Zap, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Spade,
    title: 'Payment Confirmation',
    desc: 'Players request a seat. Organizer confirms cash received, then approves — no auto-deduction until you say so.',
  },
  {
    icon: Heart,
    title: 'Isolated Table Accounts',
    desc: 'Every table has its own virtual bank. No commingling of personal funds. Nobody holds the pot.',
  },
  {
    icon: Diamond,
    title: 'AI Chip Counter',
    desc: 'Snap a photo of your stack — Gemini Vision reads your denominations instantly. One-tap cashout confirmation.',
  },
  {
    icon: Club,
    title: 'Payout Summary',
    desc: 'When you close the table, get a full breakdown: who to pay, how much, and each player\'s net gain or loss.',
  },
  {
    icon: Zap,
    title: 'Live Table Updates',
    desc: 'The table page refreshes automatically. See players join, approve requests, and watch cashouts in real time.',
  },
  {
    icon: BarChart3,
    title: 'P&L Tracking',
    desc: 'Full ledger history across every session. Know your exact all-time profit and loss without a spreadsheet.',
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-36">
        {/* Background glow */}
        <div className="pointer-events-none absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="pointer-events-none absolute top-20 -left-20 h-[300px] w-[300px] rounded-full bg-orange-600/5 blur-[80px]" />

        <div className="container relative">
          <div className="max-w-2xl">
            <FadeIn>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
                <Spade className="h-3 w-3" />
                Home Game Banking, Reimagined
              </div>
            </FadeIn>

            <FadeIn delay={0.08}>
              <h1 className="font-display text-[clamp(2.8rem,8vw,5.5rem)] font-extrabold leading-[1.03] tracking-[-0.03em] text-foreground">
                Trustless<br />
                Table{' '}
                <span className="text-primary">Banking.</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.16}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
                No designated banker. No disputes. Players request to join, organizers confirm cash — then chip count, cash out, track P&amp;L. Every session. Every table.
              </p>
            </FadeIn>

            <FadeIn delay={0.24}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="gap-2 px-8 shadow-[0_4px_24px_rgba(249,115,22,0.3)]">
                    <Spade className="h-4 w-4" />
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="px-8">
                    Sign In
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-24">
        <div className="container">
          <div className="mb-12">
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
              Everything you need at the table
            </h2>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground">
              Built for serious home games. Secure, fast, and stupidly simple to use.
            </p>
          </div>

          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <StaggerItem key={f.title}>
                  <div className="group h-full rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(249,115,22,0.08)]">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display font-bold text-foreground">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border/60 py-20">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Ready to run a cleaner game?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Free to use. No credit card required.
          </p>
          <div className="mt-8">
            <Link href="/auth/register">
              <Button size="lg" className="px-10 shadow-[0_4px_24px_rgba(249,115,22,0.3)]">
                Start for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

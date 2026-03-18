import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Suspense } from 'react';
import { Plus, ArrowRight, Clock, BarChart2 } from 'lucide-react';
import TableFilter from '@/components/TableFilter';
import PnlChart, { type PnlPoint } from '@/components/PnlChart';
import DashboardStats from './DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FadeIn } from '@/components/FadeIn';

type FilterValue = 'all' | 'open' | 'closed';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter: FilterValue = rawFilter === 'all' || rawFilter === 'closed' ? rawFilter : 'open';

  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const userId = session.user.id;

  const [organizedTables, joinedTables, cashedOutSessions, ledgerEntries] = await Promise.all([
    prisma.table.findMany({
      where: { organizerId: userId, ...(filter !== 'all' ? { status: filter.toUpperCase() } : {}) },
      include: { _count: { select: { players: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tablePlayer.findMany({
      where: { userId },
      include: { table: { include: { organizer: true } } },
      orderBy: { joinedAt: 'desc' },
    }),
    prisma.tablePlayer.findMany({
      where: { userId, status: 'CASHED_OUT' },
      include: { table: { select: { buyInAmount: true, name: true } } },
      orderBy: { joinedAt: 'asc' },
    }),
    prisma.ledgerEntry.findMany({
      where: { userId, type: { not: 'DEPOSIT' } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  // Build time-series P&L from completed sessions
  let running = 0;
  const pnlPoints: PnlPoint[] = cashedOutSessions.map((s) => {
    const cost = (1 + (s.rebuys ?? 0)) * Number(s.table.buyInAmount);
    const sessionPnl = Number(s.cashoutAmount ?? 0) - cost;
    running += sessionPnl;
    return {
      date: new Date(s.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessionPnl,
      cumPnl: running,
    };
  });

  const totalPnL = running;
  const sessionCount = joinedTables.length;

  return (
    <div className="container py-10">
      {/* Page header */}
      <header className="mb-10">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Welcome back, <span className="font-semibold text-foreground">{session.user.name}</span>
        </p>
      </header>

      {/* Stat cards */}
      <DashboardStats
        totalPnL={totalPnL}
        sessionCount={sessionCount}
        cashedOutCount={cashedOutSessions.length}
      />

      {/* P&L Chart */}
      <FadeIn delay={0.1}>
        <Card className="mb-8 border-border/60 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart2 className="h-4 w-4 text-primary" />
              P&amp;L Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PnlChart data={pnlPoints} />
          </CardContent>
        </Card>
      </FadeIn>

      {/* Main grid */}
      <FadeIn delay={0.2}>
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">

        {/* Left column */}
        <div className="space-y-8">

          {/* Tables you're hosting */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold">Tables You&apos;re Hosting</h2>
              <div className="flex items-center gap-2">
                <Suspense>
                  <TableFilter current={filter} />
                </Suspense>
                <Link href="/tables/create">
                  <Button size="sm" className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Host a Game
                  </Button>
                </Link>
              </div>
            </div>

            {organizedTables.length === 0 ? (
              <Card className="border-dashed border-border/60 bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">You&apos;re not hosting any tables right now.</p>
                  <Link href="/tables/create" className="mt-4">
                    <Button variant="outline" size="sm">Host a Game</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {organizedTables.map((table) => (
                  <Link href={`/tables/${table.id}`} key={table.id} className="block no-underline group">
                    <Card className="border-border/60 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_0_1px_rgba(249,115,22,0.15)] hover:-translate-y-0.5">
                      <CardContent className="flex items-center justify-between p-5">
                        <div>
                          <p className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
                            {table.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground font-mono">
                            {table._count.players}/{table.maxPlayers} players · ${Number(table.buyInAmount)} buy-in
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={table.status === 'OPEN' ? 'success' : 'secondary'}>
                            {table.status}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Active sessions */}
          <section>
            <h2 className="mb-4 font-display text-lg font-bold">Active Game Sessions</h2>

            {joinedTables.length === 0 ? (
              <Card className="border-dashed border-border/60 bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">You&apos;re not in any active sessions.</p>
                  <Link href="/tables/join" className="mt-4">
                    <Button variant="outline" size="sm">Join a Table</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {joinedTables.map(({ table, status }) => (
                  <Link href={`/tables/${table.id}`} key={table.id} className="block no-underline group">
                    <Card className="border-border/60 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_0_1px_rgba(249,115,22,0.15)] hover:-translate-y-0.5">
                      <CardContent className="flex items-center justify-between p-5">
                        <div>
                          <p className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
                            {table.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Organized by {table.organizer.name} · ${Number(table.buyInAmount)} buy-in
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {status}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-20 border-border/60 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ledgerEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent transactions.</p>
              ) : (
                <div className="space-y-0">
                  {ledgerEntries.map((entry, i) => (
                    <div key={entry.id}>
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-xs font-semibold capitalize">
                            {entry.type.replace('_', ' ').toLowerCase()}
                          </p>
                          <p className="text-[0.68rem] text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className={`font-mono text-sm font-bold ${Number(entry.amount) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {Number(entry.amount) >= 0 ? '+' : ''}${Math.abs(Number(entry.amount)).toFixed(2)}
                        </p>
                      </div>
                      {i < ledgerEntries.length - 1 && <Separator className="opacity-50" />}
                    </div>
                  ))}
                  <div className="pt-2">
                    <Link href="/dashboard/ledger">
                      <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground">
                        View Full History <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </FadeIn>
    </div>
  );
}

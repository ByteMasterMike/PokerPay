import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function typeVariant(type: string) {
  if (type === 'DEPOSIT')  return 'success';
  if (type === 'BUY_IN')   return 'destructive';
  if (type === 'CASH_OUT') return 'success';
  return 'secondary' as const;
}

export default async function LedgerPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const ledgerEntries = await prisma.ledgerEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
            Transaction History
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Full ledger of all your PokerPay activity
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Button>
        </Link>
      </header>

      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{ledgerEntries.length} transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ledgerEntries.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <div>
              {ledgerEntries.map((entry, i) => (
                <div key={entry.id}>
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold capitalize">
                          {entry.type.replace('_', ' ').toLowerCase()}
                        </span>
                        <Badge variant={typeVariant(entry.type)} className="text-[0.6rem]">
                          {entry.type}
                        </Badge>
                      </div>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground">{entry.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className={`font-mono text-base font-bold tabular-nums ${Number(entry.amount) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {Number(entry.amount) >= 0 ? '+' : ''}${Math.abs(Number(entry.amount)).toFixed(2)}
                    </p>
                  </div>
                  {i < ledgerEntries.length - 1 && <Separator className="opacity-40" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedNumber from '@/components/AnimatedNumber';
import { StaggerContainer, StaggerItem } from '@/components/FadeIn';

interface DashboardStatsProps {
  totalPnL: number;
  sessionCount: number;
  cashedOutCount: number;
}

export default function DashboardStats({ totalPnL, sessionCount, cashedOutCount }: DashboardStatsProps) {
  const isPositive = totalPnL >= 0;

  return (
    <StaggerContainer className="mb-6 grid gap-4 sm:grid-cols-2">
      <StaggerItem>
        <Card
          className={`border-border/60 bg-card transition-all ${
            isPositive
              ? 'shadow-[0_0_0_1px_rgba(52,211,153,0.12),0_4px_24px_rgba(52,211,153,0.06)]'
              : 'shadow-[0_0_0_1px_rgba(248,113,113,0.12),0_4px_24px_rgba(248,113,113,0.06)]'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Net P&amp;L</p>
              {isPositive
                ? <TrendingUp className="h-4 w-4 text-emerald-400" />
                : <TrendingDown className="h-4 w-4 text-red-400" />}
            </div>
            <AnimatedNumber
              value={totalPnL}
              prefix="$"
              decimals={2}
              className={`mt-1 block font-mono text-3xl font-bold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
            />
            <p className="mt-1 text-xs text-muted-foreground">across all completed sessions</p>
          </CardContent>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card className="border-border/60 bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Users className="inline h-3 w-3 mr-1" />Sessions
              </p>
            </div>
            <AnimatedNumber
              value={sessionCount}
              className="mt-1 block font-mono text-3xl font-bold text-foreground tabular-nums"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              <AnimatedNumber value={cashedOutCount} className="font-semibold text-foreground" /> cashed out
            </p>
          </CardContent>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}

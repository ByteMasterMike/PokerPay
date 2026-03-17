'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface PnlPoint {
  date: string;       // formatted label e.g. "Mar 14"
  sessionPnl: number; // net for that single session
  cumPnl: number;     // running cumulative total
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const { sessionPnl, cumPnl } = payload[0].payload as PnlPoint;
  const isUp = sessionPnl >= 0;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg text-xs space-y-1 min-w-[140px]">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Session</span>
        <span className={`font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {isUp ? '+' : ''}${sessionPnl.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Cumulative</span>
        <span className={`font-mono font-bold ${cumPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {cumPnl >= 0 ? '+' : ''}${cumPnl.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export default function PnlChart({ data }: { data: PnlPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No completed sessions yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Cash out from a table to see your P&amp;L chart</p>
      </div>
    );
  }

  const values = data.map((d) => d.cumPnl);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  // gradient offset: where y=0 falls between min and max (0 = top, 1 = bottom in SVG)
  const gradientOffset = max / range;

  const totalPnl = data[data.length - 1]?.cumPnl ?? 0;
  const isPositive = totalPnl >= 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cumulative P&amp;L</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isPositive
              ? <TrendingUp className="h-4 w-4 text-emerald-400" />
              : <TrendingDown className="h-4 w-4 text-red-400" />}
            <span className={`font-mono text-2xl font-extrabold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}${totalPnl.toFixed(2)}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{data.length} session{data.length !== 1 ? 's' : ''}</p>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0}              stopColor="#34d399" stopOpacity={0.35} />
              <stop offset={gradientOffset} stopColor="#34d399" stopOpacity={0.08} />
              <stop offset={gradientOffset} stopColor="#f87171" stopOpacity={0.08} />
              <stop offset={1}              stopColor="#f87171" stopOpacity={0.35} />
            </linearGradient>
            <linearGradient id="pnlStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset={gradientOffset} stopColor="#34d399" />
              <stop offset={gradientOffset} stopColor="#f87171" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${v}`}
            width={52}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} strokeDasharray="4 2" />

          <Area
            type="monotone"
            dataKey="cumPnl"
            stroke="url(#pnlStroke)"
            strokeWidth={2}
            fill="url(#pnlGradient)"
            dot={data.length <= 20 ? { r: 3, fill: 'hsl(var(--card))', strokeWidth: 1.5, stroke: '#34d399' } : false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

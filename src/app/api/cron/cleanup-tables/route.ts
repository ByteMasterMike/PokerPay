import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Vercel Cron calls this daily. Deletes closed tables (and their related records
// via cascade) that have been closed for more than 7 days.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const result = await prisma.table.deleteMany({
    where: {
      status: 'CLOSED',
      updatedAt: { lt: cutoff },
    },
  });

  return NextResponse.json({
    deleted: result.count,
    cutoff: cutoff.toISOString(),
  });
}

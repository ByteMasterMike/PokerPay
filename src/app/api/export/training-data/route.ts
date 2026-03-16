import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Returns a downloadable JSONL file where each line is one labeled training
// example: { imageUrl, chipCounts, total, tableId, capturedAt }
// Used to build the ML training dataset for the poker chip vision model.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = searchParams.get('limit');
  const limit = rawLimit ? parseInt(rawLimit, 10) : undefined;
  const safeLimit = limit && Number.isInteger(limit) && limit > 0 ? limit : undefined;

  // Scope export to tables the requesting user organised — prevents cross-user data access
  const userTableIds = (
    await prisma.table.findMany({
      where: { organizerId: session.user.id },
      select: { id: true },
    })
  ).map((t) => t.id);

  const records = await prisma.tablePlayer.findMany({
    where: {
      tableId: { in: userTableIds },
      stackPhoto: { not: null },
      chipCounts: { not: undefined },
      status: 'CASHED_OUT',
    },
    select: {
      stackPhoto: true,
      chipCounts: true,
      cashoutAmount: true,
      tableId: true,
      joinedAt: true,
    },
    orderBy: { joinedAt: 'desc' },
    ...(safeLimit ? { take: safeLimit } : {}),
  });

  // Filter to only records that have both a URL-based photo and chip counts
  const examples = records.filter(
    (r) => r.stackPhoto && r.stackPhoto.startsWith('http') && r.chipCounts
  );

  const lines = examples.map((r) =>
    JSON.stringify({
      imageUrl: r.stackPhoto,
      chipCounts: r.chipCounts,
      total: Number(r.cashoutAmount ?? 0),
      tableId: r.tableId,
      capturedAt: r.joinedAt.toISOString(),
    })
  );

  const jsonl = lines.join('\n');

  return new NextResponse(jsonl, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Content-Disposition': 'attachment; filename="pokerpay-training-data.jsonl"',
      'X-Total-Examples': String(examples.length),
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const table = await prisma.table.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      chipDenominations: { orderBy: { value: 'asc' } },
      players: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!table) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 });
  }

  // Organizer, active/cashed-out players, and pending players can all view the table
  const isOrganizer = table.organizerId === session.user.id;
  const isPlayer = table.players.some((p) => p.userId === session.user.id);
  if (!isOrganizer && !isPlayer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(table);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: { action?: string; userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action, userId } = body;

  const table = await prisma.table.findUnique({
    where: { id },
    include: { _count: { select: { players: true } } },
  });

  if (!table) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 });
  }

  // ── JOIN ─────────────────────────────────────────────────────────────────
  // Creates a PENDING record — organizer must approve before balance is deducted
  if (action === 'join') {
    if (table.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'This table is no longer accepting players' },
        { status: 400 }
      );
    }

    const activeCount = await prisma.tablePlayer.count({
      where: { tableId: id, status: 'ACTIVE' },
    });
    if (activeCount >= table.maxPlayers) {
      return NextResponse.json({ error: 'This table is full' }, { status: 400 });
    }

    const existing = await prisma.tablePlayer.findUnique({
      where: { tableId_userId: { tableId: id, userId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: existing.status === 'PENDING' ? 'Already waiting for approval' : 'You have already joined this table' },
        { status: 400 }
      );
    }

    await prisma.tablePlayer.create({
      data: { tableId: id, userId: session.user.id, status: 'PENDING' },
    });

    return NextResponse.json({ message: 'Join request sent — waiting for organizer approval' });
  }

  // ── APPROVE ──────────────────────────────────────────────────────────────
  // Organizer approves a pending player: deduct buy-in and set ACTIVE
  if (action === 'approve') {
    if (table.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the organizer can approve players' }, { status: 403 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const pending = await prisma.tablePlayer.findUnique({
      where: { tableId_userId: { tableId: id, userId } },
    });
    if (!pending || pending.status !== 'PENDING') {
      return NextResponse.json({ error: 'No pending request found for this player' }, { status: 404 });
    }

    const activeCount = await prisma.tablePlayer.count({
      where: { tableId: id, status: 'ACTIVE' },
    });
    if (activeCount >= table.maxPlayers) {
      return NextResponse.json({ error: 'Table is full' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.ledgerEntry.create({
        data: {
          userId,
          amount: -table.buyInAmount,
          type: 'BUY_IN',
          description: `Buy-in for table: ${table.name}`,
        },
      });

      await tx.tablePlayer.update({
        where: { tableId_userId: { tableId: id, userId } },
        data: { status: 'ACTIVE' },
      });
    });

    return NextResponse.json({ message: 'Player approved' });
  }

  // ── REJECT ───────────────────────────────────────────────────────────────
  // Organizer rejects a pending player: delete their record
  if (action === 'reject') {
    if (table.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the organizer can reject players' }, { status: 403 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const pending = await prisma.tablePlayer.findUnique({
      where: { tableId_userId: { tableId: id, userId } },
    });
    if (!pending || pending.status !== 'PENDING') {
      return NextResponse.json({ error: 'No pending request found for this player' }, { status: 404 });
    }

    await prisma.tablePlayer.delete({
      where: { tableId_userId: { tableId: id, userId } },
    });

    return NextResponse.json({ message: 'Player request rejected' });
  }

  // ── REBUY ────────────────────────────────────────────────────────────────
  // Organizer records an additional buy-in for a player who has busted
  if (action === 'rebuy') {
    if (table.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the organizer can record rebuys' }, { status: 403 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const player = await prisma.tablePlayer.findUnique({
      where: { tableId_userId: { tableId: id, userId } },
    });
    if (!player || player.status === 'PENDING') {
      return NextResponse.json({ error: 'Player is not active at this table' }, { status: 404 });
    }
    if (player.status === 'CASHED_OUT') {
      return NextResponse.json({ error: 'Player has already cashed out and cannot rebuy' }, { status: 400 });
    }
    if (table.status !== 'OPEN') {
      return NextResponse.json({ error: 'Table is closed' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.ledgerEntry.create({
        data: {
          userId,
          amount: -table.buyInAmount,
          type: 'BUY_IN',
          description: `Rebuy for table: ${table.name}`,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.tablePlayer.update as any)({
        where: { tableId_userId: { tableId: id, userId } },
        data: { rebuys: { increment: 1 } },
      });
    });

    return NextResponse.json({ message: 'Rebuy recorded successfully' });
  }

  // ── CLOSE ────────────────────────────────────────────────────────────────
  // Force-cashout any remaining ACTIVE players at $0, then compute the payout
  // summary server-side (so it includes force-cashed players) and close the table.
  if (action === 'close') {
    if (table.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the organizer can close this table' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Force-cashout every ACTIVE player at $0
      const stillActive = await tx.tablePlayer.findMany({
        where: { tableId: id, status: 'ACTIVE' },
        select: { userId: true },
      });

      for (const { userId: pid } of stillActive) {
        await tx.tablePlayer.update({
          where: { tableId_userId: { tableId: id, userId: pid } },
          data: { status: 'CASHED_OUT', cashoutAmount: 0 },
        });
        await tx.ledgerEntry.create({
          data: {
            userId: pid,
            amount: 0,
            type: 'CASH_OUT',
            description: `Force cashout (table closed): ${table.name}`,
          },
        });
      }

      // After force-cashout, read all players to build the payout summary server-side
      const allPlayers = await tx.tablePlayer.findMany({
        where: { tableId: id },
        include: { user: { select: { name: true } } },
      });

      const buyInAmt = Number(table.buyInAmount);
      const rows = allPlayers.map((p) => {
        const rebuys = p.rebuys ?? 0;
        const cashout = Number(p.cashoutAmount ?? 0);
        const totalCost = (1 + rebuys) * buyInAmt;
        return {
          name: p.user.name,
          status: p.status,
          cashout,
          net: cashout - totalCost,
          totalCost,
          rebuys,
          stackPhoto: p.stackPhoto ?? null,
        };
      });

      const serverPayoutSummary = {
        closedAt: new Date().toISOString(),
        buyInAmount: buyInAmt,
        rows,
        totalBuyIns:   rows.reduce((s, r) => s + r.totalCost, 0),
        totalCashouts: rows.reduce((s, r) => s + r.cashout, 0),
      };

      await tx.table.update({
        where: { id },
        data: { status: 'CLOSED', payoutSummary: serverPayoutSummary as Prisma.InputJsonValue },
      });
    });

    return NextResponse.json({ message: 'Table closed' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const approveResult = await prisma.$transaction(async (tx) => {
      const balanceUpdate = await tx.user.updateMany({
        where: { id: userId, balance: { gte: table.buyInAmount } },
        data: { balance: { decrement: table.buyInAmount } },
      });
      if (balanceUpdate.count === 0) {
        return { success: false as const, error: `Player has insufficient funds for the $${table.buyInAmount} buy-in` };
      }

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

      return { success: true as const };
    });

    if (!approveResult.success) {
      return NextResponse.json({ error: approveResult.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Player approved and buy-in collected' });
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

  // ── CLOSE ────────────────────────────────────────────────────────────────
  if (action === 'close') {
    if (table.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the organizer can close this table' }, { status: 403 });
    }

    await prisma.table.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    return NextResponse.json({ message: 'Table closed' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

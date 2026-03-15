import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require authentication — table data is not public
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

  // Only organizer or joined players can see full table details
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

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action } = body;

  const table = await prisma.table.findUnique({
    where: { id },
    include: { _count: { select: { players: true } } },
  });

  if (!table) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 });
  }

  if (action === 'join') {
    if (table.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'This table is no longer accepting players' },
        { status: 400 }
      );
    }

    if (table._count.players >= table.maxPlayers) {
      return NextResponse.json(
        { error: 'This table is full' },
        { status: 400 }
      );
    }

    const existingPlayer = await prisma.tablePlayer.findUnique({
      where: {
        tableId_userId: {
          tableId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'You have already joined this table' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    });

    if (!user || user.balance < table.buyInAmount) {
      return NextResponse.json(
        { error: `Insufficient funds. Buy-in is $${table.buyInAmount}` },
        { status: 400 }
      );
    }

    try {
      const joinResult = await prisma.$transaction(async (tx) => {
        const playerCount = await tx.tablePlayer.count({
          where: { tableId: id },
        });
        if (playerCount >= table.maxPlayers) {
          return { success: false as const, error: 'This table is full' };
        }

        const existingInTx = await tx.tablePlayer.findUnique({
          where: {
            tableId_userId: { tableId: id, userId: session.user.id },
          },
        });
        if (existingInTx) {
          return { success: false as const, error: 'You have already joined this table' };
        }

        const balanceUpdate = await tx.user.updateMany({
          where: {
            id: session.user.id,
            balance: { gte: table.buyInAmount },
          },
          data: { balance: { decrement: table.buyInAmount } },
        });
        if (balanceUpdate.count === 0) {
          return { success: false as const, error: `Insufficient funds. Buy-in is $${table.buyInAmount}` };
        }

        await tx.ledgerEntry.create({
          data: {
            userId: session.user.id,
            amount: -table.buyInAmount,
            type: 'BUY_IN',
            description: `Buy-in for table: ${table.name}`,
          },
        });

        await tx.tablePlayer.create({
          data: {
            tableId: id,
            userId: session.user.id,
          },
        });

        return { success: true as const };
      });

      if (!joinResult.success) {
        return NextResponse.json(
          { error: joinResult.error },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: 'Joined table successfully' });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return NextResponse.json(
          { error: 'You have already joined this table' },
          { status: 400 }
        );
      }
      throw error;
    }
  }

  if (action === 'close') {
    if (table.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the organizer can close this table' },
        { status: 403 }
      );
    }

    await prisma.table.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    return NextResponse.json({ message: 'Table closed' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { amount } = await request.json();

    if (amount === undefined || typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const tablePlayer = await prisma.tablePlayer.findUnique({
      where: {
        tableId_userId: {
          tableId: id,
          userId: session.user.id,
        },
      },
      include: { table: true },
    });

    if (!tablePlayer) {
      return NextResponse.json(
        { error: 'You are not a player at this table' },
        { status: 400 }
      );
    }

    if (tablePlayer.status === 'CASHED_OUT') {
      return NextResponse.json(
        { error: 'You have already cashed out from this table' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { increment: amount } },
      });

      await tx.ledgerEntry.create({
        data: {
          userId: session.user.id,
          amount: amount,
          type: 'CASH_OUT',
          description: `Cash out from table: ${tablePlayer.table.name}`,
        },
      });

      await tx.tablePlayer.update({
        where: { id: tablePlayer.id },
        data: { status: 'CASHED_OUT' },
      });
    });

    return NextResponse.json({ success: true, message: 'Cashed out successfully' });
  } catch (error) {
    console.error('Cashout error:', error);
    return NextResponse.json(
      { error: 'Failed to process cashout' },
      { status: 500 }
    );
  }
}

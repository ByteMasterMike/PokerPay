import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Max cashout is buy-in * 10 to allow for winnings while preventing abuse
const MAX_CASHOUT_MULTIPLIER = 10;

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

    let body: { amount?: number; stackPhoto?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { amount, stackPhoto } = body;

    // Validate photo is present and is a base64 JPEG/PNG data URL
    if (!stackPhoto || !stackPhoto.startsWith('data:image/')) {
      return NextResponse.json({ error: 'A photo of your chip stack is required to cash out' }, { status: 400 });
    }
    // Rough size guard — base64 of 2MB ≈ 2.7M chars
    if (stackPhoto.length > 3_000_000) {
      return NextResponse.json({ error: 'Photo is too large. Please use a clearer, smaller image.' }, { status: 400 });
    }

    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
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

    const maxCashout = Number(tablePlayer.table.buyInAmount) * MAX_CASHOUT_MULTIPLIER;
    if (amount > maxCashout) {
      return NextResponse.json(
        { error: `Cashout amount exceeds maximum of $${maxCashout.toFixed(2)}` },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.tablePlayer.updateMany({
        where: {
          id: tablePlayer.id,
          status: 'ACTIVE',
        },
        data: { status: 'CASHED_OUT', cashoutAmount: amount, stackPhoto },
      });

      if (updateResult.count === 0) {
        return { success: false as const, conflict: true };
      }

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

      return { success: true as const, conflict: false };
    });

    if (result.conflict) {
      return NextResponse.json(
        { error: 'You have already cashed out from this table' },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, message: 'Cashed out successfully' });
  } catch (error) {
    console.error('Cashout error:', error);
    return NextResponse.json(
      { error: 'Failed to process cashout' },
      { status: 500 }
    );
  }
}

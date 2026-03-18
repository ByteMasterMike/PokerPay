import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadStackPhoto } from '@/lib/r2';
import { Prisma } from '@prisma/client';

// Max cashout is buy-in * 10 to allow for winnings while preventing abuse
const MAX_CASHOUT_MULTIPLIER = 10;

type ChipCount = { color: string; label: string; value: number; count: number };

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

    let body: { amount?: number; stackPhoto?: string; chipCounts?: ChipCount[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { amount, stackPhoto, chipCounts } = body;

    // Validate photo
    if (!stackPhoto || !stackPhoto.startsWith('data:image/')) {
      return NextResponse.json({ error: 'A photo of your chip stack is required to cash out' }, { status: 400 });
    }
    if (stackPhoto.length > 3_000_000) {
      return NextResponse.json({ error: 'Photo is too large. Please use a clearer, smaller image.' }, { status: 400 });
    }

    // Validate chip counts
    if (!chipCounts || !Array.isArray(chipCounts) || chipCounts.length === 0) {
      return NextResponse.json({ error: 'Chip counts are required to cash out' }, { status: 400 });
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

    const rebuys = tablePlayer.rebuys ?? 0;
    const maxCashout = (1 + rebuys) * Number(tablePlayer.table.buyInAmount) * MAX_CASHOUT_MULTIPLIER;
    if (amount > maxCashout) {
      return NextResponse.json(
        { error: `Cashout amount exceeds maximum of $${maxCashout.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Upload photo to Cloudflare R2, get back a public URL
    const photoKey = `${id}/${session.user.id}/${Date.now()}.jpg`;
    let photoUrl: string;
    try {
      photoUrl = await uploadStackPhoto(stackPhoto, photoKey);
    } catch (uploadErr) {
      console.error('R2 upload failed:', uploadErr);
      return NextResponse.json({ error: 'Failed to upload stack photo. Please try again.' }, { status: 500 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.tablePlayer.updateMany({
        where: {
          id: tablePlayer.id,
          status: 'ACTIVE',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          status: 'CASHED_OUT',
          cashoutAmount: amount,
          stackPhoto: photoUrl,
          chipCounts: chipCounts as Prisma.InputJsonValue,
        } as any,
      });

      if (updateResult.count === 0) {
        return { success: false as const, conflict: true };
      }

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

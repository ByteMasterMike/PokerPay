import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tables = await prisma.table.findMany({
    where: {
      OR: [
        { organizerId: session.user.id },
        { players: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      organizer: { select: { id: true, name: true } },
      chipDenominations: true,
      players: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      _count: { select: { players: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(tables);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let body: {
      name?: string;
      maxPlayers?: number;
      buyInAmount?: number | string;
      chipDenominations?: Array<{ color: string; label: string; value: number }>;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { name, maxPlayers, buyInAmount, chipDenominations } = body;

    if (!name || !buyInAmount || !chipDenominations?.length) {
      return NextResponse.json(
        { error: 'Name, buy-in amount, and chip denominations are required' },
        { status: 400 }
      );
    }

    // Name length limits
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Table name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // Cap chip denominations to prevent abuse
    if (chipDenominations.length > 20) {
      return NextResponse.json(
        { error: 'Maximum of 20 chip denominations allowed' },
        { status: 400 }
      );
    }

    const buyInNum = typeof buyInAmount === 'number' ? buyInAmount : parseFloat(String(buyInAmount));
    if (!Number.isFinite(buyInNum) || buyInNum <= 0) {
      return NextResponse.json(
        { error: 'Buy-in amount must be a positive number' },
        { status: 400 }
      );
    }

    const maxPlayersNum = maxPlayers != null
      ? (typeof maxPlayers === 'number' ? maxPlayers : parseInt(String(maxPlayers), 10))
      : 9;
    if (!Number.isInteger(maxPlayersNum) || maxPlayersNum < 2 || maxPlayersNum > 20) {
      return NextResponse.json(
        { error: 'Max players must be an integer between 2 and 20' },
        { status: 400 }
      );
    }

    const createDenominations: Array<{ color: string; label: string; value: number }> = [];
    for (const chip of chipDenominations) {
      const val = typeof chip.value === 'number' ? chip.value : parseFloat(String(chip.value));
      if (!Number.isFinite(val) || val <= 0) {
        return NextResponse.json(
          { error: 'Each chip denomination must have a positive value' },
          { status: 400 }
        );
      }
      createDenominations.push({
        color: String(chip.color ?? ''),
        label: String(chip.label ?? ''),
        value: val,
      });
    }

    const table = await prisma.table.create({
      data: {
        name,
        maxPlayers: maxPlayersNum,
        buyInAmount: buyInNum,
        organizerId: session.user.id,
        chipDenominations: {
          create: createDenominations,
        },
      },
      include: {
        chipDenominations: true,
        organizer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error('Table creation error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

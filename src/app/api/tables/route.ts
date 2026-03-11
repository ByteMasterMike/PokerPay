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
          user: { select: { id: true, name: true, email: true } },
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
    const { name, maxPlayers, buyInAmount, chipDenominations } =
      await request.json();

    if (!name || !buyInAmount || !chipDenominations?.length) {
      return NextResponse.json(
        { error: 'Name, buy-in amount, and chip denominations are required' },
        { status: 400 }
      );
    }

    const table = await prisma.table.create({
      data: {
        name,
        maxPlayers: maxPlayers || 9,
        buyInAmount: parseFloat(buyInAmount),
        organizerId: session.user.id,
        chipDenominations: {
          create: chipDenominations.map(
            (chip: { color: string; label: string; value: number }) => ({
              color: chip.color,
              label: chip.label,
              value: chip.value,
            })
          ),
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

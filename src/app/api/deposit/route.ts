import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { amount?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Mock Stripe checkout processing...
    // In a real app, this would create a Stripe Checkout Session or PaymentIntent
    // and verify the payment via webhooks before crediting the account.
    if (process.env.MOCK_STRIPE_DELAY === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Credit user balance and create ledger entry
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: session.user.id },
        data: {
          balance: { increment: amount },
        },
      });

      await tx.ledgerEntry.create({
        data: {
          userId: user.id,
          amount: amount,
          type: 'DEPOSIT',
          description: 'Deposit via Mock Stripe',
        },
      });

      return user;
    });

    return NextResponse.json({ 
      success: true, 
      balance: updatedUser.balance,
      message: 'Deposit successful!' 
    });

  } catch (error) {
    console.error('Deposit error:', error);
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    );
  }
}

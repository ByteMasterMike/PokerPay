import { NextResponse } from 'next/server';

// Deposit endpoint disabled — the app tracks P&L via table buy-ins and cashouts;
// there is no virtual wallet. This route is kept as a placeholder for future
// Stripe integration.
export async function POST() {
  return NextResponse.json({ error: 'Deposits are not currently supported' }, { status: 410 });
}

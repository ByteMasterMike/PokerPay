import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  try {
    let body: { email?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { email } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to avoid revealing whether the email exists
    const successResponse = {
      message: 'If an account exists with that email, you will receive a password reset link.',
    };

    if (!user) {
      return NextResponse.json(successResponse);
    }

    // Delete any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    // Send email: integrate Resend, SendGrid, etc. when RESEND_API_KEY or similar is set.
    // Until then, in development we log the link for testing.
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Password Reset] Link for', normalizedEmail, ':', resetUrl);
    } else if (!process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY) {
      console.warn(
        '[Password Reset] No email provider configured. Set RESEND_API_KEY or SENDGRID_API_KEY and integrate sending in forgot-password route.'
      );
    }

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

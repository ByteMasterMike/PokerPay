import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { Resend } from 'resend';

const TOKEN_EXPIRY_HOURS = 1;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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
        token: hashToken(token), // store hashed — raw token only in the email link
        userId: user.id,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error: sendError } = await resend.emails.send({
        from: 'PokerPay <onboarding@resend.dev>',
        to: normalizedEmail,
        subject: 'Reset your PokerPay password',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #C9A84C;">PokerPay — Password Reset</h2>
            <p>Hi ${user.name},</p>
            <p>We received a request to reset your PokerPay password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
            <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #C9A84C; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
            <p style="color: #888; font-size: 13px;">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
            <p style="color: #888; font-size: 13px;">Or copy this link into your browser:<br/><a href="${resetUrl}" style="color: #C9A84C;">${resetUrl}</a></p>
          </div>
        `,
      });

      if (sendError) {
        console.error('[Password Reset] Resend error:', sendError);
      } else {
        console.log('[Password Reset] Email sent to', normalizedEmail);
      }
    } else {
      // Dev fallback: only log that a token was generated, never the URL itself
      console.log('[Password Reset] Token generated for', normalizedEmail, '(RESEND_API_KEY not set — configure it to send emails)');
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

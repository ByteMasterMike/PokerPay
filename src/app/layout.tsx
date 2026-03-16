import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, DM_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PokerPay — Trustless Table Banking',
  description:
    'Eliminate the need for a designated banker at poker tables. QR-code deposits, AI chip counting cashouts, and persistent P&L tracking.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${inter.variable} ${dmMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}

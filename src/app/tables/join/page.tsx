'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ScanLine, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

export default function JoinTablePage() {
  const [scanning, setScanning] = useState(false);

  return (
    <div className="container max-w-md py-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
          Join a Table
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Scan the QR code displayed by your table organizer.
        </p>
      </header>

      <Card className="border-border/60 bg-card">
        <CardHeader className="items-center text-center pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-2">
            <ScanLine className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Scan to Join</CardTitle>
          <CardDescription className="max-w-xs">
            Ask the organizer to open their table page and show you the QR code. Tap below to open your camera and scan it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={() => setScanning(true)}
          >
            <ScanLine className="mr-2 h-4 w-4" />
            Open Camera &amp; Scan QR
          </Button>

          <div className="text-center">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {scanning && <QRScanner onClose={() => setScanning(false)} />}
    </div>
  );
}

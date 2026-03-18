'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoRefresh({ intervalMs = 5000, disabled = false }: { intervalMs?: number; disabled?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (disabled) return;
    const t = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(t);
  }, [router, intervalMs, disabled]);

  return null;
}

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FilterValue = 'all' | 'open' | 'closed';

export default function TableFilter({ current }: { current: FilterValue }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = (value: FilterValue) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', value);
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`);
  };

  return (
    <Tabs value={current} onValueChange={(v) => setFilter(v as FilterValue)}>
      <TabsList className="h-8">
        <TabsTrigger value="open"  className="text-xs px-3">Open</TabsTrigger>
        <TabsTrigger value="all"   className="text-xs px-3">All</TabsTrigger>
        <TabsTrigger value="closed" className="text-xs px-3">Closed</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

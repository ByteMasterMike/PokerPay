'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

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

  const options: { value: FilterValue; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <div style={{ display: 'flex', gap: '0.375rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setFilter(opt.value)}
          style={{
            padding: '4px 14px',
            fontSize: '0.78rem',
            fontWeight: 600,
            border: 'none',
            borderRadius: 'calc(var(--radius-md) - 2px)',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
            background: current === opt.value ? 'var(--color-gold, #d4a843)' : 'transparent',
            color: current === opt.value ? '#000' : 'var(--color-text-muted)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

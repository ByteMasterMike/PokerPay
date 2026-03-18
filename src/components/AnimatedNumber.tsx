'use client';

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring, animate } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}

export default function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
  duration = 1.2,
}: AnimatedNumberProps) {
  const safeValue = isNaN(value) || !isFinite(value) ? 0 : value;
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (isInView) {
      animate(motionValue, safeValue, { duration, ease: [0.16, 1, 0.3, 1] });
    }
  }, [isInView, safeValue, motionValue, duration]);

  useEffect(() => {
    return springValue.on('change', (v) => {
      if (ref.current) {
        const formatted = decimals > 0 ? Math.abs(v).toFixed(decimals) : Math.round(Math.abs(v)).toLocaleString();
        const sign = safeValue < 0 ? '-' : safeValue > 0 && prefix === '$' ? '+' : '';
        ref.current.textContent = `${sign}${prefix}${formatted}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix, decimals, safeValue]);

  const initial =
    decimals > 0
      ? `${safeValue < 0 ? '-' : safeValue > 0 && prefix === '$' ? '+' : ''}${prefix}0.${'0'.repeat(decimals)}${suffix}`
      : `${prefix}0${suffix}`;

  return (
    <span ref={ref} className={className}>
      {initial}
    </span>
  );
}

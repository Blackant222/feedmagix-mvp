import { useState, useEffect } from 'react';
import { toPersianDigits } from '@/lib/persian';

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
}

export function CountUp({ value, duration = 900, className }: CountUpProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplay(Math.round(value * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className || ''}`}>
      {toPersianDigits(display)}
    </span>
  );
}

'use client';

import { useRef } from 'react';
import { useScrollProgress } from '@/lib/scroll-fx';

/** Tarjeta del pilar con la letra grande en parallax; lo demás de la sección es HTML de servidor. */
export function PillarCard({ code, color, children }: { code: string; color: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const letter = useRef<HTMLSpanElement>(null);
  useScrollProgress(ref, 'through', (p) => {
    if (letter.current) letter.current.style.transform = `translate3d(0, ${30 - 60 * p}%, 0) rotate(${-8 + 16 * p}deg)`;
  });
  return (
    <div ref={ref} className="relative h-56 overflow-hidden rounded-3xl p-8 text-white sm:h-72" style={{ background: `linear-gradient(135deg, ${color}, #07100f)` }}>
      <span ref={letter} style={{ transform: 'translate3d(0, 30%, 0) rotate(-8deg)' }} className="pointer-events-none absolute -top-10 -right-6 font-display text-[16rem] leading-none text-white/10">
        {code}
      </span>
      <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 20% 110%, ${color}, transparent 60%)` }} />
      {children}
    </div>
  );
}

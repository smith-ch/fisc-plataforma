'use client';

import { m, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

/** Tarjeta del pilar con la letra grande en parallax; lo demás de la sección es HTML de servidor. */
export function PillarCard({ code, color, children }: { code: string; color: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const letterY = useTransform(scrollYProgress, [0, 1], ['30%', '-30%']);
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 8]);
  return (
    <div ref={ref} className="relative h-56 overflow-hidden rounded-3xl p-8 text-white sm:h-72" style={{ background: `linear-gradient(135deg, ${color}, #07100f)` }}>
      <m.span style={{ y: letterY, rotate }} className="pointer-events-none absolute -top-10 -right-6 font-display text-[16rem] leading-none text-white/10">
        {code}
      </m.span>
      <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 20% 110%, ${color}, transparent 60%)` }} />
      {children}
    </div>
  );
}

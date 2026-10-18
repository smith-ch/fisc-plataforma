'use client';

import { MoveHorizontal } from 'lucide-react';
import { useState } from 'react';

/** Comparador "antes / después" deslizable. */
export function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-[4/3] cursor-ew-resize overflow-hidden rounded-3xl select-none"
      onPointerMove={(e) => {
        if (e.pointerType === 'mouse' || e.buttons) {
          const r = e.currentTarget.getBoundingClientRect();
          setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
        }
      }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="Después" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt="Antes" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink-950 shadow-lg">
          <MoveHorizontal className="h-4 w-4" />
        </span>
      </div>
      <span className="badge absolute top-4 left-4 bg-ink-950/70 text-white">Antes</span>
      <span className="badge absolute top-4 right-4 bg-white/90 text-ink-950">Después</span>
    </div>
  );
}

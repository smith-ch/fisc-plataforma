'use client';

import { MoveHorizontal } from 'lucide-react';
import { useRef, useState } from 'react';
import { ContentImage } from '@/components/ui/ContentImage';

const SIZES = '(min-width: 768px) 50vw, 100vw';

/**
 * Comparador "antes / después" deslizable.
 * - `touch-action: pan-y`: el dedo arrastra el divisor en horizontal y el scroll vertical de la página sigue funcionando.
 * - Captura del puntero al arrastrar, para no perder el gesto si el dedo se sale de la imagen.
 * - Con ratón también sigue al cursor al pasar por encima. Con teclado: flechas izquierda/derecha.
 */
export function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      role="slider" tabIndex={0} aria-label="Comparar antes y después" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)}
      className="relative aspect-[4/3] cursor-ew-resize touch-pan-y overflow-hidden rounded-3xl bg-ink-900/5 select-none"
      onPointerDown={(e) => {
        dragging.current = true;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* puntero ya liberado: el arrastre sigue dentro del elemento */ }
        move(e);
      }}
      onPointerMove={(e) => { if (dragging.current || e.pointerType === 'mouse') move(e); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); setPos((p) => Math.max(0, p - 5)); }
        if (e.key === 'ArrowRight') { e.preventDefault(); setPos((p) => Math.min(100, p + 5)); }
      }}>
      <ContentImage src={after} alt="Después" sizes={SIZES} draggable={false} className="pointer-events-none object-cover" />
      <ContentImage src={before} alt="Antes" sizes={SIZES} draggable={false} className="pointer-events-none object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink-950 shadow-lg">
          <MoveHorizontal className="h-4 w-4" />
        </span>
      </div>
      <span className="badge pointer-events-none absolute top-4 left-4 bg-ink-950/70 text-white">Antes</span>
      <span className="badge pointer-events-none absolute top-4 right-4 bg-white/90 text-ink-950">Después</span>
    </div>
  );
}

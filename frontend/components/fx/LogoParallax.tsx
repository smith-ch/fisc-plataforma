'use client';

import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';
import { PieceImg, type Variant } from './LogoPieces';
import { onPointerMove } from '@/lib/pointer';

/**
 * Cursor normalizado (-1..1). Si no hay puntero (móvil) o lleva un rato quieto,
 * describe una órbita lenta para que el efecto nunca se vea "muerto".
 */
function usePointer() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const lastMove = useRef(-Infinity);
  const reduced = useReducedMotion();

  // Listener compartido (lib/pointer.ts): un solo `pointermove` en window para toda la página, y solo con ratón.
  useEffect(() => onPointerMove((e) => {
    lastMove.current = performance.now();
    mx.set((e.clientX / window.innerWidth) * 2 - 1);
    my.set((e.clientY / window.innerHeight) * 2 - 1);
  }), [mx, my]);

  // La órbita automática solo corre los primeros 8 s (si el cursor no se ha movido): después el símbolo queda quieto y no repinta
  // piezas, sombras y brillos en cada fotograma para siempre. En cuanto el cursor se mueve, vuelve a seguirlo.
  const born = useRef(typeof performance === 'undefined' ? 0 : performance.now());
  useAnimationFrame((now) => {
    if (reduced || performance.now() - lastMove.current < 3500 || now - born.current > 8000) return;
    mx.set(Math.sin(now * 0.00045) * 0.55);
    my.set(Math.cos(now * 0.00032) * 0.4);
  });

  return { mx, my };
}

/**
 * Campo de piezas del logo flotando a distintas profundidades: las lejanas son
 * pequeñas, difusas y lentas; las cercanas grandes y rápidas (parallax con
 * cursor y con scroll).
 */
const SHARDS = [
  { id: 's-mid', left: 6, top: 18, size: 90, depth: 0.2, rot: -20, blur: 3, o: 0.18 },
  { id: 's-top', left: 14, top: 72, size: 140, depth: 0.5, rot: 25, blur: 1, o: 0.22 },
  { id: 'f', left: 44, top: 8, size: 70, depth: 0.15, rot: 40, blur: 4, o: 0.12 },
  { id: 's-bottom', left: 38, top: 82, size: 110, depth: 0.35, rot: -12, blur: 2, o: 0.16 },
  { id: 's-mid', left: 88, top: 12, size: 120, depth: 0.6, rot: 15, blur: 0, o: 0.2 },
  { id: 'f', left: 92, top: 64, size: 180, depth: 0.8, rot: -25, blur: 0, o: 0.14 },
  { id: 's-top', left: 62, top: 90, size: 80, depth: 0.25, rot: 60, blur: 3, o: 0.14 },
  { id: 's-bottom', left: 2, top: 46, size: 60, depth: 0.1, rot: 80, blur: 5, o: 0.1 },
];

export function ShardsField({ variant, scrollTarget }: { variant: Variant; scrollTarget?: React.RefObject<HTMLElement | null> }) {
  const { mx, my } = usePointer();
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const { scrollYProgress } = useScroll({ target: scrollTarget, offset: ['start start', 'end start'] });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {SHARDS.map((s, i) => <Shard key={i} s={s} sx={sx} sy={sy} scroll={scrollYProgress} variant={variant} i={i} />)}
    </div>
  );
}

function Shard({ s, sx, sy, scroll, variant, i }: {
  s: (typeof SHARDS)[number]; sx: MotionValue<number>; sy: MotionValue<number>; scroll: MotionValue<number>; variant: Variant; i: number;
}) {
  const x = useTransform(sx, (v) => -v * 60 * s.depth);
  const y = useTransform([sy, scroll] as MotionValue[], ([v, p]: number[]) => -v * 60 * s.depth - p * 600 * s.depth);
  const rotate = useTransform(scroll, [0, 1], [s.rot, s.rot + 90 * s.depth * (i % 2 ? 1 : -1)]);
  return (
    <motion.div className="absolute" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, x, y, rotate }}>
      <div className="shard-in" style={{ '--d': `${i * 0.06}s` } as React.CSSProperties}>
        <PieceImg id={s.id} variant={variant} sizes={`${s.size}px`} className="w-full animate-float"
          style={{ filter: `blur(${s.blur}px)`, opacity: s.o, animationDelay: `${i * -1.3}s`, animationDuration: `${7 + (i % 4) * 2}s` }} />
      </div>
    </motion.div>
  );
}

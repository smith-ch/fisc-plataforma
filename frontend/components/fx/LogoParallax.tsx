'use client';

import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';

type Variant = 'white' | 'black' | 'auto';

/** Imagen de una pieza; con `auto` se muestra la negra en claro y la blanca en oscuro. */
function PieceImg({ id, variant, className = '', style }: { id: string; variant: Variant; className?: string; style?: React.CSSProperties }) {
  /* eslint-disable @next/next/no-img-element */
  if (variant !== 'auto') return <img src={`/brand/piece-${id}-${variant}.png`} alt="" draggable={false} className={className} style={style} />;
  return (
    <>
      <img src={`/brand/piece-${id}-black.png`} alt="" draggable={false} className={`${className} dark:hidden`} style={style} />
      <img src={`/brand/piece-${id}-white.png`} alt="" draggable={false} className={`${className} hidden dark:block`} style={style} />
    </>
  );
  /* eslint-enable @next/next/no-img-element */
}

/**
 * Cursor normalizado (-1..1). Si no hay puntero (móvil) o lleva un rato quieto,
 * describe una órbita lenta para que el efecto nunca se vea "muerto".
 */
function usePointer() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const lastMove = useRef(-Infinity);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      lastMove.current = performance.now();
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [mx, my]);

  useAnimationFrame((now) => {
    if (reduced || performance.now() - lastMove.current < 3500) return;
    mx.set(Math.sin(now * 0.00045) * 0.55);
    my.set(Math.cos(now * 0.00032) * 0.4);
  });

  return { mx, my };
}

/**
 * Símbolo F.I.S.C. armado con sus 4 piezas (recortadas del logo oficial).
 * - Al cargar, las piezas llegan desde afuera y se ensamblan.
 * - Con el cursor, cada pieza se desplaza según su profundidad (parallax 3D)
 *   y el conjunto se inclina.
 * - Al hacer scroll las piezas se separan en una "vista explotada".
 */
const PIECES = [
  { id: 'f', depth: 18, explode: { x: -70, y: -60, r: -8 }, enter: { x: -260, y: -120 } },
  { id: 's-top', depth: 38, explode: { x: 60, y: -30, r: 7 }, enter: { x: 240, y: -160 } },
  { id: 's-mid', depth: 60, explode: { x: -30, y: 40, r: -6 }, enter: { x: -80, y: 220 } },
  { id: 's-bottom', depth: 28, explode: { x: 40, y: 110, r: 6 }, enter: { x: 200, y: 260 } },
] as const;

export function LogoParallax({ variant = 'auto', className = '', scrollTarget }: {
  variant?: Variant;
  className?: string;
  /** Sección que controla la "explosión" con el scroll (por defecto el propio componente). */
  scrollTarget?: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { mx, my } = usePointer();
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const rotateY = useTransform(sx, [-1, 1], [-14, 14]);
  const rotateX = useTransform(sy, [-1, 1], [12, -12]);

  const { scrollYProgress } = useScroll({ target: scrollTarget ?? ref, offset: ['start start', 'end start'] });
  const explode = useSpring(useTransform(scrollYProgress, [0, 0.7], [0, 1]), { stiffness: 80, damping: 20 });

  return (
    <div ref={ref} className={`relative [perspective:1200px] ${className}`}>
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} className="relative aspect-[422/511] w-full">
        {/* Halo de luz detrás del símbolo: se desplaza en sentido contrario al cursor */}
        <Halo sx={sx} sy={sy} />
        {PIECES.map((p, i) => (
          <Piece key={p.id} piece={p} index={i} variant={variant} sx={sx} sy={sy} explode={explode} />
        ))}
      </motion.div>
    </div>
  );
}

function Halo({ sx, sy }: { sx: MotionValue<number>; sy: MotionValue<number> }) {
  const x = useTransform(sx, (v) => v * -30);
  const y = useTransform(sy, (v) => v * -30);
  return (
    <motion.div style={{ x, y }} className="absolute inset-[8%] rounded-full bg-accent/30 blur-3xl dark:bg-accent/25">
      <div className="absolute inset-[25%] rounded-full bg-brand/40 blur-2xl dark:bg-white/10" />
    </motion.div>
  );
}

function Piece({ piece, index, variant, sx, sy, explode }: {
  piece: (typeof PIECES)[number]; index: number; variant: Variant;
  sx: MotionValue<number>; sy: MotionValue<number>; explode: MotionValue<number>;
}) {
  const x = useTransform([sx, explode] as MotionValue[], ([m, e]: number[]) => m * piece.depth + e * piece.explode.x);
  const y = useTransform([sy, explode] as MotionValue[], ([m, e]: number[]) => m * piece.depth + e * piece.explode.y);
  const rotate = useTransform(explode, [0, 1], [0, piece.explode.r]);
  // Reflejo especular: un foco de luz recortado con la silueta de la pieza que
  // se mueve con el cursor (las piezas más cercanas lo desplazan más).
  const lx = useTransform(sx, (v) => `${50 + v * (30 + piece.depth * 0.4)}%`);
  const ly = useTransform(sy, (v) => `${45 + v * (30 + piece.depth * 0.4)}%`);
  const sheen = useMotionTemplate`radial-gradient(circle at ${lx} ${ly}, rgba(255,255,255,.85) 0%, rgba(255,255,255,.25) 18%, transparent 42%)`;
  // Sombra proyectada hacia el lado opuesto a la luz: da sensación de volumen
  const shadow = useTransform([sx, sy] as MotionValue[], ([a, b]: number[]) =>
    `drop-shadow(${-a * piece.depth * 0.35}px ${12 - b * piece.depth * 0.35}px ${10 + piece.depth * 0.25}px rgba(0,0,0,.28))`);
  const mask = `url(/brand/piece-${piece.id}-white.png) center / 100% 100% no-repeat`;

  return (
    <motion.div className="absolute inset-0" style={{ x, y, rotate, z: piece.depth * 2 }}>
      <motion.div
        className="relative h-full w-full select-none"
        style={{ filter: shadow }}
        initial={{ opacity: 0, x: piece.enter.x, y: piece.enter.y, rotate: piece.explode.r * 3, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.2 + index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        <PieceImg id={piece.id} variant={variant} className="h-full w-full" />
        <motion.div aria-hidden className="absolute inset-0 opacity-45 mix-blend-screen dark:opacity-100 dark:mix-blend-soft-light"
          style={{ background: sheen, mask, WebkitMask: mask }} />
      </motion.div>
    </motion.div>
  );
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

export function LogoShards({ variant = 'auto', scrollTarget }: { variant?: Variant; scrollTarget?: React.RefObject<HTMLElement | null> }) {
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
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1.2, delay: 0.6 + i * 0.08 }}>
        <PieceImg id={s.id} variant={variant} className="w-full animate-float"
          style={{ filter: `blur(${s.blur}px)`, opacity: s.o, animationDelay: `${i * -1.3}s`, animationDuration: `${7 + (i % 4) * 2}s` }} />
      </motion.div>
    </motion.div>
  );
}

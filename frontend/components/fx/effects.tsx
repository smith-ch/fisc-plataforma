'use client';

import { useEffect, useRef, useState } from 'react';
import { onceInView } from '@/lib/in-view';
import { isLowPowerDevice } from '@/lib/perf';
import { hasFinePointer } from '@/lib/pointer';
import { useScrollProgress } from '@/lib/scroll-fx';

/** Scroll suave (inercia) para toda la web pública. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || isLowPowerDevice()) return;
    let disposed = false;
    let cleanup = () => {};
    // Lenis se descarga aparte, después de la carga inicial, y solo en equipos que lo aprovechan.
    import('lenis').then(({ default: Lenis }) => {
      if (disposed) return;
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      let raf = 0;
      const loop = (time: number) => { lenis.raf(time); raf = requestAnimationFrame(loop); };
      const start = () => { if (!raf) raf = requestAnimationFrame(loop); };
      const stop = () => { cancelAnimationFrame(raf); raf = 0; };
      const onVisibility = () => (document.hidden ? stop() : start());
      start();
      document.addEventListener('visibilitychange', onVisibility);
      // Anclas internas (#servicios, #proceso ...) con desplazamiento suave
      const onClick = (e: MouseEvent) => {
        const a = (e.target as HTMLElement).closest('a[href^="/#"], a[href^="#"]') as HTMLAnchorElement | null;
        if (!a || location.pathname !== '/') return;
        const id = a.getAttribute('href')!.split('#')[1];
        const el = id && document.getElementById(id);
        if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -70 }); history.replaceState(null, '', `#${id}`); }
      };
      document.addEventListener('click', onClick);
      cleanup = () => { stop(); lenis.destroy(); document.removeEventListener('click', onClick); document.removeEventListener('visibilitychange', onVisibility); };
    });
    return () => { disposed = true; cleanup(); };
  }, []);
  return null;
}

/**
 * Aparición al entrar en pantalla (CSS + un IntersectionObserver compartido; ver `.reveal` en globals.css). `above` es para lo que ya
 * está en la primera pantalla: no parte de `opacity: 0` (se ve en el HTML del servidor) y solo hace el desplazamiento.
 */
export function Reveal({ children, delay = 0, y = 32, className = '', above = false }: { children: React.ReactNode; delay?: number; y?: number; className?: string; above?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => onceInView(ref.current!, () => ref.current?.classList.add('is-in'), '0px 0px -80px 0px'), []);
  return (
    <div ref={ref} className={`reveal ${above ? 'reveal-above ' : ''}${className}`} style={{ '--ry': `${y}px`, '--rd': `${delay}s` } as React.CSSProperties}>
      {children}
    </div>
  );
}

/**
 * Titular que sube palabra por palabra. El texto está en el HTML del servidor y se ve desde el primer render:
 * la animación (CSS, `.split-word`) solo lo desplaza unos píxeles y nunca lo oculta, ni siquiera sin JavaScript.
 * En móvil y con "reducir movimiento" no se anima (ver globals.css).
 */
export function SplitWords({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="split-word inline-block" style={{ '--d': `${delay + i * 0.035}s` } as React.CSSProperties}>
          {word}&nbsp;
        </span>
      ))}
    </span>
  );
}

/** Tarjeta con foco de luz que sigue al cursor y leve inclinación 3D. */
export function SpotlightCard({ children, className = '', tilt = true }: { children: React.ReactNode; className?: string; tilt?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent) {
    if (!hasFinePointer()) return; // sin ratón no hay foco que seguir (y se evita un getBoundingClientRect por toque)
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    if (tilt && e.pointerType === 'mouse') el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 8}deg)`;
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => { ref.current!.style.transform = ''; }}
      className={`spotlight ${className}`}
    >
      {children}
    </div>
  );
}

/** Botón / elemento "magnético" que se acerca al cursor. */
export function Magnetic({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="magnetic inline-block"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !hasFinePointer()) return;
        const el = ref.current!;
        const r = el.getBoundingClientRect();
        el.style.transform = `translate3d(${(e.clientX - r.left - r.width / 2) * strength}px, ${(e.clientY - r.top - r.height / 2) * strength}px, 0)`;
      }}
      onPointerLeave={() => { ref.current!.style.transform = ''; }}
    >
      {children}
    </div>
  );
}

/** Contador animado (ej. "100%", "24h", "10+"). */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => onceInView(ref.current!, () => setInView(true)), []);
  const match = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView || !match) return;
    const target = Number(match[2]);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1400);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!match) return <span ref={ref}>{value}</span>;
  return <span ref={ref}>{match[1]}{n}{match[3]}</span>;
}

/** Barra de progreso de lectura en la parte superior. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollProgress(null, 'page', (p) => { if (ref.current) ref.current.style.transform = `scaleX(${p})`; });
  return <div ref={ref} className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-150 ease-out" />;
}

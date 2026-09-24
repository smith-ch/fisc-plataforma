'use client';

import { useEffect, useRef } from 'react';

interface Props {
  /** Colores de las manchas de luz (aurora). */
  colors?: string[];
  /** Muestra la malla de puntos reactiva al cursor. */
  dots?: boolean;
  className?: string;
}

interface Dot { x: number; y: number; ox: number; oy: number; vx: number; vy: number; glow: number }
interface Ripple { x: number; y: number; t0: number; power: number }

const RIPPLE_SPEED = 0.9; // px por ms
const RIPPLE_LIFE = 1400; // ms
const RIPPLE_WIDTH = 70; // px

/**
 * Fondo interactivo tipo "aurora" + malla de puntos con física:
 * - Manchas de luz que flotan; la principal persigue al cursor con inercia.
 * - Cada punto es un resorte: el cursor lo empuja (y arrastra según su
 *   velocidad) y vuelve a su sitio con un rebote suave.
 * - Cerca del cursor los puntos se unen en una "tela" que se deforma.
 * - Al hacer clic / tocar se emite una onda expansiva.
 * Sigue el tema claro/oscuro, se pausa fuera de pantalla y respeta
 * `prefers-reduced-motion`.
 */
export function InteractiveBackground({ colors = ['#3E4A52', '#8FA4B0', '#1f2a30', '#5b6b75'], dots = true, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const aurora = auroraRef.current!;
    const dotCanvas = dotsRef.current;
    const actx = aurora.getContext('2d')!;
    const dctx = dotCanvas?.getContext('2d') ?? null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;

    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, t = 0, last = 0;
    let dark = root.classList.contains('dark');
    let grid: Dot[] = [];
    let cols = 0, gap = 32;
    const ripples: Ripple[] = [];
    const mouse = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4, px: -9999, py: -9999, vx: 0, vy: 0, active: false, lastMove: 0 };
    // Estado del "empuje" de scroll: cada tramo desplazado dispara una onda que
    // entra por el borde de la sección hacia el que se está desplazando.
    let lastScrollY = window.scrollY, lastRippleAt = 0;

    const blobs = colors.map((c, i) => ({
      color: c,
      r: 0.35 + (i % 3) * 0.08,
      sx: 0.2 + ((i * 37) % 60) / 100,
      sy: 0.2 + ((i * 53) % 60) / 100,
      speed: 0.00018 + i * 0.00005,
      phase: i * 1.7,
    }));

    function buildGrid() {
      gap = w < 640 ? 26 : 32;
      cols = Math.ceil(w / gap);
      const rows = Math.ceil(h / gap);
      grid = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          grid.push({ x: gap / 2 + c * gap, y: gap / 2 + r * gap, ox: 0, oy: 0, vx: 0, vy: 0, glow: 0 });
        }
      }
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      // La aurora se pinta a baja resolución (se difumina con CSS): mucho más barato.
      aurora.width = Math.max(1, Math.round(w / 6));
      aurora.height = Math.max(1, Math.round(h / 6));
      if (dotCanvas) { dotCanvas.width = w * dpr; dotCanvas.height = h * dpr; }
      buildGrid();
      if (reduced) draw();
    }

    function drawAurora() {
      const aw = aurora.width, ah = aurora.height;
      actx.clearRect(0, 0, aw, ah);
      // En oscuro las luces se suman; en claro se pintan como veladuras suaves.
      actx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      blobs.forEach((b, i) => {
        let x = (b.sx + Math.sin(t * b.speed + b.phase) * 0.18) * aw;
        let y = (b.sy + Math.cos(t * b.speed * 1.3 + b.phase) * 0.16) * ah;
        if (i === 0) { x = mouse.x * aw; y = mouse.y * ah; } // la primera sigue al cursor
        const r = b.r * Math.max(aw, ah);
        const g = actx.createRadialGradient(x, y, 0, x, y, r);
        const a = dark ? (i === 0 ? 0.75 : 0.55) : (i === 0 ? 0.42 : 0.26);
        g.addColorStop(0, hexA(b.color, a));
        g.addColorStop(1, hexA(b.color, 0));
        actx.fillStyle = g;
        actx.fillRect(0, 0, aw, ah);
      });
      actx.globalCompositeOperation = 'source-over';
    }

    /** Integra la física de los puntos (resortes + cursor + ondas). */
    function step(dt: number) {
      const radius = 180;
      const k = 0.012, damping = 0.86;
      const speed = Math.min(Math.hypot(mouse.vx, mouse.vy), 3);
      for (const d of grid) {
        let fx = -d.ox * k * dt, fy = -d.oy * k * dt;
        let glow = 0;

        const dx = d.x - mouse.px, dy = d.y - mouse.py;
        const dist = Math.hypot(dx, dy);
        if (dist < radius) {
          const f = 1 - dist / radius;
          const push = f * f * (0.9 + speed * 0.9);
          fx += (dx / (dist || 1)) * push * dt * 0.09;
          fy += (dy / (dist || 1)) * push * dt * 0.09;
          // Arrastre en la dirección del movimiento del cursor ("estela")
          fx += mouse.vx * f * dt * 0.035;
          fy += mouse.vy * f * dt * 0.035;
          glow = f;
        }

        for (const rp of ripples) {
          const age = t - rp.t0;
          if (age < 0) continue;
          const ring = age * RIPPLE_SPEED;
          const rdx = d.x - rp.x, rdy = d.y - rp.y;
          const rd = Math.hypot(rdx, rdy);
          const band = 1 - Math.abs(rd - ring) / RIPPLE_WIDTH;
          if (band > 0) {
            const life = 1 - age / RIPPLE_LIFE;
            const f = band * life * rp.power;
            fx += (rdx / (rd || 1)) * f * dt * 0.12;
            fy += (rdy / (rd || 1)) * f * dt * 0.12;
            glow = Math.max(glow, f * 0.9);
          }
        }

        d.vx = (d.vx + fx) * damping;
        d.vy = (d.vy + fy) * damping;
        d.ox += d.vx; d.oy += d.vy;
        // El brillo también depende de cuánto se desplazó el punto
        const disp = Math.min(Math.hypot(d.ox, d.oy) / 22, 1);
        d.glow = Math.max(glow, disp * 0.8);
      }
      for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t0 > RIPPLE_LIFE) ripples.splice(i, 1);
    }

    function drawDots() {
      if (!dctx || !dotCanvas) return;
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dctx.clearRect(0, 0, w, h);
      const ink = dark ? '255,255,255' : '14,14,13';
      const hi = dark ? '190,214,226' : '62,74,82';
      const baseA = dark ? 0.07 : 0.1;

      // 1) Puntos en reposo, agrupados por opacidad para dibujarlos en pocas pasadas.
      const BUCKETS = 6;
      const paths: Path2D[] = Array.from({ length: BUCKETS }, () => new Path2D());
      const lit: number[] = [];
      grid.forEach((d, i) => {
        if (d.glow > 0.04) { lit.push(i); return; }
        const wave = reduced ? 0 : Math.sin((d.x + d.y) * 0.012 + t * 0.0015) * 0.5 + 0.5;
        const b = Math.min(BUCKETS - 1, Math.floor(wave * BUCKETS));
        const x = d.x + d.ox, y = d.y + d.oy;
        paths[b].moveTo(x + 1, y);
        paths[b].arc(x, y, 1, 0, Math.PI * 2);
      });
      paths.forEach((p, b) => {
        dctx.fillStyle = `rgba(${ink},${baseA + (b / (BUCKETS - 1)) * 0.05})`;
        dctx.fill(p);
      });

      // 2) "Tela": líneas entre puntos vecinos iluminados (se deforma con el cursor).
      dctx.lineWidth = 1;
      for (const i of lit) {
        const d = grid[i];
        const right = i % cols < cols - 1 ? grid[i + 1] : undefined;
        const down = grid[i + cols];
        for (const n of [right, down]) {
          if (!n || n.glow <= 0.04) continue;
          const a = Math.min(d.glow, n.glow) * (dark ? 0.35 : 0.28);
          dctx.strokeStyle = `rgba(${hi},${a})`;
          dctx.beginPath();
          dctx.moveTo(d.x + d.ox, d.y + d.oy);
          dctx.lineTo(n.x + n.ox, n.y + n.oy);
          dctx.stroke();
        }
      }

      // 3) Puntos iluminados, más grandes y con el tono de acento.
      for (const i of lit) {
        const d = grid[i];
        dctx.fillStyle = `rgba(${hi},${Math.min(1, baseA + d.glow * (dark ? 0.75 : 0.6))})`;
        dctx.beginPath();
        dctx.arc(d.x + d.ox, d.y + d.oy, 1 + d.glow * 1.9, 0, Math.PI * 2);
        dctx.fill();
      }
    }

    function draw() { drawAurora(); drawDots(); }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!visible) { last = now; return; }
      const dt = Math.min(now - (last || now), 48) / 16.67; // en "frames de 60 Hz"
      last = now;
      t = now;
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;
      mouse.vx *= 0.9; mouse.vy *= 0.9;
      if (!mouse.active || now - mouse.lastMove > 4000) {
        // Sin cursor (móvil / reposo) la luz principal describe una órbita suave
        mouse.tx = 0.5 + Math.sin(now * 0.0003) * 0.25;
        mouse.ty = 0.45 + Math.cos(now * 0.00025) * 0.15;
      }
      step(dt);
      draw();
    }

    function onMove(e: PointerEvent) {
      const rect = wrap.getBoundingClientRect();
      const inside = e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inside) { mouse.active = false; mouse.px = mouse.py = -9999; return; }
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      if (mouse.active && mouse.px > -9999) {
        mouse.vx = mouse.vx * 0.5 + (px - mouse.px) * 0.5;
        mouse.vy = mouse.vy * 0.5 + (py - mouse.py) * 0.5;
      }
      mouse.active = true;
      mouse.lastMove = performance.now();
      mouse.tx = px / rect.width;
      mouse.ty = py / rect.height;
      mouse.px = px; mouse.py = py;
    }

    function onDown(e: PointerEvent) {
      const rect = wrap.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;
      ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t0: performance.now(), power: 1 });
      if (ripples.length > 4) ripples.shift();
    }

    function onLeave() { mouse.active = false; mouse.px = mouse.py = -9999; }

    /**
     * El efecto también reacciona al scroll, no sólo al cursor: cada tramo
     * desplazado dispara una onda que entra por el borde de la sección hacia
     * el que uno se mueve (arriba al bajar, abajo al subir), así la malla se
     * "activa" de sección en sección a medida que se recorre la página.
     */
    function onScroll() {
      if (reduced) return;
      const sy = window.scrollY;
      const dy = sy - lastScrollY;
      lastScrollY = sy;
      const now = performance.now();
      if (Math.abs(dy) < 4 || now - lastRippleAt < 140) return;
      lastRippleAt = now;
      const rect = wrap.getBoundingClientRect();
      // Sólo si la sección está cerca de la pantalla (evita trabajo en secciones lejanas).
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
      const power = Math.min(1, Math.abs(dy) / 45);
      ripples.push({ x: w * (0.35 + Math.random() * 0.3), y: dy > 0 ? 0 : h, t0: now, power });
      if (ripples.length > 6) ripples.shift();
    }

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(wrap);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    // Redibuja con los colores del tema cuando cambia la clase `dark` de <html>
    const mo = new MutationObserver(() => { dark = root.classList.contains('dark'); if (reduced) draw(); });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    resize();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('pointerleave', onLeave);
    if (reduced) draw();
    else {
      // Onda de bienvenida desde el centro al cargar
      ripples.push({ x: w * 0.5, y: h * 0.5, t0: performance.now() + 250, power: 0.8 });
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [colors.join(','), dots]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={wrapRef} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <canvas ref={auroraRef} className="absolute inset-0 h-full w-full scale-110 blur-3xl saturate-150" />
      {dots && <canvas ref={dotsRef} className="absolute inset-0 h-full w-full" />}
    </div>
  );
}

function hexA(hex: string, a: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

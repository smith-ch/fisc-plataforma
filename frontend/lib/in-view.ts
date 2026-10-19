/**
 * Un `IntersectionObserver` por margen, compartido por todos los elementos de la página: avisa una sola vez cuando el elemento
 * entra en pantalla y lo deja de observar. Reemplaza a `whileInView` / `useInView` de `motion`.
 */
const observers = new Map<string, { io: IntersectionObserver; cbs: Map<Element, () => void> }>();

export function onceInView(el: Element, cb: () => void, rootMargin = '0px'): () => void {
  if (typeof IntersectionObserver === 'undefined') { cb(); return () => {}; }
  let entry = observers.get(rootMargin);
  if (!entry) {
    const cbs = new Map<Element, () => void>();
    const io = new IntersectionObserver((list) => {
      for (const e of list) {
        if (!e.isIntersecting) continue;
        const fn = cbs.get(e.target);
        io.unobserve(e.target);
        cbs.delete(e.target);
        fn?.();
      }
    }, { rootMargin });
    entry = { io, cbs };
    observers.set(rootMargin, entry);
  }
  const { io, cbs } = entry;
  cbs.set(el, cb);
  io.observe(el);
  return () => { cbs.delete(el); io.unobserve(el); };
}

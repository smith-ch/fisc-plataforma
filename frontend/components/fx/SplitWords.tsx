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

'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { THEME_STORAGE_KEY as STORAGE_KEY } from '@/lib/theme-script';

export type Theme = 'light' | 'dark';

interface ThemeCtx { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }

const ThemeContext = createContext<ThemeCtx | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme fuera de ThemeProvider');
  return ctx;
}

function readTheme(): Theme {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // El valor real lo fija `themeScript` antes de hidratar; aquí sólo lo leemos.
  const [theme, setThemeState] = useState<Theme>('light');

  const apply = useCallback((t: Theme, persist = true) => {
    const root = document.documentElement;
    // Transición suave de colores sólo durante el cambio (no en cada hover)
    root.classList.add('theme-transition');
    root.classList.toggle('dark', t === 'dark');
    root.style.colorScheme = t;
    window.setTimeout(() => root.classList.remove('theme-transition'), 500);
    if (persist) { try { localStorage.setItem(STORAGE_KEY, t); } catch { /* sin almacenamiento */ } }
    setThemeState(t);
  }, []);

  useEffect(() => {
    setThemeState(readTheme());
    // Si el usuario no ha elegido tema, seguimos los cambios del sistema.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* sin almacenamiento */ }
      if (!saved) apply(mq.matches ? 'dark' : 'light', false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [apply]);

  const toggle = useCallback(() => apply(readTheme() === 'dark' ? 'light' : 'dark'), [apply]);

  return <ThemeContext.Provider value={{ theme, setTheme: apply, toggle }}>{children}</ThemeContext.Provider>;
}

/** Botón sol / luna para alternar entre modo claro y oscuro. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button type="button" onClick={toggle} aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-full transition hover:bg-ink-900/5 ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} initial={{ y: 14, rotate: -90, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -14, rotate: 90, opacity: 0 }} transition={{ duration: 0.25 }} className="grid place-items-center">
          {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

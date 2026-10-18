'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Service } from '@/lib/types';

// ---------------- Carrito de servicios ----------------
// Vive solo en el navegador (localStorage). Al enviar la solicitud se arma un mensaje de WhatsApp; no hay servidor.

export interface CartItem { serviceId: number; name: string; slug: string; icon: string | null; quantity: number; notes: string }

interface CartCtx {
  items: CartItem[];
  add: (s: Pick<Service, 'id' | 'name' | 'slug' | 'icon'>) => void;
  remove: (serviceId: number) => void;
  update: (serviceId: number, patch: Partial<CartItem>) => void;
  has: (serviceId: number) => boolean;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const CartContext = createContext<CartCtx | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart fuera de Providers');
  return ctx;
}

const CART_KEY = 'fisc_cart_v2';

export function Providers({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Se lee el carrito guardado una sola vez, después de montar (así el HTML del servidor y el primero del cliente coinciden).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (Array.isArray(saved)) setItems(saved.filter((i) => i && typeof i.serviceId === 'number' && typeof i.name === 'string'));
    } catch { /* carrito vacío */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* sin almacenamiento */ }
  }, [items, hydrated]);

  const cart = useMemo<CartCtx>(() => ({
    items, open, setOpen,
    add: (s) => setItems((prev) => prev.some((i) => i.serviceId === s.id) ? prev
      : [...prev, { serviceId: s.id, name: s.name, slug: s.slug, icon: s.icon, quantity: 1, notes: '' }]),
    remove: (id) => setItems((prev) => prev.filter((i) => i.serviceId !== id)),
    update: (id, patch) => setItems((prev) => prev.map((i) => (i.serviceId === id ? { ...i, ...patch } : i))),
    has: (id) => items.some((i) => i.serviceId === id),
    clear: () => setItems([]),
  }), [items, open]);

  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

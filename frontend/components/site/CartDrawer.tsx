'use client';

import { AnimatePresence, m } from 'motion/react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/components/providers';
import { ServiceIcon, WhatsAppIcon } from '@/components/Icon';
import { waLink } from '@/lib/constants';
import { mensajeSolicitud } from '@/lib/solicitud';

/** Carrito lateral. `phone` es el WhatsApp del negocio (solo dígitos con código de país). */
export function CartDrawer({ phone }: { phone: string }) {
  const cart = useCart();
  return (
    <AnimatePresence>
      {cart.open && (
        <>
          <m.div className="fixed inset-0 z-[70] bg-ink-950/40" onClick={() => cart.setOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <m.aside className="fixed top-0 right-0 bottom-0 z-[71] flex w-full max-w-md flex-col bg-sand-50 shadow-2xl"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            data-lenis-prevent role="dialog" aria-label="Tu solicitud">
            <div className="flex items-center justify-between border-b border-ink-900/10 p-5">
              <h3 className="flex items-center gap-2 text-lg font-bold"><ShoppingBag className="h-5 w-5 text-brand-ink" /> Tu solicitud</h3>
              <button onClick={() => cart.setOpen(false)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink-900/5"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {cart.items.length === 0 ? (
                <div className="py-16 text-center text-ink-900/50">
                  <ShoppingBag className="mx-auto mb-3 h-10 w-10 opacity-40" />
                  <p>Aún no has agregado servicios.</p>
                  <Link href="/servicios" onClick={() => cart.setOpen(false)} className="btn-ghost mt-4">Ver catálogo</Link>
                </div>
              ) : cart.items.map((i) => (
                <div key={i.serviceId} className="card flex items-center gap-3 p-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink"><ServiceIcon name={i.icon} className="h-5 w-5" /></span>
                  <span className="flex-1 text-sm font-semibold">{i.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => cart.update(i.serviceId, { quantity: Math.max(1, i.quantity - 1) })} aria-label="Menos" className="grid h-7 w-7 place-items-center rounded-full bg-sand-100"><Minus className="h-3 w-3" /></button>
                    <span className="w-6 text-center text-sm font-bold">{i.quantity}</span>
                    <button onClick={() => cart.update(i.serviceId, { quantity: i.quantity + 1 })} aria-label="Más" className="grid h-7 w-7 place-items-center rounded-full bg-sand-100"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => cart.remove(i.serviceId)} aria-label="Quitar" className="grid h-8 w-8 place-items-center rounded-full text-ink-900/40 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            {cart.items.length > 0 && (
              <div className="space-y-3 border-t border-ink-900/10 p-5">
                <p className="text-xs text-ink-900/60">Un solo levantamiento para todos los servicios. Te respondemos por WhatsApp con una cotización unificada.</p>
                {phone && (
                  <a href={waLink(phone, mensajeSolicitud(cart.items))} target="_blank" rel="noopener noreferrer"
                    className="btn w-full bg-[#25D366] text-white hover:brightness-110">
                    <WhatsAppIcon className="h-5 w-5" /> Enviar por WhatsApp
                  </a>
                )}
                <Link href="/solicitar" onClick={() => cart.setOpen(false)} className="btn-ghost w-full">
                  Agregar datos de mi espacio <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </m.aside>
        </>
      )}
    </AnimatePresence>
  );
}

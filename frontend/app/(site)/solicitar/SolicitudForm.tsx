'use client';

import { CheckCircle2, ClipboardCopy, Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ServiceIcon, WhatsAppIcon } from '@/components/Icon';
import { useCart } from '@/components/providers';
import { Alert } from '@/components/ui/bits';
import { PROPERTY_TYPES, URGENCY, waLink } from '@/lib/constants';
import { mensajeSolicitud } from '@/lib/solicitud';
import type { Pillar } from '@/lib/types';

const HORARIOS = ['8:00 a.m. – 10:00 a.m.', '10:00 a.m. – 12:00 p.m.', '2:00 p.m. – 4:00 p.m.', '4:00 p.m. – 6:00 p.m.'];

/** Formulario de solicitud: arma el mensaje y abre WhatsApp. No guarda nada en ningún servidor. */
export function SolicitudForm({ catalog, phone }: { catalog: Pillar[]; phone: string }) {
  const cart = useCart();
  const [form, setForm] = useState({
    nombre: '', telefono: '', direccion: '', tipoPropiedad: 'residencial', tamano: '', urgencia: 'normal',
    visita: 'presencial', fecha: '', horario: HORARIOS[0], notas: '',
  });
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const minFecha = useMemo(() => new Date(Date.now() + 864e5).toISOString().slice(0, 10), []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const etiqueta = (lista: { value: string; label: string }[], v: string) => lista.find((x) => x.value === v)?.label ?? v;
  const mensaje = mensajeSolicitud(cart.items, {
    nombre: form.nombre,
    telefono: form.telefono,
    direccion: form.direccion,
    tipoPropiedad: etiqueta(PROPERTY_TYPES, form.tipoPropiedad),
    tamano: form.tamano,
    urgencia: etiqueta(URGENCY.map((u) => ({ value: u.value, label: u.label })), form.urgencia),
    visita: form.visita === 'virtual' ? 'Evaluación virtual' : 'Visita presencial',
    fecha: form.fecha,
    horario: form.fecha ? form.horario : '',
    notas: form.notas,
  });

  function validar(): string {
    if (cart.items.length === 0) return 'Selecciona al menos un servicio.';
    if (form.nombre.trim().length < 2) return 'Escribe tu nombre.';
    if (form.telefono.replace(/\D/g, '').length < 7) return 'Escribe un teléfono válido.';
    if (form.direccion.trim().length < 5) return 'Indica la dirección o el sector del espacio.';
    return '';
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const msg = validar();
    setError(msg);
    if (msg || !phone) return;
    window.open(waLink(phone, mensaje), '_blank', 'noopener,noreferrer');
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(mensaje); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch { /* sin portapapeles */ }
  }

  return (
    <form onSubmit={enviar} className="container-x grid gap-10 py-14 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <section className="card rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-bold">¿Qué servicios necesitas?</h2>
          <p className="mt-1 text-sm text-ink-900/60">Puedes elegir varios: se evalúan en un solo levantamiento.</p>
          {catalog.map((p) => (
            <div key={p.id} className="mt-6">
              <p className="eyebrow mb-3 text-ink-900/50">Pilar {p.code} · {p.title}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(p.services ?? []).map((s) => {
                  const on = cart.has(s.id);
                  return (
                    <button key={s.id} type="button" aria-pressed={on} onClick={() => (on ? cart.remove(s.id) : cart.add(s))}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${on ? 'border-brand bg-brand-soft' : 'border-ink-900/10 hover:border-brand/40'}`}>
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? 'bg-brand text-white' : 'bg-sand-100 text-ink-900/70'}`}><ServiceIcon name={s.icon} className="h-5 w-5" /></span>
                      <span className="flex-1 text-sm font-semibold">{s.name}</span>
                      <span className={`grid h-5 w-5 place-items-center rounded-full border ${on ? 'border-brand bg-brand text-white' : 'border-ink-900/20'}`}>{on && <CheckCircle2 className="h-4 w-4" />}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {cart.items.length > 0 && (
            <div className="mt-8 space-y-3 border-t border-ink-900/10 pt-6">
              <p className="text-sm font-semibold">Detalles por servicio (opcional)</p>
              {cart.items.map((i) => (
                <div key={i.serviceId} className="flex flex-col gap-2 rounded-2xl bg-sand-50 p-3 sm:flex-row sm:items-center">
                  <span className="flex-1 text-sm font-medium">{i.name}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Menos" onClick={() => cart.update(i.serviceId, { quantity: Math.max(1, i.quantity - 1) })} className="grid h-8 w-8 place-items-center rounded-full bg-paper"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm font-bold">{i.quantity}</span>
                    <button type="button" aria-label="Más" onClick={() => cart.update(i.serviceId, { quantity: i.quantity + 1 })} className="grid h-8 w-8 place-items-center rounded-full bg-paper"><Plus className="h-3 w-3" /></button>
                  </div>
                  <input value={i.notes} onChange={(e) => cart.update(i.serviceId, { notes: e.target.value })} placeholder="Ej.: 3 habitaciones, techo de 80 m²…" className="input sm:w-72" />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card grid gap-5 rounded-3xl p-6 sm:grid-cols-2 sm:p-8">
          <h2 className="text-xl font-bold sm:col-span-2">Tu espacio</h2>
          <div className="sm:col-span-2"><label className="label" htmlFor="direccion">Dirección o sector *</label><input id="direccion" value={form.direccion} onChange={set('direccion')} className="input" placeholder="Calle, número, sector" autoComplete="street-address" /></div>
          <div><label className="label" htmlFor="tamano">Tamaño aproximado</label><input id="tamano" value={form.tamano} onChange={set('tamano')} className="input" placeholder="Ej.: 120 m²" /></div>
          <div>
            <label className="label" htmlFor="tipo">Tipo de propiedad</label>
            <select id="tipo" value={form.tipoPropiedad} onChange={set('tipoPropiedad')} className="input">{PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
          </div>
          <div className="sm:col-span-2">
            <span className="label">Urgencia</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {URGENCY.map((u) => (
                <button key={u.value} type="button" aria-pressed={form.urgencia === u.value} onClick={() => setForm((f) => ({ ...f, urgencia: u.value }))}
                  className={`rounded-2xl border p-3 text-left transition ${form.urgencia === u.value ? 'border-brand bg-brand-soft' : 'border-ink-900/10'}`}>
                  <span className="block text-sm font-bold">{u.label}</span><span className="text-xs text-ink-900/55">{u.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
            {[{ v: 'presencial', t: 'Visita presencial', d: 'Un supervisor mide y audita en el lugar' },
              { v: 'virtual', t: 'Evaluación virtual', d: 'Por videollamada, ideal para trabajos pequeños' }].map((o) => (
              <button key={o.v} type="button" aria-pressed={form.visita === o.v} onClick={() => setForm((f) => ({ ...f, visita: o.v }))}
                className={`rounded-2xl border p-4 text-left transition ${form.visita === o.v ? 'border-brand bg-brand-soft' : 'border-ink-900/10'}`}>
                <span className="block font-bold">{o.t}</span><span className="text-xs text-ink-900/55">{o.d}</span>
              </button>
            ))}
          </div>
          <div><label className="label" htmlFor="fecha">Fecha preferida</label><input id="fecha" type="date" min={minFecha} value={form.fecha} onChange={set('fecha')} className="input" /></div>
          <div>
            <label className="label" htmlFor="horario">Horario preferido</label>
            <select id="horario" value={form.horario} onChange={set('horario')} className="input" disabled={!form.fecha}>{HORARIOS.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="sm:col-span-2"><label className="label" htmlFor="notas">Notas adicionales</label><textarea id="notas" value={form.notas} onChange={set('notas')} rows={3} className="input" placeholder="Describe lo que necesitas, acceso al lugar, horarios, etc." /></div>
        </section>

        <section className="card grid gap-5 rounded-3xl p-6 sm:grid-cols-2 sm:p-8">
          <h2 className="text-xl font-bold sm:col-span-2">Tus datos</h2>
          <div><label className="label" htmlFor="nombre">Nombre completo *</label><input id="nombre" value={form.nombre} onChange={set('nombre')} className="input" autoComplete="name" /></div>
          <div><label className="label" htmlFor="telefono">Teléfono / WhatsApp *</label><input id="telefono" type="tel" value={form.telefono} onChange={set('telefono')} className="input" placeholder="809-000-0000" autoComplete="tel" /></div>
          {error && <div className="sm:col-span-2"><Alert>{error}</Alert></div>}
          {!phone && <div className="sm:col-span-2"><Alert>Falta configurar el WhatsApp del negocio.</Alert></div>}
        </section>
      </div>

      <aside>
        <div className="card sticky top-28 space-y-5 rounded-3xl p-6">
          <h3 className="font-bold">Resumen</h3>
          {cart.items.length === 0 ? <p className="text-sm text-ink-900/50">Sin servicios seleccionados.</p> : (
            <ul className="space-y-2">
              {cart.items.map((i) => (
                <li key={i.serviceId} className="flex items-center gap-2 text-sm">
                  <ServiceIcon name={i.icon} className="h-4 w-4 text-brand-ink" /><span className="flex-1">{i.name}</span><span className="text-ink-900/50">×{i.quantity}</span>
                </li>
              ))}
            </ul>
          )}
          <button type="submit" className="btn w-full bg-[#25D366] text-white hover:brightness-110" disabled={!phone}>
            <WhatsAppIcon className="h-5 w-5" /> Enviar por WhatsApp
          </button>
          <button type="button" onClick={copiar} className="btn-ghost w-full" disabled={cart.items.length === 0}>
            <ClipboardCopy className="h-4 w-4" /> {copiado ? 'Copiado' : 'Copiar el mensaje'}
          </button>
          <p className="rounded-2xl bg-brand-soft p-3 text-xs text-ink-900/70">Se abre WhatsApp con tu solicitud ya escrita. La cotización oficial y la factura con NCF te llegan después del levantamiento.</p>
        </div>
      </aside>
    </form>
  );
}

'use client';

import {
  ArrowLeft, Calendar, Check, Download, ExternalLink, FileText, Loader2, Plus, RefreshCw, Save, Send, Trash2, UserRound, X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/admin/ui';
import {
  Alert, Empty, PaymentBadge, Spinner, StatusBadge, StatusStepper, Timeline,
} from '@/components/ui/bits';
import { api } from '@/lib/api';
import {
  DOC_TYPES, PROPERTY_TYPES, STATUS, STATUS_FLOW, URGENCY, date, money,
} from '@/lib/constants';
import type { Order, User } from '@/lib/types';
import { useApi } from '@/lib/useApi';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => api<Order>(`/staff/orders/${id}`).then(setOrder).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(''), 2800); return () => clearTimeout(t); } }, [msg]);

  const { data: technicians } = useApi<User[]>('/admin/users?role=technician');

  if (error) return <div><Link href="/admin/ordenes" className="inline-flex items-center gap-1 text-sm text-ink-900/60 hover:text-brand-ink"><ArrowLeft className="h-4 w-4" /> Órdenes</Link><div className="mt-4"><Alert>{error}</Alert></div></div>;
  if (!order) return <Spinner />;

  return (
    <div>
      <Link href="/admin/ordenes" className="inline-flex items-center gap-1 text-sm text-ink-900/60 hover:text-brand-ink"><ArrowLeft className="h-4 w-4" /> Órdenes</Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{order.code} <span className="font-normal text-ink-900/50">· {order.items.map((i) => i.serviceName).join(', ')}</span></h1>
          <div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={order.status} /><PaymentBadge status={order.paymentStatus} /></div>
        </div>
      </div>
      {msg && <div className="mb-4"><Alert tone="success">{msg}</Alert></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6"><StatusStepper status={order.status} /></section>
          <StatusChanger order={order} onDone={(t) => { load(); setMsg(t); }} />

          {!!order.photos?.length && (
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-bold">Fotos del trabajo</h2>
              {(['antes', 'durante', 'despues'] as const).map((s) => {
                const items = order.photos!.filter((p) => p.stage === s);
                if (!items.length) return null;
                return (
                  <div key={s} className="mb-5">
                    <p className="label">{s === 'despues' ? 'Después' : s === 'antes' ? 'Antes' : 'Durante'}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {items.map((p) => (
                        <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt="" className="aspect-square w-full rounded-xl object-cover transition hover:opacity-80" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          <ProgressForm orderId={order.id} onDone={(t) => { load(); setMsg(t); }} />

          <section className="card p-6">
            <h2 className="mb-5 text-lg font-bold">Reportes y bitácora</h2>
            <Timeline updates={order.updates ?? []} staff />
          </section>

          <DocumentsSection order={order} onDone={(t) => { load(); setMsg(t); }} />
          <PaymentsSection order={order} onDone={(t) => { load(); setMsg(t); }} />
        </div>

        <aside className="space-y-6">
          <DetailsPanel order={order} technicians={technicians ?? []} onDone={(t) => { load(); setMsg(t); }} />
          {order.review && (
            <section className="card p-6">
              <h3 className="mb-2 font-bold">Evaluación del cliente</h3>
              <p className="text-sm">★ {order.review.rating}/5 {order.review.wouldRecommend ? '· Recomendaría' : ''}</p>
              {order.review.comment && <p className="mt-2 text-sm text-ink-900/70">“{order.review.comment}”</p>}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function StatusChanger({ order, onDone }: { order: Order; onDone: (msg: string) => void }) {
  const [status, setStatus] = useState(order.status);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setSending(true); setError('');
    try { await api(`/staff/orders/${order.id}/status`, { method: 'POST', body: { status, message: message || undefined } }); setMessage(''); onDone('Estado actualizado.'); }
    catch (e) { setError((e as Error).message); } finally { setSending(false); }
  }

  return (
    <section className="card p-6">
      <h2 className="mb-4 text-lg font-bold">Cambiar estado</h2>
      <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto]">
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="input">
          {STATUS_FLOW.concat('cancelada').map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensaje visible para el cliente (opcional)" className="input" />
        <button onClick={submit} disabled={sending || status === order.status} className="btn-primary">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Aplicar</button>
      </div>
      {error && <div className="mt-3"><Alert>{error}</Alert></div>}
    </section>
  );
}

const STAGES = [{ v: 'antes', l: 'Antes' }, { v: 'durante', l: 'Durante' }, { v: 'despues', l: 'Después' }];

function ProgressForm({ orderId, onDone }: { orderId: number; onDone: (msg: string) => void }) {
  const [message, setMessage] = useState('');
  const [stage, setStage] = useState('durante');
  const [visible, setVisible] = useState(true);
  const [files, setFiles] = useState<FileList | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true); setError('');
    try {
      const fd = new FormData();
      fd.append('message', message); fd.append('stage', stage); fd.append('visibleToClient', String(visible));
      if (files) Array.from(files).forEach((f) => fd.append('photos', f));
      await api(`/staff/orders/${orderId}/progress`, { body: fd });
      setMessage(''); setFiles(null); onDone('Reporte agregado.');
    } catch (e2) { setError((e2 as Error).message); } finally { setSending(false); }
  }

  return (
    <section className="card p-6">
      <h2 className="mb-4 text-lg font-bold">Agregar reporte de avance</h2>
      <form onSubmit={submit} className="space-y-3">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} required placeholder="¿Qué se hizo hoy?" className="input" />
        <div className="flex flex-wrap items-center gap-3">
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="input w-auto">{STAGES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select>
          <input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:text-white" />
          <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="accent-[var(--brand)]" /> Visible para el cliente</label>
          <button className="btn-primary" disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar</button>
        </div>
        {error && <Alert>{error}</Alert>}
      </form>
    </section>
  );
}

function DetailsPanel({ order, technicians, onDone }: { order: Order; technicians: User[]; onDone: (msg: string) => void }) {
  const [technicianId, setTechnicianId] = useState(order.technician?.id ?? '');
  const [scheduledAt, setScheduledAt] = useState(order.scheduledAt ?? '');
  const [quotedAmount, setQuotedAmount] = useState(order.quotedAmount ?? '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(order.estimatedDelivery ?? '');
  const [internalNotes, setInternalNotes] = useState(order.internalNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true); setError('');
    try {
      await api(`/admin/orders/${order.id}`, {
        method: 'PATCH',
        body: {
          technicianId: technicianId ? Number(technicianId) : null,
          scheduledAt: scheduledAt || null,
          quotedAmount: quotedAmount === '' ? null : Number(quotedAmount),
          estimatedDelivery: estimatedDelivery || null,
          internalNotes: internalNotes || null,
        },
      });
      onDone('Detalles guardados.');
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <section className="card space-y-4 p-6">
      <h3 className="font-bold">Detalles y gestión</h3>
      <div className="space-y-3 text-sm">
        <p><b>{order.contactName}</b><br /><span className="text-ink-900/60">{order.contactEmail} · {order.contactPhone}</span></p>
        <p className="text-ink-900/70">{order.address}{order.city ? `, ${order.city}` : ''}</p>
        <div className="flex flex-wrap gap-2 text-xs text-ink-900/55">
          <span className="badge bg-ink-900/5">{PROPERTY_TYPES.find((p) => p.value === order.propertyType)?.label ?? order.propertyType}</span>
          <span className="badge bg-ink-900/5">{URGENCY.find((u) => u.value === order.urgency)?.label ?? order.urgency}</span>
          {order.areaSize && <span className="badge bg-ink-900/5">{order.areaSize}</span>}
          <span className="badge bg-ink-900/5 capitalize">{order.visitType}</span>
        </div>
        {order.preferredDate && <p className="flex items-center gap-2 text-ink-900/60"><Calendar className="h-4 w-4" /> Preferencia: {order.preferredDate} {order.preferredTime}</p>}
        {order.notes && <p className="rounded-xl bg-sand-50 p-3 text-ink-900/70">{order.notes}</p>}
      </div>

      <div className="space-y-3 border-t border-ink-900/10 pt-4">
        <div><label className="label">Técnico asignado</label>
          <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} className="input">
            <option value="">Sin asignar</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}{t.specialty ? ` (${t.specialty})` : ''}</option>)}
          </select>
        </div>
        <div><label className="label">Fecha/hora programada</label><input type="datetime-local" value={scheduledAt ? scheduledAt.slice(0, 16) : ''} onChange={(e) => setScheduledAt(e.target.value)} className="input" /></div>
        <div><label className="label">Monto cotizado (RD$)</label><input type="number" step="0.01" value={quotedAmount} onChange={(e) => setQuotedAmount(e.target.value)} className="input" /></div>
        <div><label className="label">Entrega estimada</label><input value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} placeholder="Ej. 5-7 días hábiles" className="input" /></div>
        <div><label className="label">Notas internas (no las ve el cliente)</label><textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={3} className="input" /></div>
        {error && <Alert>{error}</Alert>}
        <button onClick={save} disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar</button>
      </div>
    </section>
  );
}

const DOC_TYPE_OPTIONS = [{ v: 'cotizacion', l: 'Cotización' }, { v: 'factura', l: 'Factura' }, { v: 'recibo', l: 'Recibo' }];

function DocumentsSection({ order, onDone }: { order: Order; onDone: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  async function sync() {
    setSyncing(true); setError('');
    try { const res = await api<{ synced: number; created: number; mode: string }>(`/admin/orders/${order.id}/documents/sync`, { method: 'POST' });
      onDone(`Sincronizado con Concrebill (${res.mode}): ${res.created} documento(s) nuevo(s).`);
    } catch (e) { setError((e as Error).message); } finally { setSyncing(false); }
  }

  async function remove(id: number) {
    if (!confirm('¿Eliminar este documento?')) return;
    try { await api(`/admin/documents/${id}`, { method: 'DELETE' }); onDone('Documento eliminado.'); } catch (e) { setError((e as Error).message); }
  }

  return (
    <section className="card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Documentos</h2>
        <div className="flex gap-2">
          <button onClick={sync} disabled={syncing} className="btn-ghost btn-sm">{syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Sincronizar con Concrebill</button>
          <button onClick={() => setOpen(true)} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Agregar</button>
        </div>
      </div>
      {error && <div className="mb-3"><Alert>{error}</Alert></div>}
      {!order.documents?.length ? <Empty>Sin cotizaciones ni facturas todavía.</Empty> : (
        <ul className="space-y-2">
          {order.documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-sand-50 p-3 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-brand-ink" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{DOC_TYPES[d.type]} {d.number}</p>
                <p className="text-xs text-ink-900/50">{money(d.amount, d.currency)} · {d.status} {d.origin === 'concrebill' && '· Concrebill'}</p>
              </div>
              {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink-900/5"><Download className="h-4 w-4" /></a>}
              <button onClick={() => remove(d.id)} className="grid h-8 w-8 place-items-center rounded-full text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar documento">
        <DocumentForm orderId={order.id} onDone={(t) => { setOpen(false); onDone(t); }} />
      </Modal>
    </section>
  );
}

function DocumentForm({ orderId, onDone }: { orderId: number; onDone: (msg: string) => void }) {
  const [type, setType] = useState('cotizacion');
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); setError('');
    try {
      const fd = new FormData();
      fd.append('type', type); fd.append('number', number); fd.append('amount', amount);
      if (file) fd.append('file', file);
      await api(`/admin/orders/${orderId}/documents`, { body: fd });
      onDone('Documento agregado.');
    } catch (e2) { setError((e2 as Error).message); } finally { setSending(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div><label className="label">Tipo</label><select value={type} onChange={(e) => setType(e.target.value)} className="input">{DOC_TYPE_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
      <div><label className="label">Número</label><input value={number} onChange={(e) => setNumber(e.target.value)} required className="input" /></div>
      <div><label className="label">Monto (RD$)</label><input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required className="input" /></div>
      <div><label className="label">Archivo (PDF o imagen, opcional)</label><input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="input file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1 file:text-xs file:text-white" /></div>
      {error && <Alert>{error}</Alert>}
      <button className="btn-primary w-full" disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar</button>
    </form>
  );
}

const PAYMENT_METHODS = [{ v: 'transferencia', l: 'Transferencia' }, { v: 'efectivo', l: 'Efectivo' }, { v: 'tarjeta', l: 'Tarjeta' }, { v: 'paypal', l: 'PayPal' }];

function PaymentsSection({ order, onDone }: { order: Order; onDone: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function approve(id: number) {
    setBusy(id);
    try { await api(`/admin/payments/${id}`, { method: 'PATCH', body: { status: 'validado' } }); onDone('Pago validado.'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }
  async function reject(id: number) {
    setBusy(id);
    try { await api(`/admin/payments/${id}`, { method: 'PATCH', body: { status: 'rechazado' } }); onDone('Pago rechazado.'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Pagos</h2>
        <button onClick={() => setOpen(true)} className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Registrar pago</button>
      </div>
      {error && <div className="mb-3"><Alert>{error}</Alert></div>}
      {!order.payments?.length ? <Empty>Sin pagos registrados todavía.</Empty> : (
        <ul className="space-y-2">
          {order.payments.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-sand-50 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{money(p.amount)} <span className="font-normal text-ink-900/50 capitalize">· {p.method}</span></p>
                {(p.reference || p.bank) && <p className="text-xs text-ink-900/50">{p.bank} {p.reference && `· Ref. ${p.reference}`}</p>}
              </div>
              {p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink-900/10"><ExternalLink className="h-4 w-4" /></a>}
              <PaymentBadge status={p.status} />
              {p.status === 'pendiente' && (
                <div className="flex gap-1">
                  <button onClick={() => approve(p.id)} disabled={busy === p.id} className="grid h-8 w-8 place-items-center rounded-full text-emerald-600 hover:bg-emerald-50">{busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</button>
                  <button onClick={() => reject(p.id)} disabled={busy === p.id} className="grid h-8 w-8 place-items-center rounded-full text-rose-600 hover:bg-rose-50"><X className="h-4 w-4" /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar pago">
        <AdminPaymentForm orderId={order.id} onDone={(t) => { setOpen(false); onDone(t); }} />
      </Modal>
    </section>
  );
}

function AdminPaymentForm({ orderId, onDone }: { orderId: number; onDone: (msg: string) => void }) {
  const [method, setMethod] = useState('transferencia');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [bank, setBank] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); setError('');
    try {
      await api(`/admin/orders/${orderId}/payments`, { method: 'POST', body: { method, amount: Number(amount), reference: reference || undefined, bank: bank || undefined, notes: notes || undefined } });
      onDone('Pago registrado y validado.');
    } catch (e2) { setError((e2 as Error).message); } finally { setSending(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div><label className="label">Método</label><select value={method} onChange={(e) => setMethod(e.target.value)} className="input">{PAYMENT_METHODS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
      <div><label className="label">Monto (RD$)</label><input type="number" step="0.01" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required className="input" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="label">Banco</label><input value={bank} onChange={(e) => setBank(e.target.value)} className="input" /></div>
        <div><label className="label">Referencia</label><input value={reference} onChange={(e) => setReference(e.target.value)} className="input" /></div>
      </div>
      <div><label className="label">Notas</label><input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" /></div>
      {error && <Alert>{error}</Alert>}
      <button className="btn-primary w-full" disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Registrar (queda validado)</button>
    </form>
  );
}

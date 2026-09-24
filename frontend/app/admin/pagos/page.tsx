'use client';

import { Check, ExternalLink, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AdminTitle, Modal } from '@/components/admin/ui';
import { Empty, PaymentBadge, Spinner } from '@/components/ui/bits';
import { api } from '@/lib/api';
import { date, money } from '@/lib/constants';
import type { Payment } from '@/lib/types';
import { useApi } from '@/lib/useApi';

const TABS = [
  { value: '', label: 'Todos' }, { value: 'pendiente', label: 'Pendientes' }, { value: 'validado', label: 'Validados' }, { value: 'rechazado', label: 'Rechazados' },
];

export default function PaymentsPage() {
  const [status, setStatus] = useState('pendiente');
  const { data: payments, loading, reload } = useApi<Payment[]>(`/admin/payments${status ? `?status=${status}` : ''}`);
  const [busy, setBusy] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<Payment | null>(null);
  const [notes, setNotes] = useState('');

  async function approve(p: Payment) {
    setBusy(p.id);
    try { await api(`/admin/payments/${p.id}`, { method: 'PATCH', body: { status: 'validado' } }); reload(); }
    catch (e) { alert((e as Error).message); } finally { setBusy(null); }
  }

  async function reject() {
    if (!rejecting) return;
    setBusy(rejecting.id);
    try { await api(`/admin/payments/${rejecting.id}`, { method: 'PATCH', body: { status: 'rechazado', notes } }); setRejecting(null); setNotes(''); reload(); }
    catch (e) { alert((e as Error).message); } finally { setBusy(null); }
  }

  return (
    <div>
      <AdminTitle title="Pagos" subtitle="Comprobantes de transferencia que los clientes suben desde su portal." />

      <div className="mb-5 flex flex-wrap gap-1.5 rounded-xl bg-ink-900/5 p-1" style={{ width: 'fit-content' }}>
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setStatus(t.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${status === t.value ? 'bg-paper shadow-sm' : 'text-ink-900/60 hover:text-ink-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && !payments ? <Spinner /> : !payments?.length ? <Empty>No hay pagos con este filtro.</Empty> : (
        <div className="grid gap-3">
          {payments.map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {p.order && <Link href={`/admin/ordenes/${p.order.id}`} className="font-semibold hover:text-brand-ink">{p.order.code}</Link>}
                  <PaymentBadge status={p.status} />
                  <span className="text-xs text-ink-900/45">{date(p.createdAt, true)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-900/70">
                  {money(p.amount)} · <span className="capitalize">{p.method}</span>
                  {p.bank && <> · {p.bank}</>} {p.reference && <> · Ref. {p.reference}</>}
                </p>
                {p.notes && <p className="mt-1 text-xs text-ink-900/50">{p.notes}</p>}
              </div>
              {p.receiptUrl && (
                <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm shrink-0"><ExternalLink className="h-3.5 w-3.5" /> Comprobante</a>
              )}
              {p.status === 'pendiente' && (
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => approve(p)} disabled={busy === p.id} className="btn-primary btn-sm">
                    {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Validar
                  </button>
                  <button onClick={() => setRejecting(p)} disabled={busy === p.id} className="btn-sm bg-rose-50 text-rose-700 hover:bg-rose-100"><X className="h-3.5 w-3.5" /> Rechazar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Rechazar comprobante">
        <div className="space-y-3">
          <p className="text-sm text-ink-900/60">Explica brevemente por qué se rechaza — el cliente lo verá en el timeline de su orden.</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input" placeholder="Ej. El monto no coincide con la factura" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setRejecting(null)} className="btn-ghost">Cancelar</button>
            <button onClick={reject} disabled={busy === rejecting?.id} className="btn-primary bg-rose-600 shadow-rose-600/25 hover:shadow-rose-600/30">
              {busy === rejecting?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Rechazar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { Check, Mail, MessageCircle, Phone } from 'lucide-react';
import { AdminTitle } from '@/components/admin/ui';
import { Empty, Spinner } from '@/components/ui/bits';
import { api } from '@/lib/api';
import { date, waLink } from '@/lib/constants';
import type { Lead } from '@/lib/types';
import { useApi } from '@/lib/useApi';

export default function LeadsPage() {
  const { data: leads, loading, reload } = useApi<Lead[]>('/admin/leads');

  async function toggle(lead: Lead) {
    try { await api(`/admin/leads/${lead.id}`, { method: 'PATCH', body: { handled: !lead.handled } }); reload(); } catch { /* noop */ }
  }

  const pending = (leads ?? []).filter((l) => !l.handled);
  const handled = (leads ?? []).filter((l) => l.handled);

  return (
    <div>
      <AdminTitle title="Mensajes" subtitle="Solicitudes de contacto dejadas desde la landing (formulario rápido)." />

      {loading && !leads ? <Spinner /> : !leads?.length ? <Empty>No hay mensajes todavía.</Empty> : (
        <div className="space-y-8">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-wide text-ink-900/50 uppercase">Pendientes · {pending.length}</p>
            {!pending.length ? <Empty>Nada pendiente — al día.</Empty> : (
              <div className="grid gap-3">{pending.map((l) => <LeadCard key={l.id} lead={l} onToggle={toggle} />)}</div>
            )}
          </div>
          {handled.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold tracking-wide text-ink-900/50 uppercase">Atendidos · {handled.length}</p>
              <div className="grid gap-3">{handled.map((l) => <LeadCard key={l.id} lead={l} onToggle={toggle} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead, onToggle }: { lead: Lead; onToggle: (l: Lead) => void }) {
  return (
    <div className={`card flex flex-wrap items-start gap-4 p-4 ${lead.handled ? 'opacity-60' : ''}`}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-900/5"><MessageCircle className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{lead.name}</p>
          <span className="text-xs text-ink-900/45">{date(lead.createdAt, true)}</span>
        </div>
        <p className="mt-1 text-sm text-ink-900/70">{lead.message}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-900/55">
          <a href={waLink(lead.phone, `Hola ${lead.name}, te escribo de F.I.S.C. por tu mensaje.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand-ink"><Phone className="h-3.5 w-3.5" /> {lead.phone}</a>
          {lead.email && <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 hover:text-brand-ink"><Mail className="h-3.5 w-3.5" /> {lead.email}</a>}
        </div>
      </div>
      <button onClick={() => onToggle(lead)} className={`btn-sm shrink-0 ${lead.handled ? 'btn-ghost' : 'btn-primary'}`}>
        <Check className="h-3.5 w-3.5" /> {lead.handled ? 'Reabrir' : 'Marcar atendido'}
      </button>
    </div>
  );
}

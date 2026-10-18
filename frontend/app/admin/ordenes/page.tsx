'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Pager } from '@/components/admin/Pager';
import { AdminTitle } from '@/components/admin/ui';
import { Empty, PaymentBadge, Spinner, StatusBadge } from '@/components/ui/bits';
import { SOURCES, STATUS, STATUS_FLOW, date } from '@/lib/constants';
import type { OrderStatus, Paged, User } from '@/lib/types';
import { useApi } from '@/lib/useApi';

type OrderRow = {
  id: number; code: string; contactName: string; contactPhone: string; status: OrderStatus; paymentStatus: string;
  source: string; createdAt: string; technician: User | null; items: { serviceName: string }[];
};

export default function OrdersListPage() {
  const [status, setStatus] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => setQ(qInput.trim()), 300); return () => clearTimeout(t); }, [qInput]);

  const { data: technicians } = useApi<User[]>('/admin/users?role=technician');

  // Al cambiar un filtro se vuelve a la primera página
  useEffect(() => { setPage(1); }, [status, technicianId, q]);

  const params = new URLSearchParams();
  params.set('page', String(page));
  if (status) params.set('status', status);
  if (technicianId) params.set('technicianId', technicianId);
  if (q) params.set('q', q);
  const query = params.toString();
  const { data, loading } = useApi<Paged<OrderRow>>(`/staff/orders?${query}`);
  const orders = data?.items;

  return (
    <div>
      <AdminTitle title="Órdenes" subtitle="Bandeja de solicitudes de servicio." />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button onClick={() => setStatus('')} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${!status ? 'bg-ink-900 text-white' : 'bg-ink-900/5 text-ink-900/60 hover:bg-ink-900/10'}`}>Todas</button>
        {STATUS_FLOW.concat('cancelada').map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${status === s ? 'bg-ink-900 text-white' : 'bg-ink-900/5 text-ink-900/60 hover:bg-ink-900/10'}`}>{STATUS[s].label}</button>
        ))}
        <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} className="input w-auto">
          <option value="">Todos los técnicos</option>
          {technicians?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-900/35" />
          <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Buscar por código, nombre, correo o dirección…" className="input pl-9" />
        </div>
      </div>

      {loading && !orders ? <Spinner /> : !orders?.length ? <Empty>No hay órdenes con estos filtros.</Empty> : (
        <div className="grid gap-2">
          {orders.map((o) => (
            <Link key={o.id} href={`/admin/ordenes/${o.id}`} className="card flex flex-wrap items-center gap-3 p-4 hover:border-brand/30">
              <span className="font-semibold">{o.code}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink-900/60">{o.items.map((i) => i.serviceName).join(', ')}</span>
              <span className="text-sm text-ink-900/70">{o.contactName}</span>
              <StatusBadge status={o.status} />
              <PaymentBadge status={o.paymentStatus} />
              {o.technician && <span className="badge bg-ink-900/5 text-ink-900/60">{o.technician.name}</span>}
              <span className="text-xs text-ink-900/45">{SOURCES[o.source] ?? o.source}</span>
              <span className="ml-auto shrink-0 text-xs text-ink-900/45">{date(o.createdAt, true)}</span>
            </Link>
          ))}
        </div>
      )}
      {data && <Pager data={data} onPage={setPage} />}
    </div>
  );
}

'use client';

import { ClipboardList, CreditCard, Mail, Star } from 'lucide-react';
import Link from 'next/link';
import { AdminTitle } from '@/components/admin/ui';
import { Spinner, StatusBadge } from '@/components/ui/bits';
import { SOURCES, STATUS, date } from '@/lib/constants';
import type { DashboardData, OrderStatus } from '@/lib/types';
import { useApi } from '@/lib/useApi';

function Kpi({ icon: Icon, label, value, href }: { icon: typeof ClipboardList; label: string; value: string | number; href?: string }) {
  const content = (
    <div className="card flex items-center gap-4 p-5">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand-ink"><Icon className="h-5 w-5" /></div>
      <div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-ink-900/55">{label}</p></div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardPage() {
  const { data, loading } = useApi<DashboardData>('/admin/dashboard');
  if (loading && !data) return <Spinner />;
  if (!data) return null;

  const statuses = Object.keys(data.byStatus) as OrderStatus[];
  const maxStatus = Math.max(1, ...Object.values(data.byStatus));
  const sources = Object.entries(data.bySource).filter(([, n]) => n > 0);
  const maxSource = Math.max(1, ...sources.map(([, n]) => n));

  return (
    <div>
      <AdminTitle title="Dashboard" subtitle="Un vistazo rápido a la operación de la semana." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={ClipboardList} label="Órdenes nuevas (7 días)" value={data.newThisWeek} href="/admin/ordenes" />
        <Kpi icon={CreditCard} label="Pagos por validar" value={data.pendingPayments} href="/admin/pagos" />
        <Kpi icon={Star} label={`Calificación media (${data.reviewCount})`} value={data.avgRating ? `★ ${data.avgRating}` : '—'} href="/admin/evaluaciones" />
        <Kpi icon={Mail} label="Mensajes sin atender" value={data.openLeads} href="/admin/mensajes" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 font-bold">Órdenes por estado</h2>
          <div className="space-y-3">
            {statuses.map((s) => (
              <div key={s}>
                <div className="mb-1 flex justify-between text-sm"><span>{STATUS[s]?.label ?? s}</span><span className="font-semibold">{data.byStatus[s]}</span></div>
                <div className="h-2 rounded-full bg-ink-900/5"><div className="h-2 rounded-full bg-brand" style={{ width: `${(data.byStatus[s] / maxStatus) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="mb-4 font-bold">Origen de las órdenes</h2>
          {!sources.length ? <p className="text-sm text-ink-900/50">Todavía no hay órdenes.</p> : (
            <div className="space-y-3">
              {sources.map(([src, n]) => (
                <div key={src}>
                  <div className="mb-1 flex justify-between text-sm"><span>{SOURCES[src] ?? src}</span><span className="font-semibold">{n}</span></div>
                  <div className="h-2 rounded-full bg-ink-900/5"><div className="h-2 rounded-full bg-accent" style={{ width: `${(n / maxSource) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Órdenes recientes</h2>
          <Link href="/admin/ordenes" className="text-sm font-semibold text-brand-ink hover:underline">Ver todas →</Link>
        </div>
        {!data.recent.length ? <p className="text-sm text-ink-900/50">Todavía no hay órdenes.</p> : (
          <div className="grid gap-2">
            {data.recent.map((o) => (
              <Link key={o.id} href={`/admin/ordenes/${o.id}`} className="card flex flex-wrap items-center gap-3 p-4 hover:border-brand/30">
                <span className="font-semibold">{o.code}</span>
                <span className="text-sm text-ink-900/60">{o.items.map((i) => i.serviceName).join(', ')}</span>
                <StatusBadge status={o.status} />
                {o.technician && <span className="text-xs text-ink-900/45">{o.technician.name}</span>}
                <span className="ml-auto text-xs text-ink-900/45">{date(o.createdAt, true)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

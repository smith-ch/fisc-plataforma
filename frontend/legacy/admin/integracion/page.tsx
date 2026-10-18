'use client';

import { AlertTriangle, CheckCircle2, ChevronDown, FlaskConical, RefreshCw, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminTitle } from '@/components/admin/ui';
import { useAuth } from '@/components/providers';
import { Alert, Empty, Spinner } from '@/components/ui/bits';
import { date } from '@/lib/constants';
import type { IntegrationLog } from '@/lib/types';
import { useApi } from '@/lib/useApi';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: 'Todo' }, { value: 'ok', label: 'OK' }, { value: 'simulado', label: 'Simulado' }, { value: 'error', label: 'Error' },
];

function StatusIcon({ status }: { status: string }) {
  if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === 'error') return <XCircle className="h-4 w-4 text-rose-500" />;
  return <FlaskConical className="h-4 w-4 text-amber-500" />;
}

function Json({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-ink-900/40">—</span>;
  return <pre className="max-h-64 overflow-auto rounded-xl bg-ink-950/[.04] p-3 text-[11px] leading-relaxed whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>;
}

export default function IntegrationLogsPage() {
  const { user: me } = useAuth();
  const router = useRouter();
  const isAdmin = me?.role === 'admin';
  useEffect(() => { if (me && !isAdmin) router.replace('/admin'); }, [me, isAdmin, router]);

  const [status, setStatus] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const { data, error, loading, reload } = useApi<{ enabled: boolean; logs: IntegrationLog[] }>(isAdmin ? '/admin/integration-logs' : null);

  if (!isAdmin) return <Spinner />;

  const logs = (data?.logs ?? []).filter((l) => !status || l.status === status);

  return (
    <div>
      <AdminTitle title="Integración Concrebill" subtitle="Bitácora de cada llamada: sincronización de clientes, cotizaciones/facturas y pagos.">
        <button onClick={() => reload()} className="btn-ghost btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Actualizar</button>
      </AdminTitle>

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      {data && (
        <div className="mb-5">
          {data.enabled ? (
            <Alert tone="success"><CheckCircle2 className="mr-1 inline h-4 w-4" /> Conexión real activa (<code>CONCREBILL_ENABLED=true</code>): estas llamadas llegan de verdad a Concrebill.</Alert>
          ) : (
            <Alert tone="info"><AlertTriangle className="mr-1 inline h-4 w-4" /> Modo simulado (<code>CONCREBILL_ENABLED=false</code>): nada llega a Concrebill todavía, solo se registra aquí como prueba.</Alert>
          )}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-1.5 rounded-xl bg-ink-900/5 p-1" style={{ width: 'fit-content' }}>
        {STATUS_TABS.map((t) => (
          <button key={t.value} onClick={() => setStatus(t.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${status === t.value ? 'bg-paper shadow-sm' : 'text-ink-900/60 hover:text-ink-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && !data ? <Spinner /> : !logs.length ? <Empty>No hay llamadas registradas todavía con este filtro.</Empty> : (
        <div className="grid gap-2">
          {logs.map((l) => {
            const isOpen = open === l.id;
            return (
              <div key={l.id} className="card p-4">
                <button onClick={() => setOpen(isOpen ? null : l.id)} className="flex w-full flex-wrap items-center gap-3 text-left">
                  <StatusIcon status={l.status} />
                  <span className="font-semibold">{l.action}</span>
                  <span className="badge bg-ink-900/5 text-ink-900/60 uppercase">{l.status}</span>
                  <span className="text-xs text-ink-900/45">{date(l.createdAt, true)}</span>
                  <ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div><p className="label">Petición</p><Json value={l.request} /></div>
                    <div><p className="label">Respuesta</p><Json value={l.response} /></div>
                    {l.error && <div className="sm:col-span-2"><p className="label text-rose-600">Error</p><p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{l.error}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { Eye, EyeOff, Loader2, Pencil, Plus, RefreshCw, Save, Search, ShieldCheck, User as UserIcon, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminTitle, Modal, Toggle } from '@/components/admin/ui';
import { useAuth } from '@/components/providers';
import { Alert, Empty, Spinner } from '@/components/ui/bits';
import { api } from '@/lib/api';
import type { Role, User } from '@/lib/types';
import { useApi } from '@/lib/useApi';

const ROLE_LABEL: Record<Role, string> = { admin: 'Administrador', technician: 'Técnico', client: 'Cliente' };
const ROLE_ICON: Record<Role, typeof UserIcon> = { admin: ShieldCheck, technician: Wrench, client: UserIcon };
const ROLE_TABS: { value: Role | ''; label: string }[] = [
  { value: '', label: 'Todos' }, { value: 'admin', label: 'Administradores' }, { value: 'technician', label: 'Técnicos' }, { value: 'client', label: 'Clientes' },
];

type Form = {
  id?: number; name: string; email: string; password: string; role: Role; phone: string; documentId: string; address: string;
  specialty: string; active: boolean; concrebillSync: boolean;
};

const EMPTY_FORM: Form = {
  name: '', email: '', password: '', role: 'client', phone: '', documentId: '', address: '', specialty: '', active: true, concrebillSync: false,
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const router = useRouter();
  const isAdmin = me?.role === 'admin';

  const [role, setRole] = useState<Role | ''>('');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { const t = setTimeout(() => setQ(qInput.trim()), 300); return () => clearTimeout(t); }, [qInput]);
  useEffect(() => { if (me && !isAdmin) router.replace('/admin'); }, [me, isAdmin, router]);

  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (q) params.set('q', q);
  const query = params.toString();
  const { data: users, error: listError, loading, reload } = useApi<User[]>(isAdmin ? `/admin/users${query ? `?${query}` : ''}` : null);

  const [editing, setEditing] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<number | null>(null);

  function openCreate() { setError(''); setEditing({ ...EMPTY_FORM }); }
  function openEdit(u: User) {
    setError('');
    setEditing({
      id: u.id, name: u.name, email: u.email, password: '', role: u.role, phone: u.phone ?? '', documentId: u.documentId ?? '',
      address: u.address ?? '', specialty: u.specialty ?? '', active: u.active, concrebillSync: u.concrebillSync,
    });
  }
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEditing((f) => (f ? { ...f, [k]: v } : f));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setError('');
    const { id, password, ...rest } = editing;
    const body: Record<string, unknown> = { ...rest };
    if (password) body.password = password;
    if (rest.role !== 'technician') body.specialty = '';
    if (rest.role !== 'client') body.concrebillSync = false;
    try {
      await api(id ? `/admin/users/${id}` : '/admin/users', { method: id ? 'PATCH' : 'POST', body });
      setEditing(null); reload();
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  async function toggleField(u: User, patch: Partial<Pick<User, 'active' | 'concrebillSync'>>) {
    setToggling(u.id);
    try { await api(`/admin/users/${u.id}`, { method: 'PATCH', body: patch }); reload(); }
    catch (err) { alert((err as Error).message); }
    finally { setToggling(null); }
  }

  if (!isAdmin) return <Spinner />;

  return (
    <div>
      <AdminTitle title="Usuarios y técnicos" subtitle="Administradores, técnicos y clientes de la plataforma.">
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Agregar</button>
      </AdminTitle>

      {listError && <div className="mb-4"><Alert>{listError}</Alert></div>}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-ink-900/5 p-1">
          {ROLE_TABS.map((t) => (
            <button key={t.value} onClick={() => setRole(t.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${role === t.value ? 'bg-paper shadow-sm' : 'text-ink-900/60 hover:text-ink-900'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-900/35" />
          <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Buscar por nombre, correo o teléfono…" className="input pl-9" />
        </div>
      </div>

      {loading && !users ? <Spinner /> : !users?.length ? <Empty>No hay usuarios con estos filtros.</Empty> : (
        <div className="grid gap-3">
          {users.map((u) => {
            const RoleIcon = ROLE_ICON[u.role];
            return (
              <div key={u.id} className={`card flex flex-wrap items-center gap-4 p-4 ${!u.active ? 'opacity-55' : ''}`}>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink-900/5 text-sm font-bold uppercase">
                  {u.name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{u.name}</p>
                    <span className="badge bg-ink-900/5 text-ink-900/70"><RoleIcon className="h-3 w-3" /> {ROLE_LABEL[u.role]}</span>
                    {u.role === 'technician' && u.specialty && <span className="badge bg-sky-50 text-sky-800">{u.specialty}</span>}
                  </div>
                  <p className="truncate text-sm text-ink-900/60">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                </div>

                {u.role === 'client' && (
                  <button onClick={() => toggleField(u, { concrebillSync: !u.concrebillSync })} disabled={toggling === u.id}
                    title={u.concrebillSync ? 'Sincroniza con Concrebill — clic para desactivar' : 'No sincroniza con Concrebill — clic para activar'}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      u.concrebillSync ? 'bg-brand text-white' : 'bg-ink-900/5 text-ink-900/50 hover:bg-ink-900/10'}`}>
                    {toggling === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Concrebill
                  </button>
                )}

                <div className="flex shrink-0 gap-1">
                  <button onClick={() => toggleField(u, { active: !u.active })} title={u.active ? 'Desactivar cuenta' : 'Activar cuenta'}
                    className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink-900/5">
                    {u.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(u)} title="Editar" className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink-900/5">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar usuario' : 'Agregar usuario'} wide>
        {editing && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nombre</label>
              <input value={editing.name} required onChange={(e) => set('name', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Correo</label>
              <input type="email" value={editing.email} required onChange={(e) => set('email', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{editing.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
              <input type="password" value={editing.password} required={!editing.id} minLength={6}
                onChange={(e) => set('password', e.target.value)} className="input" placeholder={editing.id ? 'Dejar en blanco para no cambiarla' : ''} />
            </div>
            <div>
              <label className="label">Rol</label>
              <select value={editing.role} onChange={(e) => set('role', e.target.value as Role)} className="input">
                <option value="client">Cliente</option>
                <option value="technician">Técnico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input value={editing.phone} onChange={(e) => set('phone', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">RNC / Cédula</label>
              <input value={editing.documentId} onChange={(e) => set('documentId', e.target.value)} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Dirección</label>
              <input value={editing.address} onChange={(e) => set('address', e.target.value)} className="input" />
            </div>
            {editing.role === 'technician' && (
              <div className="sm:col-span-2">
                <label className="label">Especialidad</label>
                <input value={editing.specialty} onChange={(e) => set('specialty', e.target.value)} placeholder="Pintura, plomería, POS…" className="input" />
              </div>
            )}

            <div className="pt-1"><Toggle checked={editing.active} onChange={(v) => set('active', v)} label="Cuenta activa" /></div>
            {editing.role === 'client' && (
              <div className="pt-1">
                <Toggle checked={editing.concrebillSync} onChange={(v) => set('concrebillSync', v)} label="Sincronizar con Concrebill" />
                <p className="mt-1 text-xs text-ink-900/50">Mientras se prueba la integración, solo los clientes marcados aquí se sincronizan; los demás se manejan a mano desde el panel.</p>
              </div>
            )}

            {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancelar</button>
              <button className="btn-primary" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

'use client';

import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminTitle, ImageField, Toast } from '@/components/admin/ui';
import { Spinner } from '@/components/ui/bits';
import { api } from '@/lib/api';
import type { Settings } from '@/lib/types';
import { useApi } from '@/lib/useApi';

const TABS: { key: keyof Settings; label: string }[] = [
  { key: 'brand', label: 'Marca' },
  { key: 'hero', label: 'Portada' },
  { key: 'about', label: 'Por qué elegirnos' },
  { key: 'process', label: 'Cómo trabajamos' },
  { key: 'contact', label: 'Contacto' },
  { key: 'payments', label: 'Pagos' },
  { key: 'seo', label: 'SEO' },
];

export default function ContentPage() {
  const { data: settings, loading } = useApi<Settings>('/admin/settings');
  const [tab, setTab] = useState<keyof Settings>('brand');
  const [values, setValues] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => { if (settings) setValues(settings); }, [settings]);

  async function save() {
    if (!values) return;
    setSaving(true);
    try { await api(`/admin/settings/${tab}`, { method: 'PUT', body: values[tab] }); setMsg({ tone: 'success', text: 'Guardado. Los cambios ya se ven en la web.' }); }
    catch (e) { setMsg({ tone: 'error', text: (e as Error).message }); } finally { setSaving(false); }
  }

  if (loading && !values) return <Spinner />;
  if (!values) return null;
  const set = <K extends keyof Settings>(key: K, patch: Partial<Settings[K]>) => setValues((v) => v && { ...v, [key]: { ...v[key], ...patch } });

  return (
    <div>
      <AdminTitle title="Textos y marca" subtitle="El contenido editable de la landing.">
        <button onClick={save} className="btn-primary" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar sección</button>
      </AdminTitle>

      <div className="mb-6 flex flex-wrap gap-1.5 rounded-xl bg-ink-900/5 p-1" style={{ width: 'fit-content' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === t.key ? 'bg-paper shadow-sm' : 'text-ink-900/60 hover:text-ink-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card max-w-3xl p-6">
        {tab === 'brand' && <BrandForm v={values.brand} set={(p) => set('brand', p)} />}
        {tab === 'hero' && <HeroForm v={values.hero} set={(p) => set('hero', p)} />}
        {tab === 'about' && <AboutForm v={values.about} set={(p) => set('about', p)} />}
        {tab === 'process' && <ProcessForm v={values.process} set={(p) => set('process', p)} />}
        {tab === 'contact' && <ContactForm v={values.contact} set={(p) => set('contact', p)} />}
        {tab === 'payments' && <PaymentsForm v={values.payments} set={(p) => set('payments', p)} />}
        {tab === 'seo' && <SeoForm v={values.seo} set={(p) => set('seo', p)} />}
      </div>
      <Toast msg={msg} onClose={() => setMsg(null)} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

function ListEditor({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className="input" />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, ''])} className="btn-ghost btn-sm"><Plus className="h-3 w-3" /> Agregar</button>
      </div>
    </div>
  );
}

function BrandForm({ v, set }: { v: Settings['brand']; set: (p: Partial<Settings['brand']>) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre"><input value={v.name} onChange={(e) => set({ name: e.target.value })} className="input" /></Field>
      <Field label="Eslogan"><input value={v.tagline} onChange={(e) => set({ tagline: e.target.value })} className="input" /></Field>
      <div className="sm:col-span-2"><ImageField label="Logo (fondos claros)" value={v.logoUrl} onChange={(url) => set({ logoUrl: url })} /></div>
      <div className="sm:col-span-2"><ImageField label="Logo (fondos oscuros)" value={v.logoLightUrl} onChange={(url) => set({ logoLightUrl: url })} dark /></div>
      <Field label="Color primario"><input type="color" value={v.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} className="h-10 w-full cursor-pointer rounded-lg border border-ink-900/15" /></Field>
      <Field label="Color de acento"><input type="color" value={v.accentColor} onChange={(e) => set({ accentColor: e.target.value })} className="h-10 w-full cursor-pointer rounded-lg border border-ink-900/15" /></Field>
    </div>
  );
}

function HeroForm({ v, set }: { v: Settings['hero']; set: (p: Partial<Settings['hero']>) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Eyebrow"><input value={v.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} className="input" /></Field>
      <div />
      <div className="sm:col-span-2"><Field label="Título"><textarea rows={2} value={v.title} onChange={(e) => set({ title: e.target.value })} className="input" /></Field></div>
      <div className="sm:col-span-2"><Field label="Subtítulo"><textarea rows={3} value={v.subtitle} onChange={(e) => set({ subtitle: e.target.value })} className="input" /></Field></div>
      <Field label="Botón principal"><input value={v.ctaPrimary} onChange={(e) => set({ ctaPrimary: e.target.value })} className="input" /></Field>
      <Field label="Botón secundario"><input value={v.ctaSecondary} onChange={(e) => set({ ctaSecondary: e.target.value })} className="input" /></Field>
      <div className="sm:col-span-2"><ListEditor label="Puntos destacados" items={v.highlights} onChange={(highlights) => set({ highlights })} /></div>
    </div>
  );
}

function AboutForm({ v, set }: { v: Settings['about']; set: (p: Partial<Settings['about']>) => void }) {
  return (
    <div className="grid gap-4">
      <Field label="Título"><input value={v.title} onChange={(e) => set({ title: e.target.value })} className="input" /></Field>
      <Field label="Texto"><textarea rows={3} value={v.text} onChange={(e) => set({ text: e.target.value })} className="input" /></Field>
      <div>
        <label className="label">Estadísticas</label>
        <div className="space-y-2">
          {v.stats.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input value={s.value} onChange={(e) => set({ stats: v.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} placeholder="3" className="input w-24" />
              <input value={s.label} onChange={(e) => set({ stats: v.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="Pilares de servicio" className="input" />
              <button type="button" onClick={() => set({ stats: v.stats.filter((_, j) => j !== i) })} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => set({ stats: [...v.stats, { value: '', label: '' }] })} className="btn-ghost btn-sm"><Plus className="h-3 w-3" /> Agregar estadística</button>
        </div>
      </div>
    </div>
  );
}

function ProcessForm({ v, set }: { v: Settings['process']; set: (p: Partial<Settings['process']>) => void }) {
  return (
    <div className="grid gap-4">
      <Field label="Título de sección"><input value={v.title} onChange={(e) => set({ title: e.target.value })} className="input" /></Field>
      <Field label="Subtítulo"><input value={v.subtitle} onChange={(e) => set({ subtitle: e.target.value })} className="input" /></Field>
      <div className="space-y-4">
        {v.phases.map((phase, i) => (
          <div key={i} className="rounded-2xl border border-ink-900/10 p-4">
            <div className="flex items-center gap-2">
              <input value={phase.title} onChange={(e) => set({ phases: v.phases.map((p, j) => (j === i ? { ...p, title: e.target.value } : p)) })} className="input" placeholder="Título de la fase" />
              <button type="button" onClick={() => set({ phases: v.phases.filter((_, j) => j !== i) })} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 space-y-2 pl-2">
              {phase.steps.map((step, k) => (
                <div key={k} className="flex gap-2">
                  <input value={step} onChange={(e) => set({ phases: v.phases.map((p, j) => (j === i ? { ...p, steps: p.steps.map((s, l) => (l === k ? e.target.value : s)) } : p)) })} className="input" />
                  <button type="button" onClick={() => set({ phases: v.phases.map((p, j) => (j === i ? { ...p, steps: p.steps.filter((_, l) => l !== k) } : p)) })} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => set({ phases: v.phases.map((p, j) => (j === i ? { ...p, steps: [...p.steps, ''] } : p)) })} className="btn-ghost btn-sm"><Plus className="h-3 w-3" /> Agregar paso</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set({ phases: [...v.phases, { title: '', steps: [] }] })} className="btn-ghost btn-sm"><Plus className="h-3 w-3" /> Agregar fase</button>
      </div>
    </div>
  );
}

function ContactForm({ v, set }: { v: Settings['contact']; set: (p: Partial<Settings['contact']>) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="WhatsApp (solo dígitos, con código de país)"><input value={v.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} className="input" /></Field>
      <Field label="Mensaje predefinido de WhatsApp"><input value={v.whatsappMessage} onChange={(e) => set({ whatsappMessage: e.target.value })} className="input" /></Field>
      <Field label="Teléfono"><input value={v.phone} onChange={(e) => set({ phone: e.target.value })} className="input" /></Field>
      <Field label="Correo"><input value={v.email} onChange={(e) => set({ email: e.target.value })} className="input" /></Field>
      <Field label="Dirección"><input value={v.address} onChange={(e) => set({ address: e.target.value })} className="input" /></Field>
      <Field label="Horario"><input value={v.hours} onChange={(e) => set({ hours: e.target.value })} className="input" /></Field>
      <Field label="Instagram (URL)"><input value={v.instagram} onChange={(e) => set({ instagram: e.target.value })} className="input" /></Field>
      <Field label="Facebook (URL)"><input value={v.facebook} onChange={(e) => set({ facebook: e.target.value })} className="input" /></Field>
    </div>
  );
}

function PaymentsForm({ v, set }: { v: Settings['payments']; set: (p: Partial<Settings['payments']>) => void }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Moneda"><input value={v.currency} onChange={(e) => set({ currency: e.target.value })} className="input" /></Field>
        <label className="mt-6 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={v.paypalEnabled} onChange={(e) => set({ paypalEnabled: e.target.checked })} className="accent-[var(--brand)]" /> PayPal habilitado</label>
      </div>
      <Field label="Instrucciones de transferencia"><textarea rows={2} value={v.transferInstructions} onChange={(e) => set({ transferInstructions: e.target.value })} className="input" /></Field>
      <div>
        <label className="label">Cuentas bancarias</label>
        <div className="space-y-3">
          {v.bankAccounts.map((b, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-2xl border border-ink-900/10 p-3 sm:grid-cols-5">
              <input value={b.bank} onChange={(e) => set({ bankAccounts: v.bankAccounts.map((x, j) => (j === i ? { ...x, bank: e.target.value } : x)) })} placeholder="Banco" className="input" />
              <input value={b.type} onChange={(e) => set({ bankAccounts: v.bankAccounts.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)) })} placeholder="Tipo" className="input" />
              <input value={b.number} onChange={(e) => set({ bankAccounts: v.bankAccounts.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)) })} placeholder="No. cuenta" className="input" />
              <input value={b.holder} onChange={(e) => set({ bankAccounts: v.bankAccounts.map((x, j) => (j === i ? { ...x, holder: e.target.value } : x)) })} placeholder="Titular" className="input" />
              <div className="flex gap-1">
                <input value={b.rnc} onChange={(e) => set({ bankAccounts: v.bankAccounts.map((x, j) => (j === i ? { ...x, rnc: e.target.value } : x)) })} placeholder="RNC" className="input" />
                <button type="button" onClick={() => set({ bankAccounts: v.bankAccounts.filter((_, j) => j !== i) })} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => set({ bankAccounts: [...v.bankAccounts, { bank: '', type: '', number: '', holder: '', rnc: '' }] })} className="btn-ghost btn-sm"><Plus className="h-3 w-3" /> Agregar cuenta</button>
        </div>
      </div>
    </div>
  );
}

function SeoForm({ v, set }: { v: Settings['seo']; set: (p: Partial<Settings['seo']>) => void }) {
  return (
    <div className="grid gap-4">
      <Field label="Título (pestaña del navegador)"><input value={v.title} onChange={(e) => set({ title: e.target.value })} className="input" /></Field>
      <Field label="Descripción (buscadores)"><textarea rows={3} value={v.description} onChange={(e) => set({ description: e.target.value })} className="input" /></Field>
    </div>
  );
}

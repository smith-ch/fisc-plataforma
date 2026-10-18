import { PageHero } from '@/components/ui/PageHero';
import { getCatalog, getContent } from '@/lib/server';
import { SolicitudForm } from './SolicitudForm';

export const metadata = { title: 'Solicitar servicio' };

export default async function RequestPage() {
  const [catalog, { settings }] = await Promise.all([getCatalog(), getContent()]);
  return (
    <>
      <PageHero eyebrow="Solicitud por WhatsApp" title="Solicita tu servicio"
        subtitle="Elige lo que necesitas, cuéntanos sobre tu espacio y te escribimos por WhatsApp para coordinar el levantamiento." />
      <SolicitudForm catalog={catalog} phone={settings.contact.whatsapp} />
    </>
  );
}

import { About } from '@/components/landing/About';
import { Hero } from '@/components/landing/Hero';
import { Marquee } from '@/components/landing/Marquee';
import { Pillars } from '@/components/landing/Pillars';
import dynamic from 'next/dynamic';
import { getCatalog, getContent } from '@/lib/server';


// Secciones bajo el pliegue: su JavaScript se descarga aparte (el HTML sigue llegando renderizado).
const Process = dynamic(() => import('@/components/landing/Process').then((m) => m.Process));
const Projects = dynamic(() => import('@/components/landing/Projects').then((m) => m.Projects));
const Testimonials = dynamic(() => import('@/components/landing/Testimonials').then((m) => m.Testimonials));
const FaqSection = dynamic(() => import('@/components/landing/FaqSection').then((m) => m.FaqSection));
const Contact = dynamic(() => import('@/components/landing/Contact').then((m) => m.Contact));

export default async function Home() {
  const [{ settings, testimonials, faqs, projects }, pillars] = await Promise.all([getContent(), getCatalog()]);
  const serviceNames = pillars.flatMap((p) => (p.services ?? []).map((s) => s.name));

  return (
    <>
      <Hero hero={settings.hero} brand={settings.brand} />
      {serviceNames.length > 0 && <Marquee items={serviceNames} />}
      <Pillars pillars={pillars} />
      {settings.process.phases.length > 0 && <Process process={settings.process} />}
      {settings.about.stats.length > 0 && <About about={settings.about} />}
      <Projects projects={projects} />
      <Testimonials items={testimonials} />
      <FaqSection faqs={faqs} />
      <Contact contact={settings.contact} brand={settings.brand} />
    </>
  );
}

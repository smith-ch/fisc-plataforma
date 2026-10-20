'use client';

import { usePathname } from 'next/navigation';
import { whatsappLink } from '@/lib/contact';
import { WhatsAppIcon } from '@/components/Icon';

export function WhatsAppFloat({ phone, message }: { phone: string; message: string }) {
  const pathname = usePathname();
  if (!phone || pathname.startsWith('/admin')) return null;
  return (
    <a href={whatsappLink(phone, message)} target="_blank" rel="noopener noreferrer" aria-label="Escríbenos por WhatsApp"
      className="group fixed right-5 bottom-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-xl shadow-[#25D366]/30 transition hover:scale-105">
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40 [animation-duration:2.5s] max-md:[animation-iteration-count:3]" />
      <WhatsAppIcon className="relative h-6 w-6" />
      <span className="relative hidden max-w-0 overflow-hidden text-sm font-semibold whitespace-nowrap transition-all duration-500 group-hover:max-w-40 sm:inline">
        ¿Hablamos?
      </span>
    </a>
  );
}

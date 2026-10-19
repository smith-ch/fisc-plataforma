'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useCart } from '@/components/providers';

// El carrito es un panel que solo se abre al tocar el ícono: su código se descarga la primera vez que se abre, no con la página.
// No ocupa lugar en la página mientras está cerrado, así que no provoca saltos de diseño. Una vez descargado se queda montado
// (así el cierre también anima).
const CartDrawer = dynamic(() => import('./CartDrawer').then((mod) => mod.CartDrawer), { ssr: false });

export function CartDrawerLazy({ phone }: { phone: string }) {
  const cart = useCart();
  const [wanted, setWanted] = useState(false);
  if (cart.open && !wanted) setWanted(true);
  return wanted ? <CartDrawer phone={phone} /> : null;
}

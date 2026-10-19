'use client';

import dynamic from 'next/dynamic';

// El carrito es un panel que solo se abre al tocar el ícono: su código (y el de la animación del panel) se descarga después de la carga
// inicial. No ocupa lugar en la página mientras está cerrado, así que no provoca saltos de diseño.
const CartDrawer = dynamic(() => import('./CartDrawer').then((mod) => mod.CartDrawer), { ssr: false });

export function CartDrawerLazy({ phone }: { phone: string }) {
  return <CartDrawer phone={phone} />;
}

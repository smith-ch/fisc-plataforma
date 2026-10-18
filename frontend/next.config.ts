import type { NextConfig } from 'next';

// Sitio estático: todo el contenido sale de `data/` y se genera en el build. No hay API, proxy ni caché en el servidor.
const nextConfig: NextConfig = {
  images: { formats: ['image/avif', 'image/webp'] },
  poweredByHeader: false,
};

export default nextConfig;

import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

// Sitio estático: todo el contenido sale de `data/` y se genera en el build. No hay API, proxy ni caché en el servidor.
const nextConfig: NextConfig = {
  images: { formats: ['image/avif', 'image/webp'] },
  poweredByHeader: false,
};

// Análisis del bundle, solo en local: `npm run analyze` (ANALYZE=true). Sin esa variable el plugin no se activa y el build es el de siempre.
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true', openAnalyzer: false });

export default withBundleAnalyzer(nextConfig);

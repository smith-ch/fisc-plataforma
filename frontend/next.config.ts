import type { NextConfig } from 'next';

const API_DEFAULT = 'http://localhost:4000';
const API_ENV = process.env.API_URL?.trim();
const API =
  API_ENV && API_ENV !== '[SENSITIVE]' && /^https?:\/\//.test(API_ENV)
    ? API_ENV.replace(/\/$/, '')
    : API_DEFAULT;

const nextConfig: NextConfig = {
  images: { formats: ['image/avif', 'image/webp'] },
  // El frontend actúa como proxy del API y de los archivos subidos: evita CORS
  // y permite desplegar ambos detrás de un mismo dominio.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API}/uploads/:path*` },
    ];
  },
};

export default nextConfig;

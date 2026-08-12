import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AIVUR — Inteligência que evolui resultados',
    short_name: 'AIVUR',
    description: 'Sistema inteligente de evolução do conhecimento.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0F2C',
    theme_color: '#0A0F2C',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

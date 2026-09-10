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
        src: '/assets/logo-aivur.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
      {
        src: '/assets/logo-aivur.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
  };
}

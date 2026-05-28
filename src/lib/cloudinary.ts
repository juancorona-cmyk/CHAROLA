const CLOUD =
  (import.meta.env.PUBLIC_CHAROLA_CLOUD_NAME as string) ||
  (import.meta.env.PUBLIC_CHAROLA_CLOUD_NAM as string) ||
  (import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME as string) ||
  'ddtjwooiz';

type Type = 'image' | 'video';

export function cld(
  publicId: string,
  opts: { type?: Type; transforms?: string } = {}
): string {
  const { type = 'image', transforms = 'f_auto,q_auto' } = opts;
  const finalTransforms = type === 'video' && !transforms.includes('vc_')
    ? `${transforms},vc_auto`
    : transforms;
  return `https://res.cloudinary.com/${CLOUD}/${type}/upload/${finalTransforms}/${publicId}`;
}

// ── Assets — rutas locales (archivos en public/assets/img/) ────────────────

export const ASSETS = {
  // Brand
  logo: '/assets/img/logo.png',

  // Hero — TODO: coloca plan.jpg en public/assets/img/hero/
  heroPlan: cld('naturizable/hero/plan'),

  // Products
  charola855:   '/assets/img/products/charola-855.jpg',
  producto01:   '/assets/img/products/producto01.jpg',
  vaso:         '/assets/img/products/vaso.png',
  contenedor:   '/assets/img/products/contenedor.png',
  charola:      '/assets/img/products/charola-hero.png',

  // Partners — SVGs locales
  // TODO: coloca bbva en public/assets/img/partners/
  lonely:  '/assets/img/partners/lonely.svg',
  tomFord: '/assets/img/partners/tom.svg',
  nu:      '/assets/img/partners/naciones.svg',
  bbva:    cld('naturizable/partners/bbva'),

  // Empaque — TODO: coloca captura.jpg en public/assets/img/empaque/
  captura: cld('naturizable/empaque/captura'),
  video:   '/assets/img/empaque/video.mp4',

  // Parallax
  plxFondo:     '/assets/img/parallax/fondo.png',
  plxTierra:    '/assets/img/parallax/base-tierra.png',
  plxBaseTierra:'/assets/img/parallax/base-tierra.png',
  plxCharola:   '/assets/img/parallax/charola.png',
  plxPlanta:    '/assets/img/parallax/planta.png',
  sello1:       '/assets/img/parallax/sello-1.png',
  sello2:       '/assets/img/parallax/sello-2.png',
  sello3:       '/assets/img/parallax/sello-3.png',
  suiza:        '/assets/img/parallax/suiza-white.png',
} as const;

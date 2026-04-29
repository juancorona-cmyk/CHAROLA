const CLOUD = import.meta.env.CLOUDINARY_CLOUD_NAME as string;

type Type = 'image' | 'video';

/**
 * Returns an optimized Cloudinary URL.
 * @param publicId  e.g. 'naturizable/products/producto'
 * @param opts      resource type and optional extra transforms
 */
export function cld(
  publicId: string,
  opts: { type?: Type; transforms?: string } = {}
): string {
  const { type = 'image', transforms = 'f_auto,q_auto' } = opts;
  return `https://res.cloudinary.com/${CLOUD}/${type}/upload/${transforms}/${publicId}`;
}

// ── Pre-built URLs for every project asset ─────────────────────────────────

export const ASSETS = {
  // Brand — SVG no debe tener f_auto (lo convierte a raster)
  logo: cld('charola/logo', { transforms: 'f_svg,q_auto' }),

  // Hero
  heroPlan: cld('naturizable/hero/plan'),

  // Products
  charola855:   cld('naturizable/products/charola-855'),
  producto:     cld('naturizable/products/producto'),
  vaso:         cld('naturizable/products/vaso'),
  contenedor:   cld('naturizable/products/contenedor'),
  charola:      cld('naturizable/products/charola-hero'),  // hero display

  // Partners
  lonely:  cld('naturizable/partners/lonely'),
  tomFord: cld('naturizable/partners/tom-ford'),
  nu:      cld('naturizable/partners/nu'),
  bbva:    cld('naturizable/partners/bbva'),

  // Empaque
  captura: cld('naturizable/empaque/captura'),
  video:   cld('naturizable/empaque/video', { type: 'video', transforms: 'q_auto:good,vc_auto' }),

  // Parallax
  plxFondo:     cld('naturizable/parallax/fondo'),
  plxTierra:    cld('naturizable/parallax/tierra'),
  plxBaseTierra:cld('naturizable/parallax/base-tierra'),
  plxCharola:   cld('naturizable/parallax/charola'),
  plxPlanta:    cld('naturizable/parallax/planta'),
  sello1:       cld('naturizable/parallax/sello-1'),
  sello2:       cld('naturizable/parallax/sello-2'),
  sello3:       cld('naturizable/parallax/sello-3'),
  suiza:        cld('naturizable/parallax/suiza-white'),
} as const;

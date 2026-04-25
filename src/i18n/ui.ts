import { es } from './es';
import { en } from './en';

export const ui = {
  es,
  en,
} as const;

export type Lang = keyof typeof ui;
export const defaultLang: Lang = 'es';

/**
 * Función de traducción para el lado del servidor (Astro)
 * @param key La clave de traducción (ej: 'nav.home')
 * @param lang El idioma (opcional, por defecto es defaultLang)
 * @returns El texto traducido
 */
export function t(key: string, lang: Lang = defaultLang): string {
  const parts = key.split('.');
  let obj: any = ui[lang];
  for (const p of parts) {
    obj = obj?.[p];
    if (obj === undefined) return key;
  }
  return String(obj);
}

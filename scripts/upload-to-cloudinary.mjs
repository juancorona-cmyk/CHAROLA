/**
 * Upload all project assets to Cloudinary with proper folder structure.
 * Run with: node --env-file=.env scripts/upload-to-cloudinary.mjs
 *
 * Cloudinary Media Library structure:
 *   naturizable/
 *     hero/       → hero section images
 *     products/   → product catalog images
 *     partners/   → partner / brand logos
 *     empaque/    → packaging images + video
 */

import { v2 as cloudinary } from 'cloudinary';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const FOLDERS = [
  'naturizable',
  'naturizable/hero',
  'naturizable/products',
  'naturizable/partners',
  'naturizable/empaque',
  'naturizable/parallax',
];

/** folder + public_id are SEPARATE so Cloudinary creates real folder objects */
const ASSETS = [
  // ── HERO ─────────────────────────────────────────
  { file: 'public/assets/img/hero/plan.jpeg',                folder: 'naturizable/hero',     id: 'plan',        type: 'image' },

  // ── PRODUCTS ─────────────────────────────────────
  { file: 'public/assets/img/products/Charola.webp',         folder: 'naturizable/products', id: 'charola-hero', type: 'image' },
  { file: 'public/assets/img/products/charola-855.jpg',      folder: 'naturizable/products', id: 'charola-855',  type: 'image' },
  { file: 'public/assets/img/products/producto.jpg',         folder: 'naturizable/products', id: 'producto',     type: 'image' },
  { file: 'public/assets/img/products/vaso.jpg',             folder: 'naturizable/products', id: 'vaso',         type: 'image' },
  { file: 'public/assets/img/products/contenedor.jpg',       folder: 'naturizable/products', id: 'contenedor',   type: 'image' },

  // ── PARTNERS ─────────────────────────────────────
  { file: 'public/assets/img/partners/Lonely.webp',          folder: 'naturizable/partners', id: 'lonely',       type: 'image' },
  { file: 'public/assets/img/partners/Tom Ford.webp',        folder: 'naturizable/partners', id: 'tom-ford',     type: 'image' },
  { file: 'public/assets/img/partners/NU.png',               folder: 'naturizable/partners', id: 'nu',           type: 'image' },
  { file: 'public/assets/img/partners/BBVA.jpg',             folder: 'naturizable/partners', id: 'bbva',         type: 'image' },

  // ── EMPAQUE ──────────────────────────────────────
  { file: 'public/assets/img/empaque/captura.jpg',           folder: 'naturizable/empaque',  id: 'captura',       type: 'image' },
  { file: 'public/assets/img/empaque/video.mp4',             folder: 'naturizable/empaque',  id: 'video',         type: 'video' },

  // ── PARALLAX ─────────────────────────────────────
  { file: 'public/assets/img/parallax/Fondo.jpg',            folder: 'naturizable/parallax', id: 'fondo',         type: 'image' },
  { file: 'public/assets/img/parallax/Tierra.png',           folder: 'naturizable/parallax', id: 'tierra',        type: 'image' },
  { file: 'public/assets/img/parallax/BaseTierra.png',       folder: 'naturizable/parallax', id: 'base-tierra',   type: 'image' },
  { file: 'public/assets/img/parallax/Charola.png',          folder: 'naturizable/parallax', id: 'charola',       type: 'image' },
  { file: 'public/assets/img/parallax/Planta.png',           folder: 'naturizable/parallax', id: 'planta',        type: 'image' },
  { file: 'public/SVG/Recurso 2.svg',                        folder: 'naturizable/parallax', id: 'sello-1',        type: 'image' },
  { file: 'public/SVG/Recurso 3.svg',                        folder: 'naturizable/parallax', id: 'sello-2',        type: 'image' },
  { file: 'public/SVG/Recurso 4.svg',                        folder: 'naturizable/parallax', id: 'sello-3',        type: 'image' },
  { file: 'public/SVG/SUIZA.svg',                            folder: 'naturizable/parallax', id: 'suiza',          type: 'image' },
  { file: 'public/SVG/suizaw.svg',                           folder: 'naturizable/parallax', id: 'suiza-white',    type: 'image' },
];

async function createFolders() {
  console.log('📁 Creating folder structure...');
  for (const folder of FOLDERS) {
    try {
      await cloudinary.api.create_folder(folder);
      console.log(`   ✓ ${folder}`);
    } catch (e) {
      // Folder already exists — that's fine
      console.log(`   ℹ ${folder} (already exists)`);
    }
  }
}

async function deleteOldAssets() {
  console.log('\n🗑  Deleting old flat-structured assets...');
  try {
    // Delete images with the old public_id format (path baked in)
    const oldIds = ASSETS.filter(a => a.type === 'image')
      .map(a => `${a.folder}/${a.id}`);

    const chunks = [];
    for (let i = 0; i < oldIds.length; i += 100) chunks.push(oldIds.slice(i, i + 100));
    for (const chunk of chunks) {
      await cloudinary.api.delete_resources(chunk);
    }

    // Delete videos separately
    const oldVideoIds = ASSETS.filter(a => a.type === 'video')
      .map(a => `${a.folder}/${a.id}`);
    for (const id of oldVideoIds) {
      await cloudinary.api.delete_resources([id], { resource_type: 'video' });
    }
    console.log('   ✓ Old assets removed');
  } catch (e) {
    console.log('   ℹ No old assets to remove (or already clean)');
  }
}

async function upload(asset) {
  const filePath = resolve(ROOT, asset.file);
  console.log(`⬆  ${asset.folder}/${asset.id}  ←  ${asset.file}`);
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder:          asset.folder,   // ← creates real folder in Media Library
      public_id:       asset.id,       // ← just the filename, no slashes
      resource_type:   asset.type,
      overwrite:       true,
      unique_filename: false,
      use_filename:    false,
    });
    console.log(`   ✓  ${result.secure_url}`);
    return result;
  } catch (err) {
    console.error(`   ✗  ${err?.error?.message || err.message}`);
    return null;
  }
}

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('Missing .env — run with: node --env-file=.env scripts/upload-to-cloudinary.mjs');
    process.exit(1);
  }
  console.log(`\n🚀  Cloudinary cloud: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);

  await createFolders();
  await deleteOldAssets();

  console.log('\n📤 Uploading assets...\n');
  for (const asset of ASSETS) {
    await upload(asset);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅  Done! Folder structure in Cloudinary Media Library:\n');
  console.log('  naturizable/');
  console.log('    hero/       → plan');
  console.log('    products/   → charola-hero, charola-855, producto, vaso, contenedor');
  console.log('    partners/   → lonely, tom-ford, nu, bbva');
  console.log('    empaque/    → captura, video');
  console.log('    parallax/   → fondo, tierra, base-tierra, charola, planta');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();

/**
 * Sube todos los archivos de parallax a Cloudinary.
 * Uso: node --env-file=.env scripts/upload-parallax.mjs
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

const ASSETS = [
  { file: 'public/assets/img/parallax/fondo.png',       id: 'fondo' },
  { file: 'public/assets/img/parallax/base-tierra.png', id: 'base-tierra' },
  { file: 'public/assets/img/parallax/charola.png',     id: 'charola' },
  { file: 'public/assets/img/parallax/planta.png',      id: 'planta' },
  { file: 'public/assets/img/parallax/tierra.png',      id: 'tierra' },
  { file: 'public/assets/img/parallax/sello-1.png',     id: 'sello-1' },
  { file: 'public/assets/img/parallax/sello-2.png',     id: 'sello-2' },
  { file: 'public/assets/img/parallax/sello-3.png',     id: 'sello-3' },
  { file: 'public/assets/img/parallax/suiza-white.png', id: 'suiza-white' },
];

async function main() {
  console.log(`\n🚀 Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);
  for (const asset of ASSETS) {
    const filePath = resolve(ROOT, asset.file);
    process.stdout.write(`⬆  naturizable/parallax/${asset.id}  … `);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'naturizable/parallax',
        public_id: asset.id,
        resource_type: 'image',
        overwrite: true,
        unique_filename: false,
        use_filename: false,
      });
      console.log(`✓  ${result.secure_url}`);
    } catch (err) {
      console.log(`✗  ${err?.error?.message || err.message}`);
    }
  }
  console.log('\n✅ Listo.\n');
}

main();

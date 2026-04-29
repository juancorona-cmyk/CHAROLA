import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const MISSING = [
  { file: '/Users/govideo/Pictures/charola.png',    id: 'charola',     folder: 'naturizable/parallax' },
  { file: '/Users/govideo/Pictures/Tierra.png',     id: 'tierra',      folder: 'naturizable/parallax' },
  { file: '/Users/govideo/Pictures/baseTierra.png', id: 'base-tierra', folder: 'naturizable/parallax' },
  { file: '/Users/govideo/Pictures/planta.png',     id: 'planta',      folder: 'naturizable/parallax' },
];

for (const a of MISSING) {
  try {
    const r = await cloudinary.uploader.upload(a.file, {
      folder: a.folder, public_id: a.id,
      resource_type: 'image', overwrite: true,
      unique_filename: false, use_filename: false,
    });
    console.log(`✓  ${r.secure_url}`);
  } catch (e) {
    console.error(`✗  ${a.id}: ${e?.error?.message || e.message}`);
  }
}

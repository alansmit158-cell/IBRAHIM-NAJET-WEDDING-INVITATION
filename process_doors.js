const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const src = 'C:/Users/CYBERIO/.gemini/antigravity-ide/brain/7bbd3042-5b77-43b4-a819-503701979c3c/.user_uploaded/media_1790691374540.png';
const outDir = path.join(__dirname, 'assets');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const targetWidth = 1008;  // 6x upscale
  const targetHeight = 1800; // 6x upscale

  console.log('Generating ultra-high resolution assets...');

  // Multi-stage high quality Lanczos3 upscaling and unsharp masking
  const step1 = await sharp(src)
    .resize(504, 900, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill'
    })
    .sharpen({ sigma: 1.1, m1: 1.2, m2: 2.0 })
    .toBuffer();

  const fullEnhancedBuffer = await sharp(step1)
    .resize(targetWidth, targetHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill'
    })
    .sharpen({ sigma: 1.6, m1: 1.5, m2: 2.3 })
    .modulate({ brightness: 1.02, saturation: 1.05 })
    .toBuffer();

  // Save Full Doors High-Res
  await sharp(fullEnhancedBuffer)
    .webp({ quality: 98 })
    .toFile(path.join(outDir, 'doors-full-highres.webp'));

  await sharp(fullEnhancedBuffer)
    .png({ compressionLevel: 8 })
    .toFile(path.join(outDir, 'doors-full-highres.png'));

  // Extract Left Door (0 to 504)
  await sharp(fullEnhancedBuffer)
    .extract({ left: 0, top: 0, width: Math.floor(targetWidth / 2), height: targetHeight })
    .webp({ quality: 98 })
    .toFile(path.join(outDir, 'door-left-highres.webp'));

  await sharp(fullEnhancedBuffer)
    .extract({ left: 0, top: 0, width: Math.floor(targetWidth / 2), height: targetHeight })
    .png()
    .toFile(path.join(outDir, 'door-left-highres.png'));

  // Extract Right Door (504 to 1008)
  await sharp(fullEnhancedBuffer)
    .extract({ left: Math.floor(targetWidth / 2), top: 0, width: Math.floor(targetWidth / 2), height: targetHeight })
    .webp({ quality: 98 })
    .toFile(path.join(outDir, 'door-right-highres.webp'));

  await sharp(fullEnhancedBuffer)
    .extract({ left: Math.floor(targetWidth / 2), top: 0, width: Math.floor(targetWidth / 2), height: targetHeight })
    .png()
    .toFile(path.join(outDir, 'door-right-highres.png'));

  // Extract Wax Seal precisely
  // Center is at 511, 950.
  const sealRadius = 126;
  const sealDiameter = sealRadius * 2;
  const sealLeft = 511 - sealRadius;
  const sealTop = 950 - sealRadius;

  // Anti-aliased circular mask with slight feathering for natural organic wax rim
  const maskSvg = `
    <svg width="${sealDiameter}" height="${sealDiameter}">
      <defs>
        <radialGradient id="fadeEdge" cx="50%" cy="50%" r="50%">
          <stop offset="92%" stop-color="#fff" stop-opacity="1" />
          <stop offset="100%" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="${sealRadius}" cy="${sealRadius}" r="${sealRadius}" fill="url(#fadeEdge)"/>
    </svg>
  `;

  const sealBuffer = await sharp(fullEnhancedBuffer)
    .extract({ left: sealLeft, top: sealTop, width: sealDiameter, height: sealDiameter })
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .sharpen({ sigma: 1.8, m1: 1.8, m2: 2.5 })
    .toBuffer();

  await sharp(sealBuffer)
    .webp({ quality: 98 })
    .toFile(path.join(outDir, 'wax-seal-highres.webp'));

  await sharp(sealBuffer)
    .png()
    .toFile(path.join(outDir, 'wax-seal-highres.png'));

  console.log('High-res assets generated with exact seal center (511, 950)!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

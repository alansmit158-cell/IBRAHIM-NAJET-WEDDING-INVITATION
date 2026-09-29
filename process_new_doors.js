const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const src = 'C:/Users/CYBERIO/.gemini/antigravity-ide/brain/7bbd3042-5b77-43b4-a819-503701979c3c/.user_uploaded/media_1790692366945.jpg';
const outDir = path.join(__dirname, 'assets');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const meta = await sharp(src).metadata();
  console.log('Source image dimensions:', meta.width, 'x', meta.height);

  // Target upscale: 2x (1332 x 2048)
  const scale = 2;
  const targetW = meta.width * scale;
  const targetH = meta.height * scale;

  console.log(`Upscaling to ${targetW} x ${targetH} with Lanczos3 and unsharp mask...`);
  const enhancedBuffer = await sharp(src)
    .resize(targetW, targetH, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill'
    })
    .sharpen({ sigma: 1.1, m1: 1.2, m2: 2.0 })
    .toBuffer();

  // Save Full Doors
  await sharp(enhancedBuffer)
    .webp({ quality: 96 })
    .toFile(path.join(outDir, 'doors-full-highres.webp'));

  await sharp(enhancedBuffer)
    .png()
    .toFile(path.join(outDir, 'doors-full-highres.png'));

  // Split seam down center: halfW = 666
  const halfW = Math.floor(targetW / 2);

  // Left Door Leaf (0 to halfW)
  await sharp(enhancedBuffer)
    .extract({ left: 0, top: 0, width: halfW, height: targetH })
    .webp({ quality: 96 })
    .toFile(path.join(outDir, 'door-left-highres.webp'));

  await sharp(enhancedBuffer)
    .extract({ left: 0, top: 0, width: halfW, height: targetH })
    .png()
    .toFile(path.join(outDir, 'door-left-highres.png'));

  // Right Door Leaf (halfW to targetW)
  await sharp(enhancedBuffer)
    .extract({ left: halfW, top: 0, width: targetW - halfW, height: targetH })
    .webp({ quality: 96 })
    .toFile(path.join(outDir, 'door-right-highres.webp'));

  await sharp(enhancedBuffer)
    .extract({ left: halfW, top: 0, width: targetW - halfW, height: targetH })
    .png()
    .toFile(path.join(outDir, 'door-right-highres.png'));

  // Wax seal extraction:
  // Center is at 330 * 2 = 660 (x), 515 * 2 = 1030 (y)
  // Let's set radius = 210px (diameter 420px)
  const sealRadius = 210;
  const sealDiameter = sealRadius * 2;
  const sealCenterX = 660;
  const sealCenterY = 1030;
  const sealLeft = sealCenterX - sealRadius;
  const sealTop = sealCenterY - sealRadius;

  console.log(`Extracting wax seal: left=${sealLeft}, top=${sealTop}, size=${sealDiameter}`);

  // Anti-aliased circular mask with slight feather
  const maskSvg = `
    <svg width="${sealDiameter}" height="${sealDiameter}">
      <defs>
        <radialGradient id="fade" cx="50%" cy="50%" r="50%">
          <stop offset="91%" stop-color="#fff" stop-opacity="1" />
          <stop offset="100%" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="${sealRadius}" cy="${sealRadius}" r="${sealRadius - 2}" fill="url(#fade)" />
    </svg>
  `;

  const sealBuffer = await sharp(enhancedBuffer)
    .extract({ left: sealLeft, top: sealTop, width: sealDiameter, height: sealDiameter })
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .sharpen({ sigma: 1.5, m1: 1.5, m2: 2.2 })
    .toBuffer();

  await sharp(sealBuffer)
    .webp({ quality: 96 })
    .toFile(path.join(outDir, 'wax-seal-highres.webp'));

  await sharp(sealBuffer)
    .png()
    .toFile(path.join(outDir, 'wax-seal-highres.png'));

  console.log('SUCCESS! All high-res doors and wax seal successfully generated!');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

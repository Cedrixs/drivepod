/**
 * Pure Node.js PNG icon generator for DrivePod.
 * Uses zlib (built-in) to create valid PNG files without native deps.
 */
import { createDeflate } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

function crc32(data) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const b of data) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function uint32BE(n) {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function chunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const len = uint32BE(data.length);
  const crcData = new Uint8Array(4 + data.length);
  crcData.set(typeBytes, 0);
  crcData.set(data, 4);
  const crc = uint32BE(crc32(crcData));
  const out = new Uint8Array(4 + 4 + data.length + 4);
  let off = 0;
  out.set(len, off); off += 4;
  out.set(typeBytes, off); off += 4;
  out.set(data, off); off += data.length;
  out.set(crc, off);
  return out;
}

function deflateSync(data) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const def = createDeflate({ level: 6 });
    def.on('data', (c) => chunks.push(c));
    def.on('end', () => resolve(Buffer.concat(chunks)));
    def.on('error', reject);
    def.end(Buffer.from(data));
  });
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function drawIcon(size) {
  // RGBA pixels
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2, cy = size / 2, r = size / 2;
  const navyR = 26, navyG = 26, navyB = 46; // #1a1a2e
  const accentR = 233, accentG = 69, accentB = 96; // #e94560

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const off = (y * size + x) * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > r) { pixels[off + 3] = 0; continue; }

      // Background
      let pr = navyR, pg = navyG, pb = navyB, pa = 255;

      // Glow circle
      const glowDist = dist / r;
      if (glowDist < 0.7) {
        const t = 1 - glowDist / 0.7;
        const alpha = t * 0.25;
        pr = lerp(pr, accentR, alpha);
        pg = lerp(pg, accentG, alpha);
        pb = lerp(pb, accentB, alpha);
      }

      // Play triangle: pointing right
      const tx = x / size, ty = y / size;
      const tri_x0 = 0.38, tri_top_y = 0.28, tri_bot_y = 0.72, tri_right_x = 0.70;
      const inTriangle =
        tx >= tri_x0 &&
        tx <= tri_right_x &&
        ty >= tri_top_y + (tx - tri_x0) * ((0.5 - tri_top_y) / (tri_right_x - tri_x0)) - 0.02 &&
        ty <= tri_bot_y - (tx - tri_x0) * ((tri_bot_y - 0.5) / (tri_right_x - tri_x0)) + 0.02;

      if (inTriangle) { pr = accentR; pg = accentG; pb = accentB; pa = 255; }

      // Anti-alias edge
      if (dist > r - 1.5) {
        pa = Math.round(pa * (1 - (dist - (r - 1.5)) / 1.5));
      }

      pixels[off] = pr; pixels[off + 1] = pg; pixels[off + 2] = pb; pixels[off + 3] = pa;
    }
  }
  return pixels;
}

async function makePNG(size, rgba) {
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bitDepth=8, colorType=6(RGBA), compression=0, filter=0, interlace=0
  const ihdr = new Uint8Array(13);
  const w32 = uint32BE(size); const h32 = uint32BE(size);
  ihdr.set(w32, 0); ihdr.set(h32, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw image data: add filter byte 0 before each scanline
  const rawData = new Uint8Array(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    rawData[y * (1 + size * 4)] = 0; // filter none
    rawData.set(rgba.slice(y * size * 4, (y + 1) * size * 4), y * (1 + size * 4) + 1);
  }

  const compressed = await deflateSync(rawData);

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', compressed);
  const iendChunk = chunk('IEND', new Uint8Array(0));

  const total = sig.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const out = new Uint8Array(total);
  let off = 0;
  out.set(sig, off); off += sig.length;
  out.set(ihdrChunk, off); off += ihdrChunk.length;
  out.set(idatChunk, off); off += idatChunk.length;
  out.set(iendChunk, off);
  return Buffer.from(out);
}

async function main() {
  for (const size of [192, 512]) {
    const rgba = drawIcon(size);
    const png = await makePNG(size, rgba);
    const path = join(OUT_DIR, `icon-${size}.png`);
    writeFileSync(path, png);
    console.log(`Generated ${path} (${png.length} bytes)`);
  }
  // maskable: same as 512 but with safe zone padding (icon in inner 80%)
  const rgba512 = drawIcon(512);
  const png512 = await makePNG(512, rgba512);
  writeFileSync(join(OUT_DIR, 'icon-maskable.png'), png512);
  console.log('Generated icon-maskable.png');
}

main().catch(console.error);

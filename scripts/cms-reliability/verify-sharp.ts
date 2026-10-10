/**
 * Verifies sharp loads and can run the CMS image preprocessing path on Windows.
 * Usage: npx tsx scripts/cms-reliability/verify-sharp.ts
 */

import assert from "node:assert/strict";
import sharp from "sharp";

async function main(): Promise<void> {
  assert.ok(sharp, "sharp module missing");
  const versions = sharp.versions;
  console.log("sharp versions", versions);

  const png = await sharp({
    create: {
      width: 120,
      height: 80,
      channels: 3,
      background: { r: 240, g: 240, b: 245 },
    },
  })
    .png()
    .toBuffer();

  // Mirrors CMS page/image path: decode → transform → webp encode
  const processed = await sharp(png)
    .rotate()
    .greyscale()
    .normalize()
    .resize({ width: 100, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  assert.ok(processed.data.byteLength > 0, "webp output empty");
  assert.equal(processed.info.format, "webp");
  console.log("sharp preprocess ok", {
    inBytes: png.byteLength,
    outBytes: processed.data.byteLength,
    width: processed.info.width,
    height: processed.info.height,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  });
}

main().catch((error) => {
  console.error("SHARP_VERIFY_FAILED", error);
  process.exit(1);
});

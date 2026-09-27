import sharp from "sharp";

export interface WebpConversionResult {
  buffer: Buffer;
  width: number;
  height: number;
  fileSizeBytes: number;
  format: "webp";
}

/**
 * Converts an image buffer to optimized WEBP.
 */
export async function convertToWebp(
  source: Buffer,
  options?: {
    quality?: number;
    maxWidth?: number;
  }
): Promise<WebpConversionResult> {
  const quality = options?.quality ?? 82;
  const maxWidth = options?.maxWidth ?? 2400;

  // Never reuse a Sharp instance after awaiting — that can hang indefinitely.
  console.log("[Reconstruction] Reading crop metadata");
  const metadataStarted = Date.now();
  const meta = await sharp(source).metadata();
  console.log("[Reconstruction] Read crop metadata", {
    ms: Date.now() - metadataStarted,
  });
  const width = meta.width ?? 0;

  let pipeline = sharp(source).rotate();

  if (width > maxWidth) {
    pipeline = pipeline.resize({
      width: maxWidth,
      withoutEnlargement: true,
    });
  }

  console.log("[Reconstruction] Encoding webp");
  const encodeStarted = Date.now();
  const result = await pipeline
    .webp({
      quality,
      effort: 4,
    })
    .toBuffer({ resolveWithObject: true });
  console.log("[Reconstruction] Encoded webp", {
    ms: Date.now() - encodeStarted,
  });

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    fileSizeBytes: result.data.byteLength,
    format: "webp",
  };
}

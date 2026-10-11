import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

async function downloadFile(url: string, dest: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(`Failed to download ${url}: status ${res.statusCode}`)
          );
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}

async function rasterizePdf(
  pdfPath: string,
  outputDir: string,
  scale = 2.0
): Promise<string[]> {
  await fs.promises.mkdir(outputDir, { recursive: true });
  const { createCanvas } = require("@napi-rs/canvas");
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const wasmDir = path.join(
    path.dirname(require.resolve("pdfjs-dist/package.json")),
    "wasm"
  );
  const wasmUrl = pathToFileURL(wasmDir + path.sep).href;

  const data = new Uint8Array(await fs.promises.readFile(pdfPath));
  const pdf = await getDocument({
    data,
    useSystemFonts: true,
    wasmUrl,
    useWasm: true,
  }).promise;

  const pageImagePaths: string[] = [];
  console.log(`PDF loaded. Total pages: ${pdf.numPages}`);

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height)
    );
    const context = canvas.getContext("2d");

    await page.render({
      canvasContext: context as never,
      canvas: canvas as never,
      viewport,
    }).promise;

    const pngBuffer = Buffer.from(await canvas.encode("png"));
    const pageImgPath = path.join(outputDir, `page-${i}.png`);
    await fs.promises.writeFile(pageImgPath, pngBuffer);
    pageImagePaths.push(pageImgPath);
    console.log(
      `Rendered page ${i} -> ${pageImgPath} (${pngBuffer.length} bytes, ${viewport.width}x${viewport.height})`
    );
  }

  return pageImagePaths;
}

async function main() {
  const stagingDir = path.join(process.cwd(), ".cms", "staging-cse-sem5");
  const pdfDest = path.join(
    stagingDir,
    "downloads",
    "cs-501-theory-of-computation-nov-2022.pdf"
  );
  const rasterDest = path.join(
    stagingDir,
    "rasters",
    "cs-501-theory-of-computation-nov-2022"
  );

  console.log("Downloading CS-501 November 2022 pilot PDF...");
  await downloadFile(
    "https://www.rgpvonline.com/be/cs-501-theory-of-computation-nov-2022.pdf",
    pdfDest
  );
  console.log(`Saved to ${pdfDest} (${fs.statSync(pdfDest).size} bytes)`);

  console.log("Rasterizing PDF...");
  const images = await rasterizePdf(pdfDest, rasterDest);
  console.log(`Successfully rasterized ${images.length} pages.`);
}

main().catch(console.error);

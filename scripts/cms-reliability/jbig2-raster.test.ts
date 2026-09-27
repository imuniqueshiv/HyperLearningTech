import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import {
  assessRasterPixels,
  sampleNonWhitePixels,
} from "../../lib/content-pipeline/ocr-quality";

const fixtureCandidates = [
  path.join(
    process.cwd(),
    "scripts",
    "cms-reliability",
    "fixtures",
    "jbig2-al-402.pdf"
  ),
  path.join(
    process.cwd(),
    ".cms",
    "uploads",
    "job_865e79db822140b0b401b0fa44534bd7",
    "original.pdf"
  ),
];

function resolveFixture(): string | null {
  return (
    fixtureCandidates.find((candidate) => fs.existsSync(candidate)) ?? null
  );
}

describe("JBIG2 PDF rasterization", () => {
  it("renders non-blank pixels when pdf.js wasmUrl is set", async () => {
    const pdfPath = resolveFixture();
    if (!pdfPath) {
      assert.ok(true, "fixture not present — skipped");
      return;
    }

    const requireFromProject = createRequire(
      path.join(process.cwd(), "package.json")
    );
    const { createCanvas } = requireFromProject("@napi-rs/canvas") as {
      createCanvas: (
        w: number,
        h: number
      ) => {
        getContext: (type: "2d") => {
          getImageData: (
            x: number,
            y: number,
            w: number,
            h: number
          ) => { data: Uint8ClampedArray };
        };
        encode: (format: "png") => Promise<Buffer> | Buffer;
      };
    };
    const wasmDir = path.join(
      path.dirname(requireFromProject.resolve("pdfjs-dist/package.json")),
      "wasm"
    );
    const wasmUrl = pathToFileURL(wasmDir + path.sep).href;
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdf = await getDocument({
      data,
      useSystemFonts: true,
      wasmUrl,
      useWasm: true,
    }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
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
    const png = Buffer.from(await canvas.encode("png"));
    const imageData = context.getImageData(
      0,
      0,
      Math.ceil(viewport.width),
      Math.ceil(viewport.height)
    );
    const quality = assessRasterPixels({
      pngBytes: png.length,
      width: Math.ceil(viewport.width),
      height: Math.ceil(viewport.height),
      nonWhiteSampled: sampleNonWhitePixels(imageData.data),
    });

    assert.equal(quality.blank, false);
    assert.ok(quality.pngBytes > 50_000);
    assert.ok(quality.nonWhiteSampled > 20);
  });
});

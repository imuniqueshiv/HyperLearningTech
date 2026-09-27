import { createRequire } from "node:module";
import path from "node:path";

/**
 * Load @napi-rs/canvas via Node's real require graph (project root), not through
 * Turbopack/webpack module evaluation. Native .node bindings break when the
 * package's js-binding.js is bundled and its require() calls are stubbed.
 *
 * Resolution is anchored at process.cwd()/package.json so it works whether this
 * file is executed from source or from a Next server chunk.
 */
const requireFromProject = createRequire(
  path.join(process.cwd(), "package.json")
);

export type NativeCanvas = {
  createCanvas: (
    width: number,
    height: number
  ) => {
    getContext: (type: "2d") => unknown;
    encode: (format: "png") => Promise<Buffer> | Buffer;
  };
};

export function loadNativeCanvas(): NativeCanvas {
  // #region agent log
  fetch("http://127.0.0.1:7856/ingest/77f3b736-2f6d-4973-acf6-79f9a796e05e", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "26e666",
    },
    body: JSON.stringify({
      sessionId: "26e666",
      runId: "post-fix",
      hypothesisId: "H-turbopack",
      location: "native-canvas.ts:loadNativeCanvas",
      message: "Loading @napi-rs/canvas via createRequire",
      data: { cwd: process.cwd() },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const canvas = requireFromProject("@napi-rs/canvas") as NativeCanvas;

  // #region agent log
  fetch("http://127.0.0.1:7856/ingest/77f3b736-2f6d-4973-acf6-79f9a796e05e", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "26e666",
    },
    body: JSON.stringify({
      sessionId: "26e666",
      runId: "post-fix",
      hypothesisId: "H-turbopack",
      location: "native-canvas.ts:loadNativeCanvas:ok",
      message: "Native canvas loaded",
      data: { hasCreateCanvas: typeof canvas.createCanvas === "function" },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return canvas;
}

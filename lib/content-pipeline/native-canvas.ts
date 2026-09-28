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
const canvas = requireFromProject("@napi-rs/canvas") as NativeCanvas;
return canvas;
}

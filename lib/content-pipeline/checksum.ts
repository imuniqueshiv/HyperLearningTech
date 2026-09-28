import { createHash } from "node:crypto";

/**
 * Deterministic SHA-256 hex digest for upload identity / traceability.
 * Filename is never used as content identity.
 */
export function sha256Hex(data: Buffer | Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export async function sha256HexOfBuffers(parts: Buffer[]): Promise<string> {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(part);
  }
  return hash.digest("hex");
}

import { randomUUID } from "crypto";

/**
 * Generates a unique import job id.
 * Example: job_a1b2c3d4e5f64789a0b1c2d3e4f56789
 *
 * Server-only — uses Node crypto.
 */
export function generateJobId(): string {
  return `job_${randomUUID().replace(/-/g, "")}`;
}

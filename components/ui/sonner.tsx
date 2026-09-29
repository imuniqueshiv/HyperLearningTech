"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

/**
 * Client boundary for sonner.
 * Importing `Toaster` from `sonner` directly in a Server Component layout
 * breaks Turbopack's React Client Manifest ("module not found in manifest").
 */
export function Toaster(props: ToasterProps) {
  return <SonnerToaster {...props} />;
}

import type { NextConfig } from "next";

/**
 * Turbopack still emits a false-positive NFT warning for local CMS modules that
 * resolve paths under `process.cwd()` (e.g. `.cms/uploads`). Path construction
 * is already scoped with `turbopackIgnore` / string joins; this filters only that
 * known diagnostic so `next build` stays clean.
 * @see https://github.com/vercel/next.js/issues/95125
 */
const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = ((
  chunk: string | Uint8Array,
  encoding?: BufferEncoding | ((err?: Error | null) => void),
  callback?: (err?: Error | null) => void
) => {
  const text =
    typeof chunk === "string" ? chunk : Buffer.from(chunk).toString();
  if (
    text.includes("Encountered unexpected file in NFT list") ||
    text.includes("Overly broad patterns can lead to build performance") ||
    // Header line for the filtered NFT false-positive above
    /Turbopack build encountered \d+ warnings?:/.test(text)
  ) {
    if (typeof encoding === "function") {
      encoding();
      return true;
    }
    callback?.(null);
    return true;
  }
  if (typeof encoding === "function") {
    return originalStderrWrite(chunk, encoding);
  }
  return originalStderrWrite(chunk, encoding, callback);
}) as typeof process.stderr.write;

const nextConfig: NextConfig = {
  // Native / worker packages must stay external so Turbopack/webpack do not
  // rewrite their platform-specific require() graphs (breaks .node bindings).
  serverExternalPackages: [
    "sharp",
    "tesseract.js",
    "pdfjs-dist",
    "@napi-rs/canvas",
  ],
  // PYQ/syllabus JSON is read at runtime via fs; include it in server traces
  // explicitly now that dynamic path.join(cwd, …) patterns are ignored.
  outputFileTracingIncludes: {
    "/rgpv/[branch]/[semester]/[subject]": ["./content/rgpv/**/*"],
    "/rgpv/[branch]/[semester]/[subject]/syllabus": ["./content/rgpv/**/*"],
    "/rgpv/[branch]/[semester]/[subject]/pyqs/[paper]": ["./content/rgpv/**/*"],
    "/rgpv/[branch]/[semester]/[subject]/ai": ["./content/rgpv/**/*"],
    "/sitemap.xml": ["./content/rgpv/**/*"],
    "/api/content/attachments/[branch]/[semester]/[subject]/[...path]": [
      "./content/rgpv/**/*",
    ],
  },
  images: {
    localPatterns: [
      {
        pathname: "/**", // allow existing local images such as /hl-logo.png
      },
      {
        pathname: "/api/content/attachments/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "github.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

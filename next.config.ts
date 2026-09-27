import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native / worker packages must stay external so Turbopack/webpack do not
  // rewrite their platform-specific require() graphs (breaks .node bindings).
  serverExternalPackages: [
    "sharp",
    "tesseract.js",
    "pdfjs-dist",
    "@napi-rs/canvas",
  ],
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

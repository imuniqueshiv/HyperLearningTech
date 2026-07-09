import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
        pathname: "/u/**",
      },
    ],
  },
};

export default nextConfig;

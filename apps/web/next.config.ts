import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@slideshow/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@slideshow/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.storage.googleapis.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    // Include Prisma query engine in the standalone output
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outputFileTracingIncludes: {
      "/**": [
        "./node_modules/.prisma/**",
        "../../node_modules/.pnpm/@prisma+*/node_modules/.prisma/**",
      ],
    } as any,
  },
};

export default nextConfig;

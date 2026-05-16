import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack/webpack from bundling native Node.js packages
  serverExternalPackages: ["pg", "ws"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "science.psru.ac.th",
      },
    ],
  },
};

export default nextConfig;

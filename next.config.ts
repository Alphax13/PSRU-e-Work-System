import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack/webpack from bundling native Node.js packages
  serverExternalPackages: ["pg", "ws"],
};

export default nextConfig;

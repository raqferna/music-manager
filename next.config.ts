import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite responder con streams grandes (audio) sin warnings.
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;

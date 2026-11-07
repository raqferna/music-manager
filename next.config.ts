import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite responder con streams grandes (audio/vídeo) sin warnings.
    serverActions: { bodySizeLimit: "800mb" },
  },
};

export default nextConfig;

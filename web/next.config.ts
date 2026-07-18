import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The landing page is the default entry point.
      { source: "/", destination: "/home", permanent: false },
    ];
  },
};

export default nextConfig;

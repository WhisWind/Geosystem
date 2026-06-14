import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/data/results/:path*",
        destination: `${process.env.API_URL || "http://backend:8000"}/data/results/:path*`,
      },
    ];
  },
};


export default nextConfig;

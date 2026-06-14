import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/data/results/:path*",
        destination: `${process.env.API_URL || "http://127.0.0.1:8000"}/data/results/:path*`,
      },
    ];
  },
};


export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/data/results/:path*",
        destination: "http://127.0.0.1:8000/data/results/:path*",
      },
    ];
  },
  /* config options here */
};


export default nextConfig;

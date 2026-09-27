import type { NextConfig } from "next";
import fs from "fs";
import path from "path";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");


const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  devIndicators: false,
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  // On GitHub Pages, the site is served under /gym-track
  basePath: isProd ? '/gym-track' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

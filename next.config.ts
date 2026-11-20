import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Images are resized by their source CDN, not the Next.js optimizer.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Cap srcset widths at 1600px (default goes to 3840px), so even a
    // full-width image on a high-DPI screen stays small.
    deviceSizes: [640, 828, 1080, 1280, 1600],
    imageSizes: [128, 256, 384],
    qualities: [60],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

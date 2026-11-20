"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * Global next/image loader (see `images.loaderFile` in next.config.ts).
 * Unsplash images are resized and format-negotiated by Unsplash's own CDN,
 * so the browser downloads the right size directly. Any other src is served
 * as-is; add a branch here when a new image host or the built-in optimizer
 * is needed.
 */
const MAX_WIDTH = 1600;
const DEFAULT_QUALITY = 60;

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(Math.min(width, MAX_WIDTH)));
    url.searchParams.set("q", String(quality ?? DEFAULT_QUALITY));
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    return url.toString();
  }
  return src;
}

import Image from "next/image";
import type { Image as ImageData } from "@/types";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: ImageData[];
};

/**
 * Large product imagery. Mobile: full-bleed, swipeable with scroll snapping
 * (the next image peeks in when there is more than one). lg+: images stacked
 * in a column that scrolls past the sticky product details.
 */
export function ProductGallery({ images }: ProductGalleryProps) {
  const multiple = images.length > 1;

  return (
    <div
      role={multiple ? "region" : undefined}
      aria-label={multiple ? "Product images, scrollable" : undefined}
      tabIndex={multiple ? 0 : undefined}
      className="bleed scrollbar-none flex snap-x snap-mandatory gap-1 overflow-x-auto lg:mx-0 lg:flex-col lg:overflow-visible"
    >
      {images.map((image, index) => (
        <div
          key={image.src}
          className={cn(
            "media-frame shrink-0 snap-start lg:w-full",
            multiple ? "w-[88%]" : "w-full",
          )}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            preload={index === 0}
            sizes="(min-width: 64rem) 58vw, 100vw"
            className={
              image.fit === "contain"
                ? "object-contain p-[12%] mix-blend-multiply"
                : "object-cover"
            }
          />
        </div>
      ))}
    </div>
  );
}

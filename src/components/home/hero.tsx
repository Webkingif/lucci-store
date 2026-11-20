import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/layout";
import type { Image as ImageData } from "@/types";

type HeroProps = {
  images: [ImageData, ImageData];
};

/**
 * Full-bleed two-up campaign hero; collapses to a single image on mobile.
 * Copy sits bottom-left and the action bottom-right, so nothing straddles
 * the seam between the two photographs.
 */
export function Hero({ images: [primary, secondary] }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative grid h-[calc(100svh-var(--header-h))] max-h-[60rem] min-h-[34rem] grid-cols-1 bg-ink md:grid-cols-2"
    >
      <div className="relative">
        <Image
          src={primary.src}
          alt={primary.alt}
          fill
          preload
          sizes="(min-width: 48rem) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="relative max-md:hidden">
        <Image
          src={secondary.src}
          alt={secondary.alt}
          fill
          sizes="50vw"
          className="object-cover"
        />
      </div>

      {/* Scrim only on the lower half, where the copy sits. */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink/70 via-ink/0 via-55%" />

      <div className="absolute inset-x-0 bottom-0 container-page flex flex-col gap-8 pb-10 text-paper md:flex-row md:items-end md:justify-between lg:pb-14">
        <div className="flex flex-col gap-4">
          <Eyebrow className="text-paper/80">Autumn / Winter</Eyebrow>
          <h1 id="hero-title" className="font-display text-display">
            Quiet Form
          </h1>
          <p className="max-w-sm text-lead text-paper/80">
            Sculpted tailoring and soft leather in stone, charcoal and black.
          </p>
        </div>
        <Link
          href="/products"
          className={buttonVariants({
            variant: "inverse",
            className: "self-start md:self-auto",
          })}
        >
          Shop the collection
        </Link>
      </div>
    </section>
  );
}

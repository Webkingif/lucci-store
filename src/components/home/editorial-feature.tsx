import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/layout";
import type { Image as ImageData } from "@/types";

type EditorialFeatureProps = {
  image: ImageData;
};

/**
 * Split editorial block: white-ground photograph against an ink panel.
 * The only dark band on the page, so it reads as a change of pace.
 */
export function EditorialFeature({ image }: EditorialFeatureProps) {
  return (
    <section
      aria-labelledby="feature-title"
      className="grid bg-ink text-paper md:grid-cols-2"
    >
      <div className="relative aspect-4/5 bg-paper md:aspect-auto md:min-h-[44rem]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 48rem) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col justify-end gap-6 px-(--gutter) py-14 md:px-[max(var(--gutter),5vw)] md:py-[max(var(--gutter),5vw)]">
        <Eyebrow className="text-paper/60">The edit</Eyebrow>
        <h2 id="feature-title" className="font-display text-headline">
          The Black Line
        </h2>
        <p className="max-w-md text-lead text-paper/75">
          A study in volume and restraint: oversized outerwear, sharp shoulders
          and fluid trousers, layered or worn apart.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            href="/products"
            className={buttonVariants({ variant: "inverse" })}
          >
            Discover the edit
          </Link>
          <Link href="/products" className="eyebrow link">
            Shop all
          </Link>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/layout";
import type { Collection } from "@/types";

type CategoryTilesProps = {
  categories: Collection[];
};

/**
 * Portrait category tiles with the label set on the image.
 * Mobile: a swipeable row (keeps the page short); sm+: a three-column grid.
 */
export function CategoryTiles({ categories }: CategoryTilesProps) {
  return (
    <Section aria-labelledby="categories-title" className="container-page">
      <SectionHeading id="categories-title" title="Shop by category" />
      <ul className="-mx-(--gutter) scrollbar-none flex snap-x snap-mandatory scroll-px-(--gutter) gap-1 overflow-x-auto px-(--gutter) sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {categories.map((category) => (
          <li
            key={category.slug}
            className="group relative w-[80%] shrink-0 snap-start sm:w-auto"
          >
            <div className="media-frame aspect-3/4!">
              <Image
                src={category.image.src}
                alt={category.image.alt}
                fill
                sizes="(min-width: 40rem) 33vw, 80vw"
                className="object-cover transition-transform duration-700 ease-standard group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink/55 via-ink/0 via-40%" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-paper lg:p-8">
                <h3 className="font-display text-title">
                  <Link
                    href={category.href}
                    className="after:absolute after:inset-0"
                  >
                    {category.title}
                  </Link>
                </h3>
                <span
                  aria-hidden
                  className="eyebrow link-reveal group-hover:decoration-current"
                >
                  Shop
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

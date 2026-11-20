import Link from "next/link";
import { SortSelect } from "@/components/product/sort-select";
import { catalogHref, sortOptions, type SortValue } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

type CatalogToolbarProps = {
  /** All categories, with counts. */
  categories: Category[];
  /** The active category; undefined means "All". */
  category?: Category;
  sort: SortValue;
};

/**
 * Sticky filter bar under the header: category links on the left (scrolling
 * sideways on small screens), sort on the right. Small tracked text and a
 * hairline only, so the imagery below carries the page.
 */
export function CatalogToolbar({
  categories,
  category,
  sort,
}: CatalogToolbarProps) {
  const total = categories.reduce((sum, c) => sum + (c.count ?? 0), 0);
  const links = [
    { slug: undefined, title: "All", count: total },
    ...categories,
  ];

  const sortChoices = sortOptions.map((option) => ({
    ...option,
    href: catalogHref({ category: category?.slug, sort: option.value }),
  }));

  return (
    <div className="sticky top-(--header-h) z-30 border-b bg-paper">
      <div className="container-page flex h-12 items-center justify-between gap-6 lg:h-14">
        <nav
          aria-label="Product categories"
          className="-ml-(--gutter) scrollbar-none min-w-0 flex-1 overflow-x-auto pl-(--gutter) lg:ml-0 lg:pl-0"
        >
          <ul className="flex items-center gap-6 whitespace-nowrap lg:gap-8">
            {links.map((link) => {
              const active = link.slug === category?.slug;
              return (
                <li key={link.title}>
                  <Link
                    href={catalogHref({ category: link.slug, sort })}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group eyebrow transition-colors duration-150 ease-standard",
                      active ? "text-ink" : "text-muted hover:text-ink",
                    )}
                  >
                    {/* Underline the label only, not the count. */}
                    <span className="link-reveal group-hover:decoration-current group-aria-[current=page]:decoration-current">
                      {link.title}
                    </span>
                    <sup className="ml-1 text-[0.85em] text-muted">
                      {link.count}
                    </sup>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <SortSelect value={sort} options={sortChoices} />
      </div>
    </div>
  );
}

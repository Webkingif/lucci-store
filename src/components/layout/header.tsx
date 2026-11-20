import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { siteConfig } from "@/lib/site";

const icon = "inline-flex size-10 items-center justify-center";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-paper">
      <div className="container-page grid h-(--header-h) grid-cols-[1fr_auto_1fr] items-center">
        <nav aria-label="Primary" className="flex items-center gap-5 sm:gap-8">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="eyebrow link-reveal"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="font-display text-2xl tracking-[0.18em] uppercase lg:text-3xl"
        >
          {siteConfig.name}
        </Link>

        {/* Placeholders until search, account and cart exist. */}
        <div aria-hidden className="-mr-2.5 flex items-center justify-end">
          <span className={icon}>
            <Search className="size-[18px]" strokeWidth={1.25} />
          </span>
          <span className={`${icon} max-sm:hidden`}>
            <User className="size-[18px]" strokeWidth={1.25} />
          </span>
          <span className={icon}>
            <ShoppingBag className="size-[18px]" strokeWidth={1.25} />
          </span>
        </div>
      </div>
    </header>
  );
}

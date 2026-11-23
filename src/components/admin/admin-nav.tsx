"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const adminLinks = [
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Orders", href: "/admin/orders" },
] as const;

/** Admin section links; marks the current section. */
export function AdminNav() {
  const pathname = usePathname();
  return <AdminNavLinks current={pathname} />;
}

/** Static version, used as the Suspense fallback while the path is read. */
export function AdminNavLinks({ current }: { current?: string }) {
  return (
    <nav aria-label="Admin" className="flex items-center gap-6">
      {adminLinks.map((link) => {
        const active = current?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "eyebrow link-reveal",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

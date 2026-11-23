import { Suspense } from "react";
import Link from "next/link";
import { AdminNav, AdminNavLinks } from "@/components/admin/admin-nav";
import { siteConfig } from "@/lib/site";
import { signOut } from "./actions";

/**
 * Admin shell. Static on purpose: each page checks the session itself (see
 * src/lib/admin/auth.ts), so this layout holds no data.
 */
export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-paper">
        <div className="container-page flex h-(--header-h) items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/admin/products" className="flex items-baseline gap-3">
              <span className="font-display text-xl tracking-[0.18em] uppercase">
                {siteConfig.name}
              </span>
              <span className="eyebrow text-muted">Admin</span>
            </Link>
            <div className="max-sm:hidden">
              <Suspense fallback={<AdminNavLinks />}>
                <AdminNav />
              </Suspense>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="eyebrow link-reveal max-sm:hidden">
              View store
            </Link>
            <form action={signOut}>
              <button type="submit" className="eyebrow link-reveal">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="container-page border-t py-3 sm:hidden">
          <Suspense fallback={<AdminNavLinks />}>
            <AdminNav />
          </Suspense>
        </div>
      </header>
      <main className="container-page flex-1 py-10 lg:py-14">{children}</main>
    </>
  );
}

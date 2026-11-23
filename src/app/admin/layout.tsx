import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: `%s | Admin | ${siteConfig.name}`,
  },
  robots: { index: false, follow: false },
};

/**
 * Admin area root. Authorization happens in every page, Server Action and
 * admin data function (requireAdmin), never in a layout: layouts don't
 * re-render on navigation, and reading the session here would block the shell.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex flex-1 flex-col bg-paper">{children}</div>;
}

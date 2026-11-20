import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container-page flex flex-col gap-2 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="eyebrow">{siteConfig.name}</p>
        <p className="text-caption text-muted">
          © {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

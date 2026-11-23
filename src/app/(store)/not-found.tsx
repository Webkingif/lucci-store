import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow, Section } from "@/components/ui/layout";

export default function NotFound() {
  return (
    <Section className="container-page flex flex-col items-center gap-6 text-center">
      <Eyebrow className="text-muted">404</Eyebrow>
      <h1 className="font-display text-headline">Page not found</h1>
      <p className="max-w-prose text-muted">
        This page doesn&rsquo;t exist, or the piece is no longer available.
      </p>
      <Link href="/products" className={buttonVariants({ className: "mt-2" })}>
        Continue shopping
      </Link>
    </Section>
  );
}

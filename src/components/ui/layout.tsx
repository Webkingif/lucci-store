import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ContainerProps = ComponentProps<"div"> & {
  /** Constrain to a readable line length instead of the page width. */
  prose?: boolean;
};

/** Page-width wrapper with fluid side gutters. */
export function Container({ prose, className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("container-page", prose && "max-w-prose", className)}
      {...props}
    />
  );
}

type SectionProps = ComponentProps<"section"> & {
  /** Draw a hairline above the section. */
  divided?: boolean;
};

/** Vertical rhythm block; combine with `container-page` or nest a Container. */
export function Section({ divided, className, ...props }: SectionProps) {
  return (
    <section
      className={cn("section-y", divided && "border-t", className)}
      {...props}
    />
  );
}

/** Small uppercase label above headings or on product tiles. */
export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("eyebrow", className)} {...props} />;
}

type PageIntroProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  /** Short trailing note, e.g. a result count. */
  meta?: string;
};

/** Page title block: modest headline with optional meta aligned to the end. */
export function PageIntro({
  eyebrow,
  title,
  description,
  meta,
}: PageIntroProps) {
  return (
    <header className="container-page flex flex-col gap-4 pt-10 pb-8 sm:flex-row sm:items-end sm:justify-between lg:pt-16 lg:pb-10">
      <div className="flex flex-col gap-3">
        <Eyebrow className="text-muted">{eyebrow}</Eyebrow>
        <h1 className="font-display text-headline">{title}</h1>
        <p className="max-w-prose text-muted">{description}</p>
      </div>
      {meta && (
        <p className="shrink-0 eyebrow text-muted" aria-live="polite">
          {meta}
        </p>
      )}
    </header>
  );
}

type SectionHeadingProps = {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  /** Optional "view all" style link aligned to the end. */
  action?: { label: string; href: string };
  className?: string;
};

/**
 * Section title row: optional eyebrow + title, with an optional trailing link.
 * Deliberately modest (text-title): display/headline sizes are reserved for
 * the hero and editorial moments so they keep their weight.
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-6 flex items-end justify-between gap-6 lg:mb-10",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        {eyebrow && <Eyebrow className="text-muted">{eyebrow}</Eyebrow>}
        <h2 id={id} className="font-display text-title">
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className="shrink-0 eyebrow link">
          {action.label}
        </Link>
      )}
    </div>
  );
}

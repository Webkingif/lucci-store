import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

/** Title row for an admin screen, with an optional action on the end. */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        {eyebrow && <Eyebrow className="text-muted">{eyebrow}</Eyebrow>}
        <h1 className="font-display text-title">{title}</h1>
        {description && <p className="max-w-prose text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** Small outlined label for states such as Hidden, Sold out or Paid. */
export function StatusTag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "muted" | "solid" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center border px-2 eyebrow whitespace-nowrap",
        tone === "default" && "border-ink text-ink",
        tone === "muted" && "border-line text-muted",
        tone === "solid" && "border-ink bg-ink text-paper",
        tone === "danger" && "border-danger text-danger",
      )}
    >
      {children}
    </span>
  );
}

/** Hairline table that scrolls sideways on small screens. */
export function AdminTable({
  label,
  head,
  children,
}: {
  label: string;
  head: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto border-t">
      <table
        className="w-full min-w-[44rem] border-collapse text-left"
        aria-label={label}
      >
        <thead className="eyebrow text-muted">
          <tr className="border-b [&>th]:px-3 [&>th]:py-3 [&>th]:font-medium">
            {head}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr>td]:px-3 [&>tr>td]:py-3 [&>tr>td]:align-middle">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 border-t border-b py-16 text-center">
      <p className="font-display text-title">{title}</p>
      {children && <div className="text-muted">{children}</div>}
    </div>
  );
}

export function LoadingRows({ label }: { label: string }) {
  return (
    <p className="border-t py-10 eyebrow text-muted" aria-live="polite">
      Loading {label}…
    </p>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/** Admin timestamps are shown in UTC so everyone reads the same time. */
export function formatDateTime(date: Date) {
  return `${dateFormat.format(date)} UTC`;
}

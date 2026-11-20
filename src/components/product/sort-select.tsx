"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

type SortSelectProps = {
  value: string;
  /** Each option carries its pre-built listing URL. */
  options: readonly { value: string; label: string; href: string }[];
};

/**
 * Text-style sort control: a native <select> laid invisibly over its label,
 * so it reads as a quiet "Sort" link but keeps the platform picker and
 * keyboard behavior. The current choice is spelled out from lg up.
 */
export function SortSelect({ value, options }: SortSelectProps) {
  const router = useRouter();
  const current = options.find((option) => option.value === value);

  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 eyebrow has-focus-visible:outline has-focus-visible:outline-offset-4">
      <span>
        Sort
        <span className="max-lg:sr-only">
          : <span className="text-muted">{current?.label}</span>
        </span>
      </span>
      <ChevronDown aria-hidden className="size-3.5" strokeWidth={1.25} />
      <select
        aria-label="Sort products"
        value={value}
        onChange={(event) => {
          const next = options.find((o) => o.value === event.target.value);
          if (next) router.push(next.href, { scroll: false });
        }}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

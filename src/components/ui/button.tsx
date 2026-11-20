import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const base =
  "eyebrow inline-flex items-center justify-center gap-2 border transition-colors duration-150 ease-standard disabled:pointer-events-none disabled:opacity-40";

const variants = {
  /** Solid ink block: the single main action in a view. */
  primary:
    "border-ink bg-ink text-paper hover:border-ink-soft hover:bg-ink-soft",
  /** Hairline outline: secondary actions. */
  secondary: "border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
  /** For use on top of imagery. */
  inverse:
    "border-paper bg-paper text-ink hover:bg-transparent hover:text-paper",
  /** Underlined text action. */
  text: "link h-auto! border-transparent px-0!",
} as const;

const sizes = {
  sm: "h-9 px-4",
  md: "h-12 px-8",
  lg: "h-14 px-10",
} as const;

type VariantOptions = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
  className?: string;
};

/** Button classes; apply to `<Link>` or `<a>` for link-styled buttons. */
export function buttonVariants({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: VariantOptions = {}) {
  return cn(
    base,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & Omit<VariantOptions, "className">;

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg border-accent hover:bg-accent-hover",
  secondary: "bg-surface text-ink border-border hover:bg-surface-2",
  danger: "bg-danger text-danger-fg border-danger hover:bg-danger-hover",
  ghost: "bg-transparent text-muted border-transparent hover:text-ink",
};

export function buttonClasses(variant: Variant = "primary") {
  return `inline-flex h-10 items-center justify-center gap-2 rounded-control border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-45 ${VARIANT_CLASSES[variant]}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", ...props },
  ref,
) {
  return (
    <button ref={ref} className={`${buttonClasses(variant)} ${className}`} {...props} />
  );
});

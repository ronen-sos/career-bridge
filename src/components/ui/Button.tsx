import { cn } from "@/lib/cn";

type ButtonStyleProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleProps = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50",
    variant === "primary" &&
      "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900",
    variant === "secondary" &&
      "border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50",
    variant === "ghost" && "text-emerald-800 hover:bg-emerald-50",
    size === "sm" && "px-3 py-2 text-sm",
    size === "md" && "px-4 py-3 text-base",
    size === "lg" && "px-5 py-4 text-lg",
    className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyleProps;

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  );
}

type ButtonLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonStyleProps & {
    href: string;
  };

/** Styled anchor for navigation — avoids nested buttons and client-router click issues. */
export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  href,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  );
}

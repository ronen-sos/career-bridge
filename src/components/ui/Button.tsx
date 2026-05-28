import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
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
      )}
      {...props}
    />
  );
}

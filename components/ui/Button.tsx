"use client";

import { forwardRef } from "react";

// ─── Types ────────────────────────────────────────────────────────
type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size    = "xs" | "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

// ─── Styles map ────────────────────────────────────────────────────
const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#F5C400] text-[#1A1A2E] font-semibold hover:bg-[#E8A000] shadow-[0_2px_8px_rgba(245,196,0,.30)] " +
    "active:scale-[.97] disabled:opacity-50",
  secondary:
    "bg-[#FAFAF7] text-[#1A1A2E] border border-[#E5E3DC] hover:bg-[#F5F5F0] hover:border-[#F5C400]/40 " +
    "active:scale-[.97] disabled:opacity-50",
  ghost:
    "bg-transparent text-gray-600 hover:bg-[#FAFAF7] hover:text-[#1A1A2E] " +
    "active:scale-[.97] disabled:opacity-40",
  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow-sm " +
    "active:scale-[.97] disabled:opacity-50",
  outline:
    "bg-white text-[#1A1A2E] border border-[#1A1A2E] hover:bg-[#1A1A2E] hover:text-[#F5C400] " +
    "active:scale-[.97] disabled:opacity-40",
};

const sizeClasses: Record<Size, string> = {
  xs: "h-7  px-2.5 text-xs  rounded-lg  gap-1.5",
  sm: "h-8  px-3   text-xs  rounded-lg  gap-1.5",
  md: "h-9  px-4   text-sm  rounded-xl  gap-2",
  lg: "h-11 px-5   text-sm  rounded-xl  gap-2   font-semibold",
};

// ─── Component ─────────────────────────────────────────────────────
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    iconPosition = "left",
    fullWidth = false,
    children,
    className = "",
    disabled,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-medium",
        "transition-all duration-150 cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C400] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {/* Left icon / spinner */}
      {loading ? (
        <Spinner size={size} />
      ) : (
        icon && iconPosition === "left" && (
          <span className="flex-shrink-0">{icon}</span>
        )
      )}

      {children && <span className={loading ? "opacity-60" : ""}>{children}</span>}

      {/* Right icon */}
      {!loading && icon && iconPosition === "right" && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
});

Button.displayName = "Button";
export default Button;

// ─── Spinner helper ────────────────────────────────────────────────
function Spinner({ size }: { size: Size }) {
  const s = size === "xs" || size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <svg
      className={`${s} animate-spin flex-shrink-0`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

import { forwardRef } from "react";

// ══════════════════════════════════════════════════════════════════
//  Card — generic container
// ══════════════════════════════════════════════════════════════════

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove default padding */
  noPadding?: boolean;
  /** Clickable/hoverable lift effect */
  hoverable?: boolean;
  /** Glass morphism style */
  glass?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { noPadding = false, hoverable = false, glass = false, className = "", children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        "rounded-xl border bg-white shadow-[0_1px_4px_rgba(26,26,46,.07)]",
        "dark:bg-[#1A1A2E] dark:border-[#2e2e4a]",
        noPadding ? "" : "p-5",
        hoverable
          ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(26,26,46,.10)] cursor-pointer"
          : "",
        glass ? "glass" : "border-[#E5E3DC]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
export default Card;

// ══════════════════════════════════════════════════════════════════
//  CardHeader — title + optional action row
// ══════════════════════════════════════════════════════════════════
export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 border-b border-gray-100 pb-4 mb-4 dark:border-[#334155] ${className}`}
    >
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  StatsCard — single KPI tile
// ══════════════════════════════════════════════════════════════════

type StatsColor =
  | "green"
  | "blue"
  | "purple"
  | "amber"
  | "red"
  | "cyan"
  | "gray";

const colorMap: Record<
  StatsColor,
  { bg: string; text: string; iconBg: string; iconText: string; border: string }
> = {
  green:  { bg: "bg-green-50",  text: "text-green-700",  iconBg: "bg-green-100",  iconText: "text-green-600",  border: "border-green-100"  },
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   iconBg: "bg-blue-100",   iconText: "text-blue-600",   border: "border-blue-100"   },
  purple: { bg: "bg-purple-50", text: "text-purple-700", iconBg: "bg-purple-100", iconText: "text-purple-600", border: "border-purple-100" },
  amber:  { bg: "bg-amber-50",  text: "text-amber-700",  iconBg: "bg-amber-100",  iconText: "text-amber-600",  border: "border-amber-100"  },
  red:    { bg: "bg-red-50",    text: "text-red-700",    iconBg: "bg-red-100",    iconText: "text-red-600",    border: "border-red-100"    },
  cyan:   { bg: "bg-cyan-50",   text: "text-cyan-700",   iconBg: "bg-cyan-100",   iconText: "text-cyan-600",   border: "border-cyan-100"   },
  gray:   { bg: "bg-gray-50",   text: "text-gray-700",   iconBg: "bg-gray-100",   iconText: "text-gray-600",   border: "border-gray-200"   },
};

export interface StatsCardProps {
  label: string;
  value: string | number;
  color?: StatsColor;
  icon?: React.ReactNode;
  trend?: { value: number; label?: string };
  className?: string;
}

export function StatsCard({
  label,
  value,
  color = "green",
  icon,
  trend,
  className = "",
}: StatsCardProps) {
  const c = colorMap[color];
  const isPositive = trend && trend.value >= 0;

  return (
    <div
      className={[
        "rounded-xl border p-5",
        c.bg,
        c.border,
        "transition-all duration-150 hover:-translate-y-px hover:shadow-soft",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className={`text-3xl font-bold leading-none ${c.text}`}>{value}</p>
          <p className={`mt-1.5 text-sm font-medium ${c.text} opacity-80`}>{label}</p>
          {trend && (
            <p
              className={`mt-2 text-xs font-medium ${
                isPositive ? "text-green-600" : "text-red-500"
              }`}
            >
              {isPositive ? "▲" : "▼"} {Math.abs(trend.value)}%
              {trend.label && (
                <span className="ml-1 text-gray-400 font-normal">{trend.label}</span>
              )}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${c.iconBg} ${c.iconText}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MenuCard — action shortcut tile (like dashboard menu items)
// ══════════════════════════════════════════════════════════════════

export interface MenuCardProps {
  href: string;
  title: string;
  desc?: string;
  icon?: React.ReactNode | string;
  highlight?: boolean;
  badge?: string;
  className?: string;
}

export function MenuCard({
  href,
  title,
  desc,
  icon,
  highlight = false,
  badge,
  className = "",
}: MenuCardProps) {
  return (
    <a
      href={href}
      className={[
        "group relative block rounded-xl border p-5 shadow-soft-sm",
        "transition-all duration-150 hover:-translate-y-0.5 hover:shadow-soft",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
        highlight
          ? "border-brand-400 bg-green-50 hover:border-brand-500"
          : "border-gray-200 bg-white hover:border-brand-300 dark:bg-[#1e293b] dark:border-[#334155] dark:hover:border-brand-600",
        className,
      ].join(" ")}
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      {icon && (
        <div className="mb-3 text-3xl leading-none">
          {typeof icon === "string" ? icon : icon}
        </div>
      )}
      <p
        className={`font-semibold ${
          highlight ? "text-brand-800" : "text-gray-800 dark:text-gray-100"
        }`}
      >
        {title}
      </p>
      {desc && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{desc}</p>
      )}
      <p
        className={`mt-3 text-xs font-medium transition-colors group-hover:underline ${
          highlight ? "text-brand-600" : "text-blue-600"
        }`}
      >
        เปิด →
      </p>
    </a>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Skeleton — loading placeholder shimmer
// ══════════════════════════════════════════════════════════════════

export interface SkeletonProps {
  className?: string;
  /** Convenience height */
  h?: string;
  /** Convenience width */
  w?: string;
  /** Rounded-full pill shape */
  pill?: boolean;
}

export function Skeleton({ className = "", h, w, pill = false }: SkeletonProps) {
  return (
    <div
      className={[
        "skeleton",
        pill ? "rounded-full" : "rounded-lg",
        h ?? "h-4",
        w ?? "w-full",
        className,
      ].join(" ")}
    />
  );
}

/** Pre-built card skeleton */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-soft-sm dark:bg-[#1e293b] dark:border-[#334155]">
      <Skeleton h="h-5" w="w-1/3" className="mb-4" />
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} h="h-3.5" w={i % 2 === 0 ? "w-full" : "w-4/5"} />
        ))}
      </div>
    </div>
  );
}

/** Pre-built stats row skeleton */
export function StatsRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:bg-[#1e293b] dark:border-[#334155]"
        >
          <Skeleton h="h-8" w="w-16" className="mb-2" />
          <Skeleton h="h-3.5" w="w-3/4" />
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  EmptyState — zero-results placeholder
// ══════════════════════════════════════════════════════════════════

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = "ไม่พบข้อมูล",
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300",
        "bg-gray-50 px-6 py-14 text-center dark:border-[#475569] dark:bg-[#1e293b]",
        className,
      ].join(" ")}
    >
      {icon ? (
        <div className="mb-4 text-4xl leading-none text-gray-300 dark:text-gray-600">
          {icon}
        </div>
      ) : (
        <DefaultEmptyIcon />
      )}
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-gray-400 dark:text-gray-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function DefaultEmptyIcon() {
  return (
    <svg
      className="mb-4 h-12 w-12 text-gray-200 dark:text-gray-600"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      viewBox="0 0 48 48"
    >
      <circle cx="24" cy="24" r="20" />
      <path strokeLinecap="round" d="M24 16v8M24 32h.01" strokeWidth={2} />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Divider
// ══════════════════════════════════════════════════════════════════

export function Divider({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  if (label) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="h-px flex-1 bg-gray-100 dark:bg-[#334155]" />
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
          {label}
        </span>
        <div className="h-px flex-1 bg-gray-100 dark:bg-[#334155]" />
      </div>
    );
  }
  return (
    <hr
      className={`border-0 border-t border-gray-100 dark:border-[#334155] ${className}`}
    />
  );
}

// ══════════════════════════════════════════════════════════════════
//  Spinner — standalone loading indicator
// ══════════════════════════════════════════════════════════════════

export function Spinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const s = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" }[size];
  return (
    <svg
      className={`animate-spin text-brand-600 ${s} ${className}`}
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

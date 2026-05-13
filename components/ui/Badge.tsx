// ══════════════════════════════════════════════════════════════════
//  Badge — status tag / label chip
// ══════════════════════════════════════════════════════════════════

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "draft"
  | "submitted"
  | "approved"
  | "active"
  | "closed";

const badgeVariants: Record<BadgeVariant, string> = {
  default:   "bg-gray-100   text-gray-700   border-gray-200",
  success:   "bg-green-100  text-green-700  border-green-200",
  warning:   "bg-amber-100  text-amber-700  border-amber-200",
  danger:    "bg-red-100    text-red-700    border-red-200",
  info:      "bg-blue-100   text-blue-700   border-blue-200",
  purple:    "bg-purple-100 text-purple-700 border-purple-200",
  draft:     "bg-gray-100   text-gray-600   border-gray-200",
  submitted: "bg-blue-100   text-blue-700   border-blue-200",
  approved:  "bg-green-100  text-green-700  border-green-200",
  active:    "bg-green-100  text-green-700  border-green-200",
  closed:    "bg-gray-100   text-gray-500   border-gray-200",
};

const dotColors: Record<BadgeVariant, string> = {
  default:   "bg-gray-400",
  success:   "bg-green-500",
  warning:   "bg-amber-500",
  danger:    "bg-red-500",
  info:      "bg-blue-500",
  purple:    "bg-purple-500",
  draft:     "bg-gray-400",
  submitted: "bg-blue-500",
  approved:  "bg-green-500",
  active:    "bg-green-500",
  closed:    "bg-gray-400",
};

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({
  variant = "default",
  children,
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-xs font-semibold leading-none",
        badgeVariants[variant],
        className,
      ].join(" ")}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  );
}

/** Convenience: map DB status strings → badge variant */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    draft:     "draft",
    submitted: "submitted",
    approved:  "approved",
    reopened:  "warning",
    active:    "active",
    closed:    "closed",
  };
  const labels: Record<string, string> = {
    draft:     "ฉบับร่าง",
    submitted: "ส่งแล้ว",
    approved:  "อนุมัติแล้ว",
    reopened:  "เปิดใหม่",
    active:    "กำลังเปิด",
    closed:    "ปิดแล้ว",
  };
  const variant = map[status] ?? "default";
  return (
    <Badge variant={variant} dot>
      {labels[status] ?? status}
    </Badge>
  );
}

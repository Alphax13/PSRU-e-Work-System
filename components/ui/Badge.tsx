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
  success:   "bg-[#FFFDE7]  text-[#7a5c00]  border-[#F5C400]/30",
  warning:   "bg-[#FFF9C4]  text-[#7a5c00]  border-[#F5C400]/30",
  danger:    "bg-red-100    text-red-700    border-red-200",
  info:      "bg-[#FAFAF7]  text-[#1A1A2E]  border-[#E5E3DC]",
  purple:    "bg-purple-100 text-purple-700 border-purple-200",
  draft:     "bg-[#FAFAF7]  text-gray-500   border-[#E5E3DC]",
  submitted: "bg-[#FFF9C4]  text-[#7a5c00]  border-[#F5C400]/40",
  approved:  "bg-[#FFFDE7]  text-[#7a5c00]  border-[#F5C400]/30",
  active:    "bg-[#1A1A2E]  text-[#F5C400]  border-[#1A1A2E]",
  closed:    "bg-gray-100   text-gray-500   border-gray-200",
};

const dotColors: Record<BadgeVariant, string> = {
  default:   "bg-gray-400",
  success:   "bg-green-500",
  warning:   "bg-[#F5C400]",
  danger:    "bg-red-500",
  info:      "bg-blue-500",
  purple:    "bg-purple-500",
  draft:     "bg-gray-300",
  submitted: "bg-[#F5C400]",
  approved:  "bg-green-500",
  active:    "bg-[#F5C400]",
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

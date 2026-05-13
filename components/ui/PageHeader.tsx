// ══════════════════════════════════════════════════════════════════
//  PageHeader — consistent page title block
// ══════════════════════════════════════════════════════════════════

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Slot for action buttons (right side) */
  action?: React.ReactNode;
  /** Optional breadcrumb list: [{ label, href? }] */
  breadcrumb?: { label: string; href?: string }[];
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  breadcrumb,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-300">/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-brand-700 transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-700 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Alert — contextual notification strip
// ══════════════════════════════════════════════════════════════════

type AlertVariant = "info" | "success" | "warning" | "danger";

const alertStyles: Record<AlertVariant, string> = {
  info:    "border-blue-200   bg-blue-50   text-blue-800",
  success: "border-green-200  bg-green-50  text-green-800",
  warning: "border-amber-200  bg-amber-50  text-amber-800",
  danger:  "border-red-200    bg-red-50    text-red-800",
};

const alertIcons: Record<AlertVariant, string> = {
  info:    "ℹ️",
  success: "✅",
  warning: "⚠️",
  danger:  "❌",
};

export interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function Alert({
  variant = "info",
  children,
  icon,
  className = "",
}: AlertProps) {
  return (
    <div
      className={[
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
        alertStyles[variant],
        className,
      ].join(" ")}
    >
      <span className="mt-px flex-shrink-0 text-base leading-none">
        {icon ?? alertIcons[variant]}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SectionGroup — label + children block
// ══════════════════════════════════════════════════════════════════

export function SectionGroup({
  title,
  children,
  className = "",
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-3 ${className}`}>
      <h3 className="section-title">{title}</h3>
      {children}
    </section>
  );
}

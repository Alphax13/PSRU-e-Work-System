"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

/* ── Types ─────────────────────────────────────────────────── */
type ToastType = "success" | "error" | "info" | "warning";

interface ToastOpts {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem extends Required<ToastOpts> {
  id: number;
}

interface ToastContextValue {
  toast: (opts: ToastOpts) => void;
}

/* ── Context ────────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

/* ── Provider ───────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback(({ message, type = "success", duration = 3500 }: ToastOpts) => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, message, type, duration }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* ── Toast list — fixed bottom-right ─── */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2.5"
      >
        {toasts.map((t) => (
          <ToastBubble key={t.id} {...t} onDismiss={() => setToasts((x) => x.filter((i) => i.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ── Single toast bubble ────────────────────────────────────── */
const CONFIG: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-white",
    border: "border-green-200",
    icon: (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm">
        ✓
      </span>
    ),
  },
  error: {
    bg: "bg-white",
    border: "border-red-200",
    icon: (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-sm font-bold">
        ✕
      </span>
    ),
  },
  warning: {
    bg: "bg-white",
    border: "border-[#F5C400]/50",
    icon: (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFFDE7] text-[#7a5c00] text-sm font-bold">
        !
      </span>
    ),
  },
  info: {
    bg: "bg-white",
    border: "border-blue-200",
    icon: (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
        i
      </span>
    ),
  },
};

function ToastBubble({
  message,
  type,
  duration,
  onDismiss,
}: ToastItem & { onDismiss: () => void }) {
  const { bg, border, icon } = CONFIG[type];
  return (
    <div
      className={`pointer-events-auto flex min-w-72 max-w-sm items-start gap-3 rounded-xl border ${border} ${bg} px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,.12)] animate-in slide-in-from-right-4 fade-in duration-300`}
      style={{ "--duration": `${duration}ms` } as React.CSSProperties}
    >
      {icon}
      <p className="flex-1 text-sm font-medium text-gray-800 leading-snug pt-0.5">{message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 text-gray-300 hover:text-gray-500 text-lg leading-none"
        aria-label="ปิด"
      >
        ×
      </button>
    </div>
  );
}

/* ── Hook ───────────────────────────────────────────────────── */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

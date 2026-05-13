import { forwardRef } from "react";

// ══════════════════════════════════════════════════════════════════
//  Input — text field with optional leading/trailing icon
// ══════════════════════════════════════════════════════════════════

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leadingIcon,
    trailingIcon,
    fullWidth = true,
    className = "",
    id,
    ...props
  },
  ref,
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-semibold text-[#1A1A2E] dark:text-[#F0F0F0]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leadingIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {leadingIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={[
            "block rounded-xl border bg-white text-sm text-[#1C1C1C]",
            "placeholder:text-gray-400",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]",
            "disabled:bg-[#FAFAF7] disabled:text-gray-400 disabled:cursor-not-allowed",
            error
              ? "border-red-400 focus:ring-red-400 focus:border-red-400"
              : "border-[#E5E3DC] hover:border-[#F5C400]/40",
            leadingIcon ? "pl-10" : "pl-3",
            trailingIcon ? "pr-10" : "pr-3",
            "py-2.5",
            fullWidth ? "w-full" : "",
            "dark:bg-[#1A1A2E] dark:border-[#2e2e4a] dark:text-[#F0F0F0] dark:placeholder:text-gray-500",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />

        {trailingIcon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            {trailingIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";
export default Input;

// ══════════════════════════════════════════════════════════════════
//  Select — styled dropdown
// ══════════════════════════════════════════════════════════════════

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, hint, error, fullWidth = true, className = "", id, children, ...props },
    ref,
  ) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-semibold text-[#1A1A2E] dark:text-[#F0F0F0]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={[
            "block rounded-xl border bg-white text-sm text-[#1C1C1C]",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]",
            "disabled:bg-[#FAFAF7] disabled:text-gray-400 disabled:cursor-not-allowed",
            error ? "border-red-400" : "border-[#E5E3DC] hover:border-[#F5C400]/40",
            "px-3 py-2.5",
            fullWidth ? "w-full" : "",
            "dark:bg-[#1A1A2E] dark:border-[#2e2e4a] dark:text-[#F0F0F0]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
    );
  },
);

// ══════════════════════════════════════════════════════════════════
//  Textarea
// ══════════════════════════════════════════════════════════════════

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, error, fullWidth = true, className = "", id, ...props },
    ref,
  ) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-semibold text-[#1A1A2E] dark:text-[#F0F0F0]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={[
            "block rounded-xl border bg-white text-sm text-[#1C1C1C]",
            "placeholder:text-gray-400 resize-y",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]",
            "disabled:bg-[#FAFAF7] disabled:text-gray-400 disabled:cursor-not-allowed",
            error ? "border-red-400" : "border-[#E5E3DC] hover:border-[#F5C400]/40",
            "px-3 py-2.5",
            fullWidth ? "w-full" : "",
            "dark:bg-[#1A1A2E] dark:border-[#2e2e4a] dark:text-[#F0F0F0] dark:placeholder:text-gray-500",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
    );
  },
);

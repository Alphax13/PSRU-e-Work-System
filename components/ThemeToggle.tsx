"use client";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      title={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
      aria-label={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
      className={`relative flex h-7 w-[52px] flex-shrink-0 cursor-pointer items-center rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C400] focus-visible:ring-offset-1 ${
        isDark
          ? "border-[#F5C400]/25 bg-[#0e0e1a]"
          : "border-[#E0DDD5] bg-[#EFEDE7]"
      }`}
    >
      {/* Sun — shows on left when light mode */}
      <span
        className={`pointer-events-none absolute left-[6px] flex items-center transition-all duration-300 ${
          isDark ? "scale-75 opacity-20" : "scale-100 opacity-70"
        }`}
      >
        <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </span>

      {/* Moon — shows on right when dark mode */}
      <span
        className={`pointer-events-none absolute right-[6px] flex items-center transition-all duration-300 ${
          isDark ? "scale-100 opacity-80" : "scale-75 opacity-25"
        }`}
      >
        <svg className="h-3 w-3 text-[#F5C400]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </span>

      {/* Sliding knob */}
      <span
        className={`pointer-events-none absolute h-5 w-5 rounded-full transition-all duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
          isDark
            ? "translate-x-[27px] bg-[#F5C400] shadow-[0_1px_6px_rgba(245,196,0,.5)]"
            : "translate-x-[2px] bg-white shadow-[0_1px_4px_rgba(0,0,0,.15)]"
        }`}
      />
    </button>
  );
}

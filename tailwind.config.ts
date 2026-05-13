import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Design Tokens ─────────────────────────────────────
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Brand palette (PSRU green)
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",  // primary
          800: "#166534",  // dark
          900: "#14532d",
          950: "#052e16",
        },

        // Surface / neutral
        surface: {
          DEFAULT: "#ffffff",
          muted:   "#f9fafb",
          subtle:  "#f1f5f9",
        },

        // Semantic
        muted: {
          DEFAULT:    "#6b7280",
          foreground: "#9ca3af",
        },
      },

      // ── Font ──────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-kanit)", "Kanit", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      // ── Border Radius ─────────────────────────────────────
      borderRadius: {
        "4xl": "2rem",
      },

      // ── Box Shadows ───────────────────────────────────────
      boxShadow: {
        "soft-sm": "0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.04)",
        soft:      "0 4px 12px -2px rgba(0,0,0,.08), 0 2px 4px -1px rgba(0,0,0,.04)",
        "soft-lg": "0 10px 30px -4px rgba(0,0,0,.10), 0 4px 8px -2px rgba(0,0,0,.05)",
        "soft-xl": "0 20px 50px -8px rgba(0,0,0,.14), 0 8px 16px -4px rgba(0,0,0,.06)",
        brand:     "0 4px 14px 0 rgba(21,128,61,.30)",
        "inner-sm":"inset 0 1px 3px rgba(0,0,0,.06)",
      },

      // ── Animations ────────────────────────────────────────
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: ".6" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        "bounce-in": {
          "0%":   { transform: "scale(.92)", opacity: "0" },
          "60%":  { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in":    "fade-in  .25s ease-out both",
        "fade-up":    "fade-up  .3s  ease-out both",
        shimmer:      "shimmer  1.6s linear infinite",
        "pulse-soft": "pulse-soft 2s  ease-in-out infinite",
        "slide-in":   "slide-in  .28s ease-out",
        "bounce-in":  "bounce-in .35s ease-out both",
      },

      // ── Transitions ───────────────────────────────────────
      transitionTimingFunction: {
        smooth: "cubic-bezier(.4,0,.2,1)",
        spring: "cubic-bezier(.34,1.56,.64,1)",
      },

      // ── Spacing ───────────────────────────────────────────
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "18":  "4.5rem",
      },

      // ── Container ─────────────────────────────────────────
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },

      // ── Backdrop blur ─────────────────────────────────────
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;

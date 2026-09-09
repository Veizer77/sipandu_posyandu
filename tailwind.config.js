/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0284c7", // Medical Cerulean Blue dari palang & teks logo
          hover: "#0369a1",
          light: "#e0f2fe",
          50: "#f0f9ff",
        },
        secondary: {
          DEFAULT: "#16a34a", // Fresh Herbal Leaf Green dari elemen daun logo
          hover: "#15803d",
          light: "#dcfce7",
          50: "#f0fdf4",
        },
        status: {
          baik: "#16a34a",
          kurang: "#d97706",
          buruk: "#dc2626",
          lebih: "#4f46e5",
        },
        risiko: {
          danger: "#dc2626",
          warning: "#d97706",
          info: "#0284c7",
        },
        background: "#FDFBF7",
        foreground: "#0F172A",
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        olive: {
          50: "#f7fee7",
          100: "#ecfccb",
          200: "#d9f99d",
          300: "#bef264",
          400: "#a3e635",
          500: "#8db600",
          600: "#65a30d",
          700: "#4d7c0f",
          800: "#3f6212",
          900: "#365314",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 2px 10px rgba(0,0,0,0.02), 0 10px 30px rgba(0,0,0,0.04)",
        "double-bezel": "0 0 0 1px rgba(0,0,0,0.05), 0 20px 40px -15px rgba(0,0,0,0.07)",
        "inner-glow": "inset 0 1px 1px rgba(255,255,255,0.7)",
      },
      transitionTimingFunction: {
        "smooth-spring": "cubic-bezier(0.16, 1, 0.3, 1)",
        "apple-ease": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};

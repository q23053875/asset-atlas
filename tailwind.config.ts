import type { Config } from "tailwindcss";
const config: Config = { darkMode: ["class"], content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { canvas: "hsl(var(--canvas))", panel: "hsl(var(--panel))", ink: "hsl(var(--ink))", muted: "hsl(var(--muted))", line: "hsl(var(--line))", accent: "hsl(var(--accent))" } } }, plugins: [] };
export default config;

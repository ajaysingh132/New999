import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { navy: "#0b1f3a", royal: "#1f4e9c", orange: "#f2731d" } } },
  plugins: []
};
export default config;
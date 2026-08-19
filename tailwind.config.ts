import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { verse: {blue:"#2563eb",purple:"#6d28d9",ink:"#06142f"} } } }, plugins: [] };
export default config;

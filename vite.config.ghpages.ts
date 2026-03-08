import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// Separate Vite config for GitHub Pages deployment.
// Uses /INR-Auto-Expense-Tracker/ as the base path to match the repo name.
// The main vite.config.ts stays at base '/' for Netlify.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/INR-Auto-Expense-Tracker/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});


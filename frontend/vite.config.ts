/// <reference types="vitest/config" />
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("lottie-react") ||
            id.includes("lottie-web")
          ) {
            return "vendor-lottie";
          }
          if (
            id.includes("@radix-ui") ||
            id.includes("/radix-ui/") ||
            id.includes("cmdk") ||
            id.includes("react-hook-form") ||
            id.includes("@hookform/resolvers") ||
            id.includes("/zod/") ||
            id.includes("react-day-picker")
          ) {
            return "vendor-forms";
          }
          if (
            id.includes("framer-motion") ||
            id.includes("/gsap/") ||
            id.includes("@gsap/react") ||
            id.includes("embla-carousel")
          ) {
            return "vendor-motion";
          }
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("react-router") ||
            id.includes("@tanstack/react-query") ||
            id.includes("/zustand/") ||
            id.includes("/axios/")
          ) {
            return "vendor-react";
          }
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
    include: ["test/unit/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/**/*.d.ts",
      ],
    },
  },
});

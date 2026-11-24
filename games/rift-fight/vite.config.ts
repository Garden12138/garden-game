import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    proxy: {
      "/ddragon": {
        target: "https://ddragon.leagueoflegends.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ddragon/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
  },
});

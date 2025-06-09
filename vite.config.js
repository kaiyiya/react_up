import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    open: true, // 自动打开浏览器
  },
  esbuild: {
    loader: "jsx",
  },
});

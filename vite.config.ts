import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/hinge-torque-simulator/",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
});

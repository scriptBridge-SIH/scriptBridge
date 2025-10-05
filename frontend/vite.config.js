import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/", // ensures correct asset paths on Render
  plugins: [react()],
});

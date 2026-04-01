import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["unit/**/*.test.ts", "unit/**/*.test.tsx"],
    exclude: ["node_modules", "dist"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/dashboard/src"),
      "@whatsapp-ai/security": path.resolve(
        __dirname,
        "./packages/security/src",
      ),
      "@whatsapp-ai/common": path.resolve(__dirname, "./packages/common/src"),
      "@whatsapp-ai/database": path.resolve(
        __dirname,
        "./packages/database/src",
      ),
    },
  },
});

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "react-native": path.resolve(process.cwd(), "src/tests/mocks/react-native.ts"),
    },
  },
});

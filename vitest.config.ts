import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    pool: "threads",
    // Each jsdom worker costs ~9s of startup; on a 2-4 core box the default
    // "one worker per test file" starves the api/openrouter tests and random
    // cases time out (observed: different failing test on every run, all green
    // when that file runs alone). Cap fan-out instead of raising timeouts.
    maxWorkers: 4,
  },
});

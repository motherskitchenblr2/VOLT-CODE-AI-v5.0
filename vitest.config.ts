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
    // App.test.tsx renders the whole app in jsdom and sits right on the 5s
    // default (measured 5.04s on a 2-core box). 15s keeps the gate honest
    // without turning a slow machine into a red PR.
    testTimeout: 15000,
  },
});

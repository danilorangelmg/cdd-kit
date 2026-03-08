import { defineConfig } from "tsup";
import { cpSync } from "node:fs";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node18",
    outDir: "dist",
    clean: true,
    dts: true,
    sourcemap: true,
    banner: {
      js: "#!/usr/bin/env node",
    },
    onSuccess: async () => {
      cpSync("src/templates", "dist/templates", { recursive: true });
    },
  },
  {
    entry: ["src/api.ts"],
    format: ["esm"],
    target: "node18",
    outDir: "dist",
    clean: false,
    dts: true,
    sourcemap: true,
  },
]);

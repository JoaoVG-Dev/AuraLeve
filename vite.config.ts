import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, mergeConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const envDefine: Record<string, string> = {};
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");

  for (const [key, value] of Object.entries(loadedEnv)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return mergeConfig(
    {
      server: {
        host: "::",
        port: 8080,
        watch: {
          awaitWriteFinish: {
            stabilityThreshold: 1000,
            pollInterval: 100,
          },
        },
      },
    },
    {
      define: envDefine,
      plugins: [
        tailwindcss(),
        tsConfigPaths({ projects: ["./tsconfig.json"] }),
        tanstackStart({
          server: { entry: "server" },
          importProtection: {
            behavior: "error",
            client: {
              files: ["**/server/**"],
              specifiers: ["server-only"],
            },
          },
        }),
        nitro(),
        viteReact(),
      ],
      resolve: {
        alias: {
          "@": resolve(rootDir, "src"),
        },
        dedupe: [
          "react",
          "react-dom",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "@tanstack/react-query",
          "@tanstack/query-core",
        ],
      },
    },
  );
});

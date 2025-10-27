#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function runCli(argv: string[]) {
  const command = argv[2];
  const scripts: Record<string, string> = {
    "bundle-check": resolve(__dirname, "../../tooling/scripts/bundle-check.mjs"),
    sbom: resolve(__dirname, "../../tooling/scripts/sbom.mjs"),
    provenance: resolve(__dirname, "../../tooling/scripts/provenance.mjs")
  };

  if (!command || !scripts[command]) {
    console.error(`Unknown command: ${command}`);
    return 1;
  }

  const result = spawnSync("node", [scripts[command]], { stdio: "inherit" });
  return result.status ?? 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCli(process.argv));
}

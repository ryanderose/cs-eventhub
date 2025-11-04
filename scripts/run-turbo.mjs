#!/usr/bin/env node

/**
 * Loads Turbo environment variables from local env files before invoking Turbo.
 * This avoids needing the macOS keychain by providing TURBO_TOKEN and TURBO_TEAM directly.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const envFiles = [".env.turbo", ".env.turbo.local", "env.turbo"];
const defaultCertPath = "/etc/ssl/cert.pem";

for (const name of envFiles) {
  const filePath = resolve(repoRoot, name);
  if (!existsSync(filePath)) {
    continue;
  }

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    if (line.startsWith("export ")) {
      line = line.slice(7).trim();
    }

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    if (!key || key.startsWith("#")) {
      continue;
    }

    let value = line.slice(eqIndex + 1).trim();
    const isQuoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));

    if (isQuoted) {
      value = value.slice(1, -1);
    } else {
      const hashIndex = value.indexOf("#");
      if (hashIndex !== -1) {
        value = value.slice(0, hashIndex).trimEnd();
      }
    }

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

if (!process.env.TURBO_TOKEN || !process.env.TURBO_TEAM) {
  console.error(
    "[turbo] Warning: TURBO_TOKEN or TURBO_TEAM is not set. Turbo remote caching may fail."
  );
}

if (!process.env.SSL_CERT_FILE && existsSync(defaultCertPath)) {
  process.env.SSL_CERT_FILE = defaultCertPath;
}

const result = spawnSync(
  "pnpm",
  ["exec", "turbo", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: process.env,
  }
);

process.exit(result.status ?? 1);

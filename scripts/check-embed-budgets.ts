#!/usr/bin/env tsx
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type BundleStat = {
  gzipBytes: number;
  limitBytes: number;
  ok: boolean;
};

type BundlePhase = {
  esm: BundleStat;
  umd: BundleStat;
  block: BundleStat;
};

type ManifestBundleReport = {
  phaseA: BundlePhase;
  phaseB: BundlePhase;
};

type ManifestFile = {
  version: string;
  bundleReport?: ManifestBundleReport;
};

const MANIFEST_PATH = path.resolve('apps/cdn/public/hub-embed@latest/manifest.json');
const REPORT_DIR = path.resolve('bundle-reports');
const REPORT_FILE = path.join(REPORT_DIR, 'embed-budgets.json');

function summarizePhase(name: string, phase: BundlePhase) {
  return Object.entries(phase).map(([kind, stat]) => ({
    phase: name,
    kind,
    gzipBytes: stat.gzipBytes,
    limitBytes: stat.limitBytes,
    ok: stat.ok
  }));
}

async function loadManifest(): Promise<ManifestFile> {
  const raw = await readFile(MANIFEST_PATH, 'utf-8');
  return JSON.parse(raw) as ManifestFile;
}

async function writeReport(entries: Array<{ phase: string; kind: string; gzipBytes: number; limitBytes: number; ok: boolean }>) {
  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(REPORT_FILE, JSON.stringify(entries, null, 2));
}

function printTable(entries: Array<{ phase: string; kind: string; gzipBytes: number; limitBytes: number; ok: boolean }>) {
  const rows = entries.map((entry) => ({
    phase: entry.phase,
    bundle: entry.kind,
    gzipKB: (entry.gzipBytes / 1024).toFixed(2),
    limitKB: (entry.limitBytes / 1024).toFixed(2),
    status: entry.ok ? 'ok' : 'fail'
  }));
  console.table(rows);
}

async function main() {
  try {
    const manifest = await loadManifest();
    if (!manifest.bundleReport) {
      throw new Error('Manifest missing bundleReport. Run pnpm publish:embed first.');
    }
    const entries = [
      ...summarizePhase('Phase A', manifest.bundleReport.phaseA),
      ...summarizePhase('Phase B', manifest.bundleReport.phaseB)
    ];
    await writeReport(entries);
    printTable(entries);

    const phaseAErrors = entries.filter((entry) => entry.phase === 'Phase A' && !entry.ok);
    const phaseBWarnings = entries.filter((entry) => entry.phase === 'Phase B' && !entry.ok);

    if (phaseBWarnings.length) {
      console.warn('Phase B targets exceeded:');
      phaseBWarnings.forEach((entry) => {
        console.warn(`- ${entry.kind}: ${(entry.gzipBytes / 1024).toFixed(2)} kB > ${(entry.limitBytes / 1024).toFixed(2)} kB`);
      });
    }

    if (phaseAErrors.length) {
      console.error('Phase A bundle budgets exceeded:');
      phaseAErrors.forEach((entry) => {
        console.error(`- ${entry.kind}: ${(entry.gzipBytes / 1024).toFixed(2)} kB > ${(entry.limitBytes / 1024).toFixed(2)} kB`);
      });
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

main();

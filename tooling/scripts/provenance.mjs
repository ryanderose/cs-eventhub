#!/usr/bin/env node
import fs from 'node:fs';

fs.mkdirSync('provenance', { recursive: true });
fs.writeFileSync(
  'provenance/attestation.json',
  JSON.stringify({ level: 'SLSA-2', statement: 'stub attestation' }, null, 2)
);

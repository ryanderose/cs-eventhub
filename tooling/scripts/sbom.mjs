#!/usr/bin/env node
import fs from 'node:fs';

fs.mkdirSync('.sbom', { recursive: true });
fs.writeFileSync(
  '.sbom/sbom.json',
  JSON.stringify({ generatedAt: new Date().toISOString(), tool: 'preseed-stub', components: [] }, null, 2)
);

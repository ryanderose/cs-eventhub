import { defineConfig } from 'tsup';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'esbuild';
import { baseTokens, createRootTokenCss } from './src/theme';

const distDir = path.resolve(__dirname, 'dist');

const emitTokensCss = (): Plugin => ({
  name: 'emit-tokens-css',
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length > 0) {
        return;
      }
      const css = createRootTokenCss(baseTokens);
      await mkdir(distDir, { recursive: true });
      await writeFile(path.join(distDir, 'tokens.css'), css, 'utf8');
    });
  }
});

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    sourcemap: true,
    clean: true,
    minify: false,
    splitting: false,
    outDir: 'dist',
    esbuildPlugins: [emitTokensCss()],
    esbuildOptions(options) {
      options.outExtension = { '.js': '.esm.js' };
      options.platform = 'browser';
    }
  },
  {
    entry: { 'hub-embed': 'src/index.ts' },
    format: ['iife'],
    sourcemap: true,
    clean: false,
    minify: true,
    splitting: false,
    outDir: 'dist',
    globalName: 'EventsHubEmbed',
    esbuildPlugins: [emitTokensCss()],
    esbuildOptions(options) {
      options.outExtension = { '.js': '.umd.js' };
      options.platform = 'browser';
    }
  }
]);

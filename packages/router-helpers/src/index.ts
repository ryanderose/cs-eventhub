import type { PageDoc } from '@events-hub/page-schema';

type ZstdModule = {
  compress(data: Uint8Array, level?: number): Uint8Array;
  decompress(data: Uint8Array): Uint8Array;
};

type BrotliModule = {
  brotliCompressSync(input: Buffer, options?: unknown): Buffer;
  brotliDecompressSync(input: Buffer): Buffer;
};

let zstd: ZstdModule | null | undefined;
let brotli: BrotliModule | null | undefined;

function toBase64UrlBuffer(buffer: Uint8Array) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64UrlBuffer(payload: string): Buffer {
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  return Buffer.from(padded, 'base64');
}

function loadZstd(): ZstdModule | null {
  if (zstd !== undefined) return zstd;
  const req: ((id: string) => any) | null = (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      return Function('return typeof require === "function" ? require : null')();
    } catch (error) {
      if (process.env.DEBUG?.includes('router-helpers')) {
        console.warn('Failed to access require for zstd loader', error);
      }
      return null;
    }
  })();
  if (!req) {
    zstd = null;
    return zstd;
  }
  try {
    // Attempt to load a native zstd binding if present. Optional dependency.
    const module = req('@napi-rs/zstd') as { compress: (input: Buffer, level?: number) => Buffer; decompress: (input: Buffer) => Buffer };
    zstd = {
      compress(data, level) {
        return module.compress(Buffer.from(data), level);
      },
      decompress(data) {
        return module.decompress(Buffer.from(data));
      }
    };
    return zstd;
  } catch (error) {
    if (process.env.DEBUG?.includes('router-helpers')) {
      console.warn('Falling back to Brotli compression for plan encoding', error);
    }
    zstd = null;
    return zstd;
  }
}

function loadBrotli(): BrotliModule | null {
  if (brotli !== undefined) return brotli;
  const req: ((id: string) => any) | null = (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      return Function('return typeof require === "function" ? require : null')();
    } catch (error) {
      if (process.env.DEBUG?.includes('router-helpers')) {
        console.warn('Failed to access require for brotli loader', error);
      }
      return null;
    }
  })();
  if (!req) {
    brotli = null;
    return brotli;
  }
  try {
    const module = req('node:zlib') as Partial<BrotliModule> | undefined;
    if (!module?.brotliCompressSync || !module?.brotliDecompressSync) {
      brotli = null;
      return brotli;
    }
    brotli = {
      brotliCompressSync: module.brotliCompressSync.bind(module),
      brotliDecompressSync: module.brotliDecompressSync.bind(module)
    };
    return brotli;
  } catch (error) {
    if (process.env.DEBUG?.includes('router-helpers')) {
      console.warn('Falling back to plain encoding for plan encoding', error);
    }
    brotli = null;
    return brotli;
  }
}

export function encodePlan(page: PageDoc): string {
  const json = JSON.stringify(page);
  const encoder = loadZstd();
  const inputBuffer = Buffer.from(json);
  if (encoder) {
    const compressed = encoder.compress(inputBuffer, 3);
    return `z:${toBase64UrlBuffer(compressed)}`;
  }
  const brotliModule = loadBrotli();
  if (brotliModule) {
    const compressed = brotliModule.brotliCompressSync(inputBuffer, { params: { 1: 5 } });
    return `b:${toBase64UrlBuffer(compressed)}`;
  }
  return `p:${toBase64UrlBuffer(inputBuffer)}`;
}

export function decodePlan(plan: string): PageDoc {
  const [mode, payload] = plan.includes(':') ? (plan.split(':', 2) as [string, string]) : ['p', plan];
  const buffer = fromBase64UrlBuffer(payload);
  if (mode === 'z') {
    const encoder = loadZstd();
    if (!encoder) {
      throw new Error('Zstd encoded plan provided but zstd module not available');
    }
    const decompressed = encoder.decompress(buffer);
    return JSON.parse(Buffer.from(decompressed).toString('utf8')) as PageDoc;
  }
  if (mode === 'b') {
    const brotliModule = loadBrotli();
    if (!brotliModule) {
      throw new Error('Brotli encoded plan provided but brotli module not available');
    }
    const decompressed = brotliModule.brotliDecompressSync(buffer);
    return JSON.parse(decompressed.toString('utf8')) as PageDoc;
  }
  return JSON.parse(Buffer.from(buffer).toString('utf8')) as PageDoc;
}

export function resolvePlanFromUrl(searchParams: URLSearchParams): string | undefined {
  return searchParams.get('plan') ?? searchParams.get('p') ?? undefined;
}

export function canonicalizePath(path: string): string {
  return path.replace(/\/+/, '/');
}

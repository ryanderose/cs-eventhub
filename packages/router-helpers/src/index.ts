import type { PageDoc } from '@events-hub/page-schema';

export type HistoryMode = 'query' | 'hash' | 'none' | 'path';

export type RouteView = 'list' | 'detail';

export type RouteTemplates = {
  list: string;
  detail: string;
};

export type RouteTemplateOptions = {
  basePath?: string;
  routes?: Partial<RouteTemplates>;
};

export type RouteMatch = {
  view: RouteView;
  slug?: string;
  pathname: string;
};

export type LocationLike = {
  pathname: string;
  search?: string;
  hash?: string;
};

export type RouteSnapshot = RouteMatch & {
  url: string;
};

export type RouteTakeoverMode = 'none' | 'container' | 'document';

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

function replaceAllLiteral(value: string, search: string, replacement: string): string {
  if (!value.length || search === replacement || !value.includes(search)) {
    return value;
  }
  return value.split(search).join(replacement);
}

function trimTrailingChar(value: string, charCode: number): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === charCode) {
    end--;
  }
  return end === value.length ? value : value.slice(0, end);
}

function toBase64UrlBuffer(buffer: Uint8Array) {
  const base64 = Buffer.from(buffer).toString('base64');
  const swapped = replaceAllLiteral(replaceAllLiteral(base64, '+', '-'), '/', '_');
  return trimTrailingChar(swapped, '='.charCodeAt(0));
}

function fromBase64UrlBuffer(payload: string): Buffer {
  const normalizedPayload = payload.trim();
  let normalized = replaceAllLiteral(replaceAllLiteral(normalizedPayload, '-', '+'), '_', '/');
  const remainder = normalized.length % 4;
  if (remainder > 0) {
    normalized = normalized.padEnd(normalized.length + (4 - remainder), '=');
  }
  return Buffer.from(normalized, 'base64');
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
  if (!path.length) {
    return path;
  }
  let result = '';
  let previousWasSlash = false;
  for (let index = 0; index < path.length; index += 1) {
    const char = path[index];
    if (char === '/') {
      if (previousWasSlash) {
        continue;
      }
      previousWasSlash = true;
    } else {
      previousWasSlash = false;
    }
    result += char;
  }
  return result;
}

const DEFAULT_BASE_PATH = '/events';

function ensureLeadingSlash(path: string): string {
  if (!path.startsWith('/')) {
    return `/${path}`;
  }
  return path;
}

function stripTrailingSlash(path: string): string {
  if (path === '/' || path.length === 0) {
    return path || '/';
  }
  let end = path.length;
  while (end > 0 && path.charCodeAt(end - 1) === 47) {
    end--;
  }
  if (end === path.length) {
    return path;
  }
  return path.slice(0, end || 1);
}

function normalizePathname(pathname: string): string {
  const normalized = pathname.trim() || '/';
  return normalized === '/' ? normalized : stripTrailingSlash(ensureLeadingSlash(normalized));
}

function escapeSegment(segment: string): string {
  return segment.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

type CompiledTemplate = {
  regex: RegExp;
  params: string[];
  template: string;
};

function compileTemplate(template: string): CompiledTemplate {
  const normalizedTemplate = stripTrailingSlash(ensureLeadingSlash(template || '/'));
  const segments = normalizedTemplate.split('/');
  const params: string[] = [];
  const pattern = segments
    .map((segment) => {
      if (segment.startsWith(':') && segment.length > 1) {
        params.push(segment.slice(1));
        return '([^/]+)';
      }
      if (!segment) {
        return '';
      }
      return escapeSegment(segment);
    })
    .join('/');
  const suffix = normalizedTemplate === '/' ? '' : '/?';
  return { regex: new RegExp(`^${pattern}${suffix}$`), params, template: normalizedTemplate };
}

function matchTemplate(template: string, pathname: string): { params: Record<string, string>; template: string } | null {
  const compiled = compileTemplate(template);
  const match = compiled.regex.exec(pathname);
  if (!match) {
    return null;
  }
  const params: Record<string, string> = {};
  compiled.params.forEach((param, index) => {
    params[param] = match[index + 1];
  });
  return { params, template: compiled.template };
}

export function resolveRouteTemplates(basePath?: string, routes?: Partial<RouteTemplates>): RouteTemplates {
  const normalizedBase = normalizePathname(basePath ?? DEFAULT_BASE_PATH);
  const listTemplate = routes?.list ? normalizePathname(routes.list) : normalizedBase || '/';
  let detailTemplate: string;
  if (routes?.detail) {
    detailTemplate = normalizePathname(routes.detail);
  } else {
    const basePrefix = normalizedBase === '/' ? '' : normalizedBase;
    detailTemplate = canonicalizePath(`${basePrefix}/:slug`);
    if (!detailTemplate.startsWith('/')) {
      detailTemplate = `/${detailTemplate}`;
    }
  }
  return {
    list: listTemplate,
    detail: detailTemplate || '/:slug'
  };
}

export function matchRouteFromPath(pathname: string, options: RouteTemplateOptions = {}): RouteMatch | null {
  const normalizedPath = normalizePathname(pathname);
  const templates = resolveRouteTemplates(options.basePath, options.routes);
  const detailMatch = matchTemplate(templates.detail, normalizedPath);
  if (detailMatch) {
    const slug = detailMatch.params.slug ?? Object.values(detailMatch.params)[0];
    return { view: 'detail', slug, pathname: normalizedPath };
  }
  const listMatch = matchTemplate(templates.list, normalizedPath);
  if (listMatch) {
    return { view: 'list', pathname: normalizedPath };
  }
  return null;
}

export function formatRoutePath(route: { view: RouteView; slug?: string }, options: RouteTemplateOptions = {}): string {
  const templates = resolveRouteTemplates(options.basePath, options.routes);
  const template = route.view === 'detail' ? templates.detail : templates.list;
  if (route.view === 'detail') {
    if (!route.slug) {
      throw new Error('detail routes require a slug');
    }
    const placeholderMatch = template.match(/:([a-zA-Z0-9_]+)/);
    if (!placeholderMatch) {
      return template;
    }
    return template.replace(placeholderMatch[0], route.slug);
  }
  return template;
}

export function getRouteSnapshot(location: LocationLike, options: RouteTemplateOptions & { historyMode?: HistoryMode } = {}): RouteSnapshot {
  const { pathname = '/', search = '', hash = '' } = location;
  const match = matchRouteFromPath(pathname, options);
  const snapshot: RouteMatch =
    match ??
    ({
      view: 'list',
      pathname: normalizePathname(pathname)
    } as RouteMatch);
  return {
    ...snapshot,
    url: `${pathname}${search ?? ''}${hash ?? ''}`
  };
}

export function parseHistoryMode(mode?: string | null): HistoryMode {
  if (mode === 'hash' || mode === 'none' || mode === 'path') {
    return mode;
  }
  return 'query';
}

export function parseRouteTakeoverMode(mode?: string | null): RouteTakeoverMode {
  if (mode === 'container' || mode === 'document') {
    return mode;
  }
  return 'none';
}

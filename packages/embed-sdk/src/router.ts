import type { PageDoc } from '@events-hub/page-schema';
import {
  encodePlan,
  formatRoutePath,
  getRouteSnapshot,
  matchRouteFromPath,
  parseHistoryMode,
  parseRouteTakeoverMode,
  type HistoryMode,
  type RouteMatch,
  type RouteSnapshot,
  type RouteTemplateOptions,
  type RouteTakeoverMode,
  type LocationLike
} from '@events-hub/router-helpers';

export type RouterLogger = {
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
};

export type RouterOptions = RouteTemplateOptions & {
  mode?: HistoryMode | string | null;
  routeTakeover?: RouteTakeoverMode | string | null;
  container: HTMLElement;
  shadowRoot?: ShadowRoot | null;
  embedId: string;
  logger: RouterLogger;
};

export type RouterCallbacks = {
  onRouteChange?: (snapshot: RouteSnapshot) => void;
};

export type NavigateTarget = string | RouteMatch;

export interface HistoryRouter {
  mode: HistoryMode;
  setPlan(plan: PageDoc, options?: { replace?: boolean }): void;
  getRoute(): RouteSnapshot;
  getPreviousUrl(): string | null;
  navigate(target: NavigateTarget, options?: { replace?: boolean }): void;
  destroy(): void;
}

const GLOBAL_PATH_OWNER_KEY = '__hub_embed_path_owner__';
const GLOBAL_DOCUMENT_TAKEOVER_KEY = '__hub_embed_doc_takeover__';

function getGlobalWindow(): (Window & Record<string, string | undefined>) | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window as unknown as Window & Record<string, string | undefined>;
}

function claimGlobalKey(key: string, embedId: string): boolean {
  const globalWindow = getGlobalWindow();
  if (!globalWindow) return false;
  const current = globalWindow[key];
  if (current && current !== embedId) {
    return false;
  }
  globalWindow[key] = embedId;
  return true;
}

function releaseGlobalKey(key: string, embedId: string) {
  const globalWindow = getGlobalWindow();
  if (!globalWindow) return;
  if (globalWindow[key] === embedId) {
    delete globalWindow[key];
  }
}

function getAnchorFromEvent(event: MouseEvent): HTMLAnchorElement | null {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
    return null;
  }
  const target = event.composedPath?.()[0] ?? event.target;
  if (!(target instanceof Element)) {
    return null;
  }
  if (target instanceof HTMLAnchorElement) {
    return target;
  }
  return target.closest('a[href]');
}

function shouldHandleUrl(url: URL, basePath?: string, routes?: RouteTemplateOptions['routes']): boolean {
  const match = matchRouteFromPath(url.pathname, { basePath, routes });
  return Boolean(match);
}

function toRouteMatch(target: NavigateTarget, options: RouteTemplateOptions): RouteMatch | null {
  if (typeof target === 'string') {
    if (!target) return null;
    const url = new URL(target, typeof window === 'undefined' ? 'https://events.local' : window.location.href);
    return matchRouteFromPath(url.pathname, options);
  }
  return target;
}

export function createHistoryRouter(options: RouterOptions, callbacks: RouterCallbacks = {}): HistoryRouter {
  const { container, shadowRoot, embedId, logger } = options;
  const historyMode = parseHistoryMode(options.mode ?? 'query');
  let resolvedMode = historyMode;
  if (resolvedMode === 'path' && !claimGlobalKey(GLOBAL_PATH_OWNER_KEY, embedId)) {
    logger.warn('[hub-embed] path routing already claimed by another embed; falling back to query mode', { embedId });
    resolvedMode = 'query';
  }

  let takeoverMode = parseRouteTakeoverMode(options.routeTakeover ?? 'none');
  if (takeoverMode === 'document' && !claimGlobalKey(GLOBAL_DOCUMENT_TAKEOVER_KEY, embedId)) {
    logger.warn('[hub-embed] route takeover already claimed; limiting to container scope', { embedId });
    takeoverMode = 'container';
  }

  const locationLike: LocationLike =
    typeof window !== 'undefined'
      ? window.location
      : {
          pathname: '/',
          hash: '',
          search: ''
        };
  let currentRoute = getRouteSnapshot(locationLike, { basePath: options.basePath, routes: options.routes, historyMode: resolvedMode });
  let previousUrl: string | null = null;

  const listeners: Array<{ target: EventTarget; type: string; listener: EventListenerOrEventListenerObject }> = [];

  function updateRouteSnapshot() {
    if (typeof window === 'undefined') {
      return;
    }
    previousUrl = currentRoute.url;
    currentRoute = getRouteSnapshot(window.location, { basePath: options.basePath, routes: options.routes, historyMode: resolvedMode });
    callbacks.onRouteChange?.(currentRoute);
  }

  function writeHistory(url: URL, replace: boolean) {
    if (typeof window === 'undefined' || typeof history === 'undefined') {
      return;
    }
    const method: 'replaceState' | 'pushState' = replace ? 'replaceState' : 'pushState';
    const state = { ...(history.state ?? {}), hubPlan: url.searchParams.get('hubPlan') };
    try {
      history[method](state, '', url.toString());
    } catch (error) {
      logger.error('[hub-embed] Failed to update history state', { error: error instanceof Error ? error.message : String(error) });
      if (!replace) {
        window.location.assign(url.toString());
      }
    }
  }

  function syncPlan(plan: PageDoc, replace = true) {
    if (resolvedMode === 'none') {
      return;
    }
    if (typeof window === 'undefined') return;
    const encoded = encodePlan(plan);
    const url = new URL(window.location.href);
    if (resolvedMode === 'query' || resolvedMode === 'path') {
      url.searchParams.set('hubPlan', encoded);
      writeHistory(url, replace);
    } else if (resolvedMode === 'hash') {
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      hashParams.set('hubPlan', encoded);
      url.hash = `#${hashParams.toString()}`;
      writeHistory(url, replace);
    }
  }

  function navigate(target: NavigateTarget, replace = false) {
    if (resolvedMode !== 'path' || typeof window === 'undefined') {
      return;
    }
    const match = toRouteMatch(target, { basePath: options.basePath, routes: options.routes });
    if (!match) {
      logger.warn('[hub-embed] navigate skipped because route target could not be resolved', { target });
      return;
    }
    const nextPath = typeof target === 'string' ? new URL(target, window.location.href).pathname : formatRoutePath(match, options);
    const url = new URL(window.location.href);
    url.pathname = nextPath;
    writeHistory(url, replace);
    updateRouteSnapshot();
  }

  function handleClick(event: MouseEvent) {
    if (resolvedMode !== 'path') return;
    const anchor = getAnchorFromEvent(event);
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
      return;
    }
    if (!shouldHandleUrl(url, options.basePath, options.routes)) {
      return;
    }
    event.preventDefault();
    navigate(url.pathname, anchor.hasAttribute('data-router-replace'));
  }

  function addListener(target: EventTarget | null | undefined, type: string, listener: EventListenerOrEventListenerObject, opts?: AddEventListenerOptions) {
    if (!target) return;
    target.addEventListener(type, listener, opts);
    listeners.push({ target, type, listener });
  }

  if (typeof window !== 'undefined') {
    addListener(window, 'popstate', updateRouteSnapshot);
    if (resolvedMode === 'hash') {
      addListener(window, 'hashchange', updateRouteSnapshot);
    }
    if (takeoverMode === 'document') {
      addListener(document, 'click', handleClick as EventListener, { capture: true });
    } else if (takeoverMode === 'container') {
      addListener(container, 'click', handleClick as EventListener, { capture: true });
      if (shadowRoot) {
        addListener(shadowRoot, 'click', handleClick as EventListener, { capture: true });
      }
    }
  }

  return {
    mode: resolvedMode,
    setPlan(plan: PageDoc, options?: { replace?: boolean }) {
      syncPlan(plan, options?.replace ?? true);
    },
    getRoute() {
      return currentRoute;
    },
    getPreviousUrl() {
      return previousUrl;
    },
    navigate(target, opts) {
      navigate(target, opts?.replace ?? false);
    },
    destroy() {
      listeners.forEach(({ target, type, listener }) => target.removeEventListener(type, listener));
      listeners.length = 0;
      if (resolvedMode === 'path') {
        releaseGlobalKey(GLOBAL_PATH_OWNER_KEY, embedId);
      }
      if (takeoverMode === 'document') {
        releaseGlobalKey(GLOBAL_DOCUMENT_TAKEOVER_KEY, embedId);
      }
    }
  };
}

import type { PageDoc } from '@events-hub/page-schema';
import type { SdkEvent } from '@events-hub/telemetry';
import type { HistoryMode, RouteTemplates, RouteTakeoverMode } from '@events-hub/router-helpers';
import { baseTokens, createShadowThemeCss, type TokenMap } from './theme';
import { createHistoryRouter, type HistoryRouter } from './router';
import { initializeTrustedTypes, shouldAbortForTrustedTypes } from './trusted-types';
import { consentManager, type ConsentSource, type ConsentStatus } from './consent';
import { registerPartnerAdapter as registerAdapter, emitPartnerEvent, type PartnerAdapter } from './partners';
import { createLogger, type HubLogger } from './logger';
const SDK_VERSION = typeof process !== 'undefined' && process.env?.npm_package_version ? process.env.npm_package_version : '0.0.0';
const DEPRECATION_STORAGE_KEY = 'hub-embed:deprecation';
const DEFAULT_HISTORY_MODE: HistoryMode = 'query';
let aliasAccessed = false;

type RouteView = 'list' | 'detail';

export type EmbedConfig = {
  container?: HTMLElement;
  el?: HTMLElement | string;
  tenantId: string;
  embedId?: string;
  initialPlan?: PageDoc | null;
  theme?: Record<string, string>;
  lazy?: boolean;
  useShadowDom?: boolean;
  historyMode?: HistoryMode | string | null;
  basePath?: string;
  routes?: Partial<RouteTemplates>;
  routeTakeover?: RouteTakeoverMode | string | null;
  legacyMountBefore?: string;
  cspNonce?: string;
  onEvent?: (event: SdkEvent) => void;
};

export type HydrateOptions = {
  plan: PageDoc;
  pushState?: boolean;
};

export type SdkEventMap = {
  ready: { tenantId: string; embedId: string };
  'plan:hydrate': { plan: PageDoc };
  'plan:error': { error: Error };
  'analytics:event': { event: SdkEvent };
};

type Listener<Event extends keyof SdkEventMap> = (payload: SdkEventMap[Event]) => void;

class EventEmitter {
  private listeners = new Map<keyof SdkEventMap, Set<Listener<keyof SdkEventMap>>>();

  private ensure<Event extends keyof SdkEventMap>(event: Event): Set<Listener<Event>> {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    return this.listeners.get(event)! as Set<Listener<Event>>;
  }

  on<Event extends keyof SdkEventMap>(event: Event, listener: Listener<Event>): void {
    this.ensure(event).add(listener);
  }

  off<Event extends keyof SdkEventMap>(event: Event, listener: Listener<Event>): void {
    this.listeners.get(event)?.delete(listener as Listener<keyof SdkEventMap>);
  }

  emit<Event extends keyof SdkEventMap>(event: Event, payload: SdkEventMap[Event]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }
}

type AnalyticsDispatcher = (event: SdkEvent) => void;

type RenderContext = {
  tenantId: string;
  embedId: string;
  emitter: EventEmitter;
  dispatch: AnalyticsDispatcher;
  logger: HubLogger;
};

function resolveContainer(config: EmbedConfig, logger: HubLogger): HTMLElement {
  if (config.container instanceof HTMLElement) {
    return config.container;
  }
  if (config.el instanceof HTMLElement) {
    return config.el;
  }
  if (typeof config.el === 'string' && typeof document !== 'undefined') {
    const target = document.querySelector<HTMLElement>(config.el);
    if (target) return target;
    throw new Error(`[hub-embed] Unable to find container matching selector ${config.el}`);
  }
  if (config.legacyMountBefore && typeof document !== 'undefined') {
    const selector = config.legacyMountBefore.startsWith('#') ? config.legacyMountBefore : `#${config.legacyMountBefore}`;
    const script = document.querySelector<HTMLElement>(selector);
    if (script?.parentElement) {
      const placeholder = document.createElement('div');
      script.parentElement.insertBefore(placeholder, script);
      return placeholder;
    }
    logger.code('warn', 'ROUTER_MISCONFIGURED', 'Legacy mount placeholder not found', { selector });
  }
  throw new Error('[hub-embed] A container or el selector is required to mount the embed.');
}

function assertNoIframe(container: HTMLElement): void {
  if (container.tagName.toLowerCase() === 'iframe' || container.querySelector('iframe')) {
    throw new Error('[hub-embed] Iframes are not supported. Mount inside the host DOM.');
  }
}

function validateTokens(theme: Record<string, string> = {}): TokenMap {
  for (const key of Object.keys(theme)) {
    if (!Object.prototype.hasOwnProperty.call(baseTokens, key)) {
      throw new Error(`[hub-embed] Unknown theme token "${key}". Allowed tokens must be predefined.`);
    }
  }
  return { ...baseTokens, ...theme };
}

function applyShadowStyles(root: ShadowRoot, theme: Record<string, string> = {}, nonce?: string, logger?: HubLogger): void {
  const tokens = validateTokens(theme);
  const css = createShadowThemeCss(tokens);
  try {
    if ('adoptedStyleSheets' in root && typeof CSSStyleSheet !== 'undefined') {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
      return;
    }
  } catch (error) {
    logger?.code('warn', 'CSP_BLOCKED', 'Constructable stylesheets unavailable, falling back to <style> tag', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
  const style = document.createElement('style');
  if (nonce) {
    style.setAttribute('nonce', nonce);
  }
  style.textContent = css;
  root.appendChild(style);
}

function renderAbortState(root: ShadowRoot, message: string) {
  root.replaceChildren();
  const container = document.createElement('div');
  container.setAttribute('role', 'alert');
  container.textContent = message;
  root.appendChild(container);
}

function createEmbedId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `embed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAnalyticsDispatcher(options: {
  tenantId: string;
  embedId: string;
  container: HTMLElement;
  router: HistoryRouter;
  onEvent?: (event: SdkEvent) => void;
  emitter: EventEmitter;
}): AnalyticsDispatcher {
  const { tenantId, embedId, container, router, onEvent, emitter } = options;
  return (event) => {
    const route = router.getRoute();
    const payload: SdkEvent = {
      ...event,
      tenantId,
      version: SDK_VERSION,
      embedId,
      routeName: route.view as RouteView,
      previousUrl: router.getPreviousUrl() ?? undefined
    };
    consentManager.enqueue(payload, (readyEvent) => {
      onEvent?.(readyEvent);
      container.dispatchEvent(new CustomEvent('hub-embed:event', { detail: readyEvent }));
      emitter.emit('analytics:event', { event: readyEvent });
    });
  };
}

function renderPlan(root: ShadowRoot, plan: PageDoc, context: RenderContext) {
  const existing = root.querySelector('[data-root]');
  if (existing) {
    root.removeChild(existing);
  }
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-root', '');
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', plan.title ?? 'Events Hub');

  for (const block of plan.blocks) {
    const section = document.createElement('section');
    section.dataset.block = block.kind;
    section.tabIndex = 0;
    const heading = document.createElement('h2');
    heading.textContent = block.kind.replace(/-/g, ' ');
    section.appendChild(heading);

    switch (block.kind) {
      case 'collection-rail': {
        const list = document.createElement('ul');
        for (const event of block.data.events) {
          const item = document.createElement('li');
          item.textContent = `${event.name} — ${event.venue.name}`;
          list.appendChild(item);
        }
        section.appendChild(list);
        break;
      }
      case 'hero-carousel': {
        const list = document.createElement('ul');
        for (const item of block.data.items) {
          const li = document.createElement('li');
          li.textContent = item.headline;
          list.appendChild(li);
        }
        section.appendChild(list);
        break;
      }
      case 'filter-bar': {
        const container = document.createElement('div');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Reset filters';
        button.addEventListener('click', () => {
          const activeKeys = Object.keys(block.data.active ?? {});
          context.dispatch({ type: 'filters_reset', active: activeKeys });
        });
        container.appendChild(button);
        section.appendChild(container);
        break;
      }
      case 'map-grid': {
        const map = document.createElement('div');
        map.textContent = `Map with ${block.data.events.length} pins.`;
        section.appendChild(map);
        break;
      }
      case 'promo-slot': {
        const disclosure = document.createElement('p');
        disclosure.textContent = `${block.data.disclosure} • ${block.data.advertiser ?? 'House'}`;
        section.appendChild(disclosure);
        emitPartnerEvent('impression', {
          tenantId: context.tenantId,
          embedId: context.embedId,
          eventId: block.data.advertiser ?? block.id ?? block.kind
        });
        break;
      }
      case 'event-detail': {
        const details = document.createElement('p');
        details.textContent = block.data.event.description ?? block.data.event.name;
        section.appendChild(details);
        break;
      }
      case 'event-mini-chat': {
        const chat = document.createElement('button');
        chat.type = 'button';
        chat.textContent = 'Ask about this event';
        chat.addEventListener('click', () => {
          context.dispatch({ type: 'chat_open', context: 'event' });
          emitPartnerEvent('click', {
            tenantId: context.tenantId,
            embedId: context.embedId,
            eventId: block.data.eventId,
            url: typeof window !== 'undefined' ? window.location.href : ''
          });
        });
        section.appendChild(chat);
        break;
      }
      default: {
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(block.data, null, 2);
        section.appendChild(pre);
        break;
      }
    }

    wrapper.appendChild(section);
  }

  root.appendChild(wrapper);
}

type LazyController = { disconnect(): void } | null;

function setupLazyHydration(container: HTMLElement, callback: () => void, logger: HubLogger): LazyController {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    callback();
    return null;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      const seen = entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0);
      if (seen) {
        observer.disconnect();
        callback();
      }
    },
    { rootMargin: '150%' }
  );
  observer.observe(container);
  logger.info('Lazy mount enabled — hydration deferred until container becomes visible.');
  return {
    disconnect() {
      observer.disconnect();
    }
  };
}

function emitDeprecationOnce(dispatch: AnalyticsDispatcher) {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(DEPRECATION_STORAGE_KEY) === '1') {
      return;
    }
    sessionStorage.setItem(DEPRECATION_STORAGE_KEY, '1');
    dispatch({ type: 'sdk.deprecation', from: 'EventsHubEmbed', to: 'HubEmbed' });
  } catch {
    dispatch({ type: 'sdk.deprecation', from: 'EventsHubEmbed', to: 'HubEmbed' });
  }
}

export type EmbedHandle = {
  hydrateNext(options: HydrateOptions): Promise<void>;
  refresh(next?: Partial<{ plan: PageDoc }>): Promise<void>;
  navigate(target: Parameters<HistoryRouter['navigate']>[0], options?: { replace?: boolean }): void;
  getRoute(): ReturnType<HistoryRouter['getRoute']>;
  destroy(): void;
  on<Event extends keyof SdkEventMap>(event: Event, listener: (payload: SdkEventMap[Event]) => void): void;
  off<Event extends keyof SdkEventMap>(event: Event, listener: (payload: SdkEventMap[Event]) => void): void;
  getShadowRoot(): ShadowRoot;
};

export function create(config: EmbedConfig): EmbedHandle {
  if (typeof document === 'undefined') {
    throw new Error('[hub-embed] The embed SDK must be initialized in a browser environment.');
  }

  const logger = createLogger('sdk');
  const container = resolveContainer(config, logger);
  assertNoIframe(container);
  const embedId = config.embedId ?? container.dataset.embedId ?? createEmbedId();
  container.dataset.embedId = embedId;
  const emitter = new EventEmitter();
  const useShadowDom = config.useShadowDom !== false;
  const shadowRoot = useShadowDom ? container.attachShadow({ mode: 'open' }) : (container as unknown as ShadowRoot);
  applyShadowStyles(shadowRoot, config.theme, config.cspNonce, logger);

  let routeChangeHandler: ((snapshot: ReturnType<HistoryRouter['getRoute']>) => void) | null = null;

  const router = createHistoryRouter(
    {
      mode: config.historyMode ?? DEFAULT_HISTORY_MODE,
      basePath: config.basePath,
      routes: config.routes,
      routeTakeover: config.routeTakeover ?? 'none',
      container,
      shadowRoot: useShadowDom ? shadowRoot : null,
      embedId,
      logger: logger.child('router')
    },
    {
      onRouteChange(snapshot) {
        routeChangeHandler?.(snapshot);
      }
    }
  );

  const analyticsDispatcher = createAnalyticsDispatcher({
    tenantId: config.tenantId,
    embedId,
    container,
    router,
    onEvent: config.onEvent,
    emitter
  });

  routeChangeHandler = (snapshot) => {
    analyticsDispatcher({ type: 'sdk.sectionChanged', section: snapshot.view });
  };

  const trustedTypes = initializeTrustedTypes(logger.child('trusted-types'));
  if (shouldAbortForTrustedTypes(trustedTypes)) {
    renderAbortState(shadowRoot, 'Trusted Types enforcement prevented the embed from running.');
    logger.code('error', 'TRUSTED_TYPES_ABORT', 'Trusted Types policy creation failed');
    throw new Error('Trusted Types policy creation failed.');
  }

  let currentPlan: PageDoc | null = config.initialPlan ?? null;
  let destroyed = false;

  function hydratePlan(plan: PageDoc, { pushState = true }: { pushState?: boolean } = {}) {
    if (destroyed) return;
    try {
      renderPlan(
        shadowRoot,
        plan,
        {
          tenantId: config.tenantId,
          embedId,
          emitter,
          dispatch: analyticsDispatcher,
          logger
        }
      );
      router.setPlan(plan, { replace: !pushState });
      emitter.emit('plan:hydrate', { plan });
      currentPlan = plan;
    } catch (error) {
      emitter.emit('plan:error', { error: error as Error });
      throw error;
    }
  }

  if (aliasAccessed) {
    emitDeprecationOnce(analyticsDispatcher);
    aliasAccessed = false;
  }

  const lazyController = config.lazy ? setupLazyHydration(container, () => currentPlan && hydratePlan(currentPlan, { pushState: false }), logger) : null;

  queueMicrotask(() => {
    emitter.emit('ready', { tenantId: config.tenantId, embedId });
    if (!config.lazy && currentPlan) {
      hydratePlan(currentPlan, { pushState: false });
    }
  });

  const handle: EmbedHandle = {
    async hydrateNext({ plan, pushState = true }) {
      hydratePlan(plan, { pushState });
    },
    async refresh(next) {
      const plan = next?.plan ?? currentPlan;
      if (!plan) return;
      hydratePlan(plan, { pushState: true });
    },
    navigate(target, options) {
      router.navigate(target, options);
    },
    getRoute() {
      return router.getRoute();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      lazyController?.disconnect();
      router.destroy();
      if (useShadowDom) {
        shadowRoot.replaceChildren();
      } else {
        container.replaceChildren();
      }
    },
    on(event, listener) {
      emitter.on(event, listener);
    },
    off(event, listener) {
      emitter.off(event, listener);
    },
    getShadowRoot() {
      return shadowRoot;
    }
  };

  return handle;
}

export function registerPartnerAdapter(adapter: PartnerAdapter): void {
  registerAdapter(adapter);
}

type ConsentAPI = {
  grant(source?: ConsentSource): void;
  revoke(): void;
  status(): ConsentStatus;
};

const consentApi: ConsentAPI = {
  grant(source) {
    consentManager.grant(source ?? 'host');
  },
  revoke() {
    consentManager.revoke();
  },
  status() {
    return consentManager.getStatus();
  }
};

type HubEmbedGlobal = {
  create: typeof create;
  consent: ConsentAPI;
  registerPartnerAdapter: typeof registerPartnerAdapter;
};

function installGlobal(api: HubEmbedGlobal) {
  if (typeof window === 'undefined') return;
  const globalWindow = window as typeof window & { HubEmbed?: HubEmbedGlobal; EventsHubEmbed?: HubEmbedGlobal };
  globalWindow.HubEmbed = api;
  try {
    Object.defineProperty(globalWindow, 'EventsHubEmbed', {
      configurable: true,
      get() {
        aliasAccessed = true;
        return api;
      }
    });
  } catch {
    globalWindow.EventsHubEmbed = api;
  }
}

const hubEmbedApi: HubEmbedGlobal = {
  create,
  consent: consentApi,
  registerPartnerAdapter
};

installGlobal(hubEmbedApi);

export { consentApi as consent };
export { baseTokens } from './theme';
export type { PartnerAdapter } from './partners';
export type { ConsentStatus } from './consent';

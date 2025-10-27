import type { PageDoc } from '@events-hub/page-schema';
import { encodePlan } from '@events-hub/router-helpers';

export type EmbedConfig = {
  container: HTMLElement;
  tenantId: string;
  initialPlan?: PageDoc;
  theme?: Record<string, string>;
};

export type HydrateOptions = {
  plan: PageDoc;
  pushState?: boolean;
};

export type SdkEventMap = {
  ready: { tenantId: string };
  'plan:hydrate': { plan: PageDoc };
  'plan:error': { error: Error };
  'analytics:event': { name: string; payload: Record<string, unknown> };
};

export type EmbedHandle = {
  hydrateNext(options: HydrateOptions): void;
  destroy(): void;
  on<Event extends keyof SdkEventMap>(event: Event, listener: (payload: SdkEventMap[Event]) => void): void;
  off<Event extends keyof SdkEventMap>(event: Event, listener: (payload: SdkEventMap[Event]) => void): void;
  getShadowRoot(): ShadowRoot;
};

type Listener<Event extends keyof SdkEventMap> = (payload: SdkEventMap[Event]) => void;

class EventEmitter {
  private listeners = new Map<keyof SdkEventMap, Set<Listener<any>>>();

  on<Event extends keyof SdkEventMap>(event: Event, listener: Listener<Event>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<any>);
  }

  off<Event extends keyof SdkEventMap>(event: Event, listener: Listener<Event>): void {
    this.listeners.get(event)?.delete(listener as Listener<any>);
  }

  emit<Event extends keyof SdkEventMap>(event: Event, payload: SdkEventMap[Event]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(payload);
    }
  }
}

function applyShadowStyles(root: ShadowRoot, theme: Record<string, string> = {}): void {
  const style = document.createElement('style');
  const tokens = {
    '--eh-color-bg': '#0b1120',
    '--eh-color-text': '#f8fafc',
    '--eh-font-family': "'Inter', system-ui, sans-serif",
    ...theme
  };
  const tokenCss = Object.entries(tokens)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
  style.textContent = `:host{${tokenCss}}
  *, *::before, *::after { box-sizing: border-box; font-family: var(--eh-font-family); }
  section[data-block]{ margin: 1rem 0; padding: 1rem; border-radius: 0.75rem; background: rgba(15,23,42,0.6); color: var(--eh-color-text); }
  h2{ font-size: 1.25rem; margin: 0 0 0.5rem; }
  ul{ margin: 0; padding-left: 1.25rem; }
  button{ border-radius: 999px; border: 1px solid rgba(148,163,184,0.3); background: transparent; color: inherit; padding: 0.5rem 1rem; cursor: pointer; }
  button:focus{ outline: 2px solid #38bdf8; outline-offset: 2px; }
  `;
  root.appendChild(style);
}

function assertNoIframe(container: HTMLElement): void {
  if (container.tagName.toLowerCase() === 'iframe' || container.querySelector('iframe')) {
    throw new Error('Iframe containers are not supported. Embed must run in the host DOM.');
  }
}

function renderPlan(root: ShadowRoot, plan: PageDoc, emitter: EventEmitter) {
  const existing = root.querySelector('[data-root]');
  if (existing) {
    root.removeChild(existing);
  }
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-root', '');
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', plan.title);

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
          emitter.emit('analytics:event', { name: 'filters.reset', payload: { active: block.data.active } });
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
          emitter.emit('analytics:event', { name: 'chat.open', payload: { eventId: block.data.eventId } });
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

export function create({ container, tenantId, initialPlan, theme }: EmbedConfig): EmbedHandle {
  assertNoIframe(container);
  const shadow = container.attachShadow({ mode: 'open' });
  applyShadowStyles(shadow, theme);
  const emitter = new EventEmitter();

  const handle: EmbedHandle = {
    hydrateNext({ plan, pushState = true }) {
      try {
        renderPlan(shadow, plan, emitter);
        if (pushState && typeof history !== 'undefined') {
          const encoded = encodePlan(plan);
          const url = new URL(window.location.href);
          url.searchParams.set('plan', encoded);
          history.replaceState({ plan: encoded }, '', url.toString());
        }
        emitter.emit('plan:hydrate', { plan });
      } catch (error) {
        emitter.emit('plan:error', { error: error as Error });
      }
    },
    destroy() {
      container.replaceChildren();
    },
    on(event, listener) {
      emitter.on(event, listener);
    },
    off(event, listener) {
      emitter.off(event, listener);
    },
    getShadowRoot() {
      return shadow;
    }
  };

  queueMicrotask(() => {
    emitter.emit('ready', { tenantId });
    if (initialPlan) {
      handle.hydrateNext({ plan: initialPlan, pushState: false });
    }
  });

  return handle;
}

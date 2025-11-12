import { expect, type ConsoleMessage, type Page, type TestInfo } from '@playwright/test';
import {
  expectConsentStatus,
  grantConsent,
  revokeConsent,
  setConsentState,
  waitForConsentControls,
  type HarnessConsentState
} from './fixtures/consent';
import { resetMswHandlers } from './msw-server';

const HUB_EMBED_PREFIX = '[hub-embed]';
export const PARTNER_EVENT_STORE = '__hubEmbedPartnerEvents';
export const HUB_EVENT_STORE = '__hubEmbedEvents';

export type ManualHarnessRoute =
  | '/manual'
  | '/manual/routing'
  | '/manual/lazy'
  | '/manual/legacy'
  | '/manual/trusted-types'
  | '/manual/multi'
  | '/events'
  | `/events/${string}`;

export type HubEmbedConsoleRecord = {
  type: ConsoleMessage['type'];
  text: string;
  location?: ReturnType<ConsoleMessage['location']>;
};

export class HubEmbedLogCollector {
  private readonly records: HubEmbedConsoleRecord[] = [];

  constructor(page: Page) {
    page.on('console', (message) => {
      const text = message.text();
      if (!text.includes(HUB_EMBED_PREFIX)) {
        return;
      }
      const location = message.location();
      this.records.push({
        type: message.type(),
        text,
        location
      });
    });
  }

  getEntries(): HubEmbedConsoleRecord[] {
    return [...this.records];
  }

  async attach(testInfo: TestInfo, name = 'hub-embed-logs'): Promise<void> {
    if (!this.records.length) {
      return;
    }
    const content = this.records.map((entry) => `[${entry.type}] ${entry.text}`).join('\n');
    await testInfo.attach(name, {
      body: content,
      contentType: 'text/plain'
    });
  }
}

type HarnessNavOptions = {
  consent?: HarnessConsentState;
  query?: Record<string, string | undefined>;
};

export async function gotoManualHarness(page: Page, route: ManualHarnessRoute, options: HarnessNavOptions = {}): Promise<void> {
  const searchParams = new URLSearchParams();
  if (options.consent) {
    searchParams.set('consent', options.consent);
  }
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value) {
        searchParams.set(key, value);
      }
    }
  }
  let target = route;
  const queryString = searchParams.toString();
  if (queryString) {
    target = route.includes('?') ? `${route}&${queryString}` : `${route}?${queryString}`;
  }
  await page.goto(target);
  await page.waitForLoadState('domcontentloaded');
  await page.locator('main').first().waitFor({ state: 'visible' });
  const controls = page.locator('section.manual-harness-controls');
  if ((await controls.count()) > 0) {
    await waitForConsentControls(page);
    if (options.consent) {
      await setConsentState(page, options.consent);
    }
  }
}

export async function expectEmbedStatus(page: Page, matcher: RegExp | string, index = 0, timeout = 20_000): Promise<void> {
  const target = page.locator('[data-embed-status]').nth(index);
  await expect(target).toHaveText(matcher, { timeout });
}

export async function resetHarnessState(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      window.sessionStorage?.clear();
    } catch (error) {
      console.warn('Unable to clear sessionStorage before navigation', error);
    }
    try {
      window.localStorage?.clear();
    } catch (error) {
      console.warn('Unable to clear localStorage before navigation', error);
    }
  });
  await Promise.allSettled([
    page.context().clearCookies(),
    page.context().clearPermissions()
  ]);
  await page.evaluate(
    (stores) => {
      for (const store of stores) {
        if (store in window) {
          Reflect.deleteProperty(window as Record<string, unknown>, store);
        }
      }
    },
    [PARTNER_EVENT_STORE, HUB_EVENT_STORE]
  );
  resetMswHandlers();
}

type PartnerEventRecord = {
  type: 'impression' | 'click';
  ts: number;
  context: { tenantId: string; embedId?: string; eventId?: string; url?: string };
};

export async function registerPartnerEventRecorder(page: Page, adapterId = 'playwright-recorder'): Promise<void> {
  await page.addInitScript(({ storeKey, adapter }) => {
    const events: PartnerEventRecord[] = [];
    (window as unknown as Record<string, PartnerEventRecord[]>)[storeKey] = events;

    const register = () => {
      const hub = (window as typeof window & { HubEmbed?: { registerPartnerAdapter?: (adapter: unknown) => void } }).HubEmbed;
      if (!hub?.registerPartnerAdapter) {
        return false;
      }
      hub.registerPartnerAdapter({
        id: adapter.id,
        onImpression(ctx) {
          events.push({ type: 'impression', ts: Date.now(), context: ctx });
        },
        onClick(ctx) {
          events.push({ type: 'click', ts: Date.now(), context: ctx });
        }
      });
      return true;
    };

    if (!register()) {
      const timer = window.setInterval(() => {
        if (register()) {
          window.clearInterval(timer);
        }
      }, 25);
      window.addEventListener(
        'pagehide',
        () => {
          window.clearInterval(timer);
        },
        { once: true }
      );
    }
  }, { storeKey: PARTNER_EVENT_STORE, adapter: { id: adapterId } });
}

export async function readPartnerEvents(page: Page): Promise<PartnerEventRecord[]> {
  return page.evaluate((storeKey) => {
    const store = (window as Record<string, PartnerEventRecord[]>)[storeKey];
    return Array.isArray(store) ? store : [];
  }, PARTNER_EVENT_STORE);
}

export type HubEventRecord = { type: string; detail: unknown };

export async function installHubEventRecorder(page: Page): Promise<void> {
  await page.addInitScript(({ storeKey }) => {
    const events: HubEventRecord[] = [];
    (window as unknown as Record<string, HubEventRecord[]>)[storeKey] = events;
    const originalDispatch = EventTarget.prototype.dispatchEvent;
    if (!(window as Record<string, unknown>).__hubEmbedEventPatched) {
      EventTarget.prototype.dispatchEvent = function patchedDispatch(event: Event) {
        if (event?.type === 'hub-embed:event' && event instanceof CustomEvent) {
          events.push({ type: event.detail?.type ?? 'unknown', detail: event.detail });
        }
        return originalDispatch.call(this, event);
      };
      Object.defineProperty(window as Record<string, unknown>, '__hubEmbedEventPatched', {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false
      });
    }
  }, { storeKey: HUB_EVENT_STORE });
}

export async function readHubEvents(page: Page): Promise<HubEventRecord[]> {
  return page.evaluate((storeKey) => {
    const events = (window as Record<string, HubEventRecord[]>)[storeKey];
    return Array.isArray(events) ? events : [];
  }, HUB_EVENT_STORE);
}

export async function clearHubEvents(page: Page): Promise<void> {
  await page.evaluate((storeKey) => {
    (window as Record<string, HubEventRecord[]>)[storeKey] = [];
  }, HUB_EVENT_STORE);
}

export {
  expectConsentStatus,
  grantConsent,
  revokeConsent,
  setConsentState,
  waitForConsentControls,
  resetMswHandlers,
  installHubEventRecorder,
  readHubEvents,
  clearHubEvents
};

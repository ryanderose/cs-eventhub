import { consentManager } from './consent';
import { createLogger } from './logger';

export type PartnerAdapter = {
  id: string;
  onImpression?(ctx: PartnerContext): void;
  onClick?(ctx: PartnerContext & { url: string }): void;
};

export type PartnerContext = {
  tenantId: string;
  embedId?: string;
  eventId?: string;
};

const adapters = new Map<string, PartnerAdapter>();
const logger = createLogger('partners');

export function registerPartnerAdapter(adapter: PartnerAdapter): void {
  if (!adapter?.id) {
    logger.warn('Attempted to register partner adapter without id');
    return;
  }
  adapters.set(adapter.id, adapter);
  logger.info('Registered partner adapter', { id: adapter.id });
}

function dispatch(action: 'impression' | 'click', ctx: PartnerContext & { url?: string }) {
  adapters.forEach((adapter) => {
    try {
      if (action === 'impression') {
        adapter.onImpression?.(ctx);
      } else if (ctx.url) {
        adapter.onClick?.({ ...ctx, url: ctx.url });
      }
    } catch (error) {
      logger.error(`Partner adapter ${adapter.id} threw during ${action}`, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

export function emitPartnerEvent(action: 'impression' | 'click', ctx: PartnerContext & { url?: string }) {
  consentManager.enqueue({ action, ctx }, () => dispatch(action, ctx));
}

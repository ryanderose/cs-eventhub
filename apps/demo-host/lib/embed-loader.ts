import type { EmbedConfig, EmbedHandle } from '@events-hub/embed-sdk';
import type { PageDoc } from '@events-hub/page-schema';
import type { EmbedMode } from './env';

export type EmbedModule = { create(config: EmbedConfig): EmbedHandle };

declare global {
  interface Window {
    EventsHubEmbed?: EmbedModule;
  }
}

function resolveGlobalModule(): EmbedModule | undefined {
  if (typeof window === 'undefined') return undefined;
  const embedModule = window.EventsHubEmbed;
  if (embedModule && typeof embedModule.create === 'function') {
    return embedModule as EmbedModule;
  }
  return undefined;
}

async function loadExternalModule(src: string): Promise<EmbedModule> {
  if (typeof document === 'undefined') {
    throw new Error('External embed mode requires a browser environment.');
  }
  const existing = resolveGlobalModule();
  if (existing) {
    return existing;
  }
  if (!src) {
    throw new Error('NEXT_PUBLIC_EMBED_SRC must be defined for external embed mode.');
  }

  return new Promise<EmbedModule>((resolve, reject) => {
    const onReady = () => {
      const embedModule = resolveGlobalModule();
      if (embedModule) {
        resolve(embedModule);
      } else {
        reject(new Error('The embed SDK failed to register the expected global.'));
      }
    };
    const onError = () => {
      reject(new Error(`Failed to load the embed SDK from ${src}.`));
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-events-hub-embed]');
    if (existingScript) {
      if (existingScript.dataset.loaded === 'true' && resolveGlobalModule()) {
        resolve(resolveGlobalModule()!);
        return;
      }
      existingScript.addEventListener('load', onReady, { once: true });
      existingScript.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.eventsHubEmbed = 'true';
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        onReady();
      },
      { once: true }
    );
    script.addEventListener('error', onError, { once: true });
    document.head.appendChild(script);
  });
}

export async function loadEmbedModule(mode: EmbedMode, src: string): Promise<EmbedModule> {
  if (mode === 'external') {
    return loadExternalModule(src);
  }
  return import('@events-hub/embed-sdk/dist/index.esm.js');
}

export function createEmbedHandle({
  container,
  embedModule,
  plan,
  tenantId,
  config
}: {
  container: HTMLElement;
  embedModule: EmbedModule;
  plan: PageDoc;
  tenantId: string;
  config?: Partial<EmbedConfig>;
}): EmbedHandle {
  return embedModule.create({
    container,
    tenantId,
    initialPlan: plan,
    ...config
  });
}

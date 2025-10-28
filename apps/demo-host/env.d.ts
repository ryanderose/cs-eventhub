declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_EMBED_MODE?: 'external' | 'linked';
    readonly NEXT_PUBLIC_EMBED_SRC?: string;
    readonly NEXT_PUBLIC_CONFIG_URL?: string;
    readonly NEXT_PUBLIC_API_BASE?: string;
    readonly NEXT_PUBLIC_PLAN_MODE?: 'beta' | 'prod' | string;
    readonly NEXT_PUBLIC_APP_VERSION?: string;
    readonly DEFAULT_ISR_REVALIDATE?: string;
    readonly SEO_FRAGMENT_REVALIDATE?: string;
    readonly DEMO_HOSTNAME?: string;
  }
}

declare global {
  interface Window {
    EventsHubEmbed?: {
      create: typeof import('@events-hub/embed-sdk').create;
    };
  }
}

export {};

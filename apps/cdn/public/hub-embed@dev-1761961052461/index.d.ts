import type { PageDoc } from '@events-hub/page-schema';
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
    ready: {
        tenantId: string;
    };
    'plan:hydrate': {
        plan: PageDoc;
    };
    'plan:error': {
        error: Error;
    };
    'analytics:event': {
        name: string;
        payload: Record<string, unknown>;
    };
};
export type EmbedHandle = {
    hydrateNext(options: HydrateOptions): void;
    destroy(): void;
    on<Event extends keyof SdkEventMap>(event: Event, listener: (payload: SdkEventMap[Event]) => void): void;
    off<Event extends keyof SdkEventMap>(event: Event, listener: (payload: SdkEventMap[Event]) => void): void;
    getShadowRoot(): ShadowRoot;
};
export declare function create({ container, tenantId, initialPlan, theme }: EmbedConfig): EmbedHandle;
export { baseTokens } from './theme';

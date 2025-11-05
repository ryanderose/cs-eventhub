import { z } from 'zod';
/**
 * Block kinds supported by the v1.5 product surface. Each block has a
 * dedicated schema describing the data payload that the block runtime expects
 * to receive from the composer. These definitions are intentionally strict so
 * that the AI composer can stream deterministic payloads which in turn produce
 * stable cache keys and render plans.
 */
export declare const BlockKind: z.ZodEnum<["ai-dock", "filter-bar", "hero-carousel", "collection-rail", "microcalendar", "event-detail", "seo-collection", "seo-detail", "map-grid", "promo-slot", "event-mini-chat"]>;
declare const EventSummarySchema: z.ZodObject<{
    id: z.ZodString;
    canonicalId: z.ZodString;
    name: z.ZodString;
    venue: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        geo: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
        }, {
            lat: number;
            lng: number;
        }>>;
        address: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        geo?: {
            lat: number;
            lng: number;
        } | undefined;
        address?: string | undefined;
    }, {
        id: string;
        name: string;
        geo?: {
            lat: number;
            lng: number;
        } | undefined;
        address?: string | undefined;
    }>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    heroImage: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodString;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        focalPoint: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        alt: string;
        width?: number | undefined;
        height?: number | undefined;
        focalPoint?: {
            x: number;
            y: number;
        } | undefined;
    }, {
        url: string;
        alt: string;
        width?: number | undefined;
        height?: number | undefined;
        focalPoint?: {
            x: number;
            y: number;
        } | undefined;
    }>>;
    price: z.ZodOptional<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        min?: number | undefined;
        max?: number | undefined;
        currency?: string | undefined;
    }>>;
    distanceKm: z.ZodOptional<z.ZodNumber>;
    whyGo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    locale: z.ZodDefault<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    ticketUrl: z.ZodOptional<z.ZodString>;
    source: z.ZodObject<{
        provider: z.ZodString;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        provider: string;
    }, {
        id: string;
        provider: string;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    canonicalId: string;
    name: string;
    venue: {
        id: string;
        name: string;
        geo?: {
            lat: number;
            lng: number;
        } | undefined;
        address?: string | undefined;
    };
    startDate: string;
    categories: string[];
    locale: string;
    timezone: string;
    source: {
        id: string;
        provider: string;
    };
    endDate?: string | undefined;
    heroImage?: {
        url: string;
        alt: string;
        width?: number | undefined;
        height?: number | undefined;
        focalPoint?: {
            x: number;
            y: number;
        } | undefined;
    } | undefined;
    price?: {
        currency: string;
        min?: number | undefined;
        max?: number | undefined;
    } | undefined;
    distanceKm?: number | undefined;
    whyGo?: string[] | undefined;
    ticketUrl?: string | undefined;
}, {
    id: string;
    canonicalId: string;
    name: string;
    venue: {
        id: string;
        name: string;
        geo?: {
            lat: number;
            lng: number;
        } | undefined;
        address?: string | undefined;
    };
    startDate: string;
    source: {
        id: string;
        provider: string;
    };
    endDate?: string | undefined;
    categories?: string[] | undefined;
    heroImage?: {
        url: string;
        alt: string;
        width?: number | undefined;
        height?: number | undefined;
        focalPoint?: {
            x: number;
            y: number;
        } | undefined;
    } | undefined;
    price?: {
        min?: number | undefined;
        max?: number | undefined;
        currency?: string | undefined;
    } | undefined;
    distanceKm?: number | undefined;
    whyGo?: string[] | undefined;
    locale?: string | undefined;
    timezone?: string | undefined;
    ticketUrl?: string | undefined;
}>;
export declare const BlockInstanceSchema: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    order: z.ZodNumber;
    layout: z.ZodDefault<z.ZodObject<{
        fullWidth: z.ZodDefault<z.ZodBoolean>;
        height: z.ZodOptional<z.ZodString>;
        minHeight: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }, {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        viewKey: z.ZodString;
        surface: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    }, "strip", z.ZodTypeAny, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }>>;
    a11y: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    kind: z.ZodLiteral<"ai-dock">;
    data: z.ZodObject<{
        entryPointLabel: z.ZodDefault<z.ZodString>;
        welcomeMessages: z.ZodDefault<z.ZodArray<z.ZodObject<{
            role: z.ZodEnum<["system", "user", "assistant"]>;
            content: z.ZodString;
            eventId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            role: "system" | "user" | "assistant";
            content: string;
            eventId?: string | undefined;
        }, {
            role: "system" | "user" | "assistant";
            content: string;
            eventId?: string | undefined;
        }>, "many">>;
        conversationId: z.ZodString;
        allowedScopes: z.ZodDefault<z.ZodArray<z.ZodEnum<["global", "event"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        entryPointLabel: string;
        welcomeMessages: {
            role: "system" | "user" | "assistant";
            content: string;
            eventId?: string | undefined;
        }[];
        conversationId: string;
        allowedScopes: ("global" | "event")[];
    }, {
        conversationId: string;
        entryPointLabel?: string | undefined;
        welcomeMessages?: {
            role: "system" | "user" | "assistant";
            content: string;
            eventId?: string | undefined;
        }[] | undefined;
        allowedScopes?: ("global" | "event")[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        entryPointLabel: string;
        welcomeMessages: {
            role: "system" | "user" | "assistant";
            content: string;
            eventId?: string | undefined;
        }[];
        conversationId: string;
        allowedScopes: ("global" | "event")[];
    };
    id: string;
    key: string;
    kind: "ai-dock";
    version: "1.5" | "1.6";
    order: number;
    layout: {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    };
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}, {
    data: {
        conversationId: string;
        entryPointLabel?: string | undefined;
        welcomeMessages?: {
            role: "system" | "user" | "assistant";
            content: string;
            eventId?: string | undefined;
        }[] | undefined;
        allowedScopes?: ("global" | "event")[] | undefined;
    };
    id: string;
    key: string;
    kind: "ai-dock";
    order: number;
    version?: "1.5" | "1.6" | undefined;
    layout?: {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    } | undefined;
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    order: z.ZodNumber;
    layout: z.ZodDefault<z.ZodObject<{
        fullWidth: z.ZodDefault<z.ZodBoolean>;
        height: z.ZodOptional<z.ZodString>;
        minHeight: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }, {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        viewKey: z.ZodString;
        surface: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    }, "strip", z.ZodTypeAny, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }>>;
    a11y: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    kind: z.ZodLiteral<"filter-bar">;
    data: z.ZodObject<{
        facets: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            type: z.ZodEnum<["date", "category", "price", "distance", "family", "accessibility", "neighborhood"]>;
            options: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                count: z.ZodOptional<z.ZodNumber>;
                icon: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                label: string;
                id: string;
                count?: number | undefined;
                icon?: string | undefined;
            }, {
                label: string;
                id: string;
                count?: number | undefined;
                icon?: string | undefined;
            }>, "many">;
            multi: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            options: {
                label: string;
                id: string;
                count?: number | undefined;
                icon?: string | undefined;
            }[];
            type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
            label: string;
            id: string;
            multi: boolean;
        }, {
            options: {
                label: string;
                id: string;
                count?: number | undefined;
                icon?: string | undefined;
            }[];
            type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
            label: string;
            id: string;
            multi?: boolean | undefined;
        }>, "many">;
        active: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodString]>>;
        sortOptions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            default: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            label: string;
            id: string;
            default?: boolean | undefined;
        }, {
            label: string;
            id: string;
            default?: boolean | undefined;
        }>, "many">;
        flags: z.ZodDefault<z.ZodObject<{
            showReset: z.ZodDefault<z.ZodBoolean>;
            floating: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            showReset: boolean;
            floating: boolean;
        }, {
            showReset?: boolean | undefined;
            floating?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        facets: {
            options: {
                label: string;
                id: string;
                count?: number | undefined;
                icon?: string | undefined;
            }[];
            type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
            label: string;
            id: string;
            multi: boolean;
        }[];
        active: Record<string, string | string[]>;
        sortOptions: {
            label: string;
            id: string;
            default?: boolean | undefined;
        }[];
        flags: {
            showReset: boolean;
            floating: boolean;
        };
    }, {
        facets: {
            options: {
                label: string;
                id: string;
                count?: number | undefined;
                icon?: string | undefined;
            }[];
            type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
            label: string;
            id: string;
            multi?: boolean | undefined;
        }[];
        active: Record<string, string | string[]>;
        sortOptions: {
            label: string;
            id: string;
            default?: boolean | undefined;
        }[];
        flags?: {
            showReset?: boolean | undefined;
            floating?: boolean | undefined;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        facets: {
            options: {
                label: string;
                id: string;
                count?: number | undefined;
                icon?: string | undefined;
            }[];
            type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
            label: string;
            id: string;
            multi: boolean;
        }[];
        active: Record<string, string | string[]>;
        sortOptions: {
            label: string;
            id: string;
            default?: boolean | undefined;
        }[];
        flags: {
            showReset: boolean;
            floating: boolean;
        };
    };
    id: string;
    key: string;
    kind: "filter-bar";
    version: "1.5" | "1.6";
    order: number;
    layout: {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    };
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}, {
    data: {
        facets: {
            options: {
                label: string;
                id: string;
                count?: number | undefined;
                icon?: string | undefined;
            }[];
            type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
            label: string;
            id: string;
            multi?: boolean | undefined;
        }[];
        active: Record<string, string | string[]>;
        sortOptions: {
            label: string;
            id: string;
            default?: boolean | undefined;
        }[];
        flags?: {
            showReset?: boolean | undefined;
            floating?: boolean | undefined;
        } | undefined;
    };
    id: string;
    key: string;
    kind: "filter-bar";
    order: number;
    version?: "1.5" | "1.6" | undefined;
    layout?: {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    } | undefined;
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    order: z.ZodNumber;
    layout: z.ZodDefault<z.ZodObject<{
        fullWidth: z.ZodDefault<z.ZodBoolean>;
        height: z.ZodOptional<z.ZodString>;
        minHeight: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }, {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        viewKey: z.ZodString;
        surface: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    }, "strip", z.ZodTypeAny, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }>>;
    a11y: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    kind: z.ZodLiteral<"hero-carousel">;
    data: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            headline: z.ZodString;
            subhead: z.ZodOptional<z.ZodString>;
            image: z.ZodObject<{
                url: z.ZodString;
                alt: z.ZodString;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                focalPoint: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    x: number;
                    y: number;
                }, {
                    x: number;
                    y: number;
                }>>;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            }, {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            }>;
            cta: z.ZodOptional<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                label: string;
                href: string;
            }, {
                label: string;
                href: string;
            }>>;
            eventRef: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            headline: string;
            image: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            };
            subhead?: string | undefined;
            cta?: {
                label: string;
                href: string;
            } | undefined;
            eventRef?: string | undefined;
        }, {
            id: string;
            headline: string;
            image: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            };
            subhead?: string | undefined;
            cta?: {
                label: string;
                href: string;
            } | undefined;
            eventRef?: string | undefined;
        }>, "many">;
        autoplayMs: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        items: {
            id: string;
            headline: string;
            image: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            };
            subhead?: string | undefined;
            cta?: {
                label: string;
                href: string;
            } | undefined;
            eventRef?: string | undefined;
        }[];
        autoplayMs: number;
    }, {
        items: {
            id: string;
            headline: string;
            image: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            };
            subhead?: string | undefined;
            cta?: {
                label: string;
                href: string;
            } | undefined;
            eventRef?: string | undefined;
        }[];
        autoplayMs?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        items: {
            id: string;
            headline: string;
            image: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            };
            subhead?: string | undefined;
            cta?: {
                label: string;
                href: string;
            } | undefined;
            eventRef?: string | undefined;
        }[];
        autoplayMs: number;
    };
    id: string;
    key: string;
    kind: "hero-carousel";
    version: "1.5" | "1.6";
    order: number;
    layout: {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    };
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}, {
    data: {
        items: {
            id: string;
            headline: string;
            image: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            };
            subhead?: string | undefined;
            cta?: {
                label: string;
                href: string;
            } | undefined;
            eventRef?: string | undefined;
        }[];
        autoplayMs?: number | undefined;
    };
    id: string;
    key: string;
    kind: "hero-carousel";
    order: number;
    version?: "1.5" | "1.6" | undefined;
    layout?: {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    } | undefined;
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    order: z.ZodNumber;
    layout: z.ZodDefault<z.ZodObject<{
        fullWidth: z.ZodDefault<z.ZodBoolean>;
        height: z.ZodOptional<z.ZodString>;
        minHeight: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }, {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        viewKey: z.ZodString;
        surface: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    }, "strip", z.ZodTypeAny, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }>>;
    a11y: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    kind: z.ZodLiteral<"collection-rail">;
    data: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        events: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            canonicalId: z.ZodString;
            name: z.ZodString;
            venue: z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                geo: z.ZodOptional<z.ZodObject<{
                    lat: z.ZodNumber;
                    lng: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    lat: number;
                    lng: number;
                }, {
                    lat: number;
                    lng: number;
                }>>;
                address: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            }, {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            }>;
            startDate: z.ZodString;
            endDate: z.ZodOptional<z.ZodString>;
            categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            heroImage: z.ZodOptional<z.ZodObject<{
                url: z.ZodString;
                alt: z.ZodString;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                focalPoint: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    x: number;
                    y: number;
                }, {
                    x: number;
                    y: number;
                }>>;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            }, {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            }>>;
            price: z.ZodOptional<z.ZodObject<{
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                currency: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            }, {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            }>>;
            distanceKm: z.ZodOptional<z.ZodNumber>;
            whyGo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            locale: z.ZodDefault<z.ZodString>;
            timezone: z.ZodDefault<z.ZodString>;
            ticketUrl: z.ZodOptional<z.ZodString>;
            source: z.ZodObject<{
                provider: z.ZodString;
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                provider: string;
            }, {
                id: string;
                provider: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            categories: string[];
            locale: string;
            timezone: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            ticketUrl?: string | undefined;
        }, {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            categories?: string[] | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            locale?: string | undefined;
            timezone?: string | undefined;
            ticketUrl?: string | undefined;
        }>, "many">;
        layout: z.ZodDefault<z.ZodEnum<["grid", "rail"]>>;
        streaming: z.ZodDefault<z.ZodObject<{
            cursor: z.ZodOptional<z.ZodString>;
            mode: z.ZodDefault<z.ZodEnum<["initial", "append"]>>;
        }, "strip", z.ZodTypeAny, {
            mode: "initial" | "append";
            cursor?: string | undefined;
        }, {
            cursor?: string | undefined;
            mode?: "initial" | "append" | undefined;
        }>>;
        diversity: z.ZodOptional<z.ZodObject<{
            venue: z.ZodDefault<z.ZodNumber>;
            date: z.ZodDefault<z.ZodNumber>;
            category: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            date: number;
            venue: number;
            category: number;
        }, {
            venue?: number | undefined;
            date?: number | undefined;
            category?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        layout: "grid" | "rail";
        title: string;
        events: {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            categories: string[];
            locale: string;
            timezone: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            ticketUrl?: string | undefined;
        }[];
        streaming: {
            mode: "initial" | "append";
            cursor?: string | undefined;
        };
        description?: string | undefined;
        diversity?: {
            date: number;
            venue: number;
            category: number;
        } | undefined;
    }, {
        title: string;
        events: {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            categories?: string[] | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            locale?: string | undefined;
            timezone?: string | undefined;
            ticketUrl?: string | undefined;
        }[];
        description?: string | undefined;
        layout?: "grid" | "rail" | undefined;
        streaming?: {
            cursor?: string | undefined;
            mode?: "initial" | "append" | undefined;
        } | undefined;
        diversity?: {
            venue?: number | undefined;
            date?: number | undefined;
            category?: number | undefined;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        layout: "grid" | "rail";
        title: string;
        events: {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            categories: string[];
            locale: string;
            timezone: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            ticketUrl?: string | undefined;
        }[];
        streaming: {
            mode: "initial" | "append";
            cursor?: string | undefined;
        };
        description?: string | undefined;
        diversity?: {
            date: number;
            venue: number;
            category: number;
        } | undefined;
    };
    id: string;
    key: string;
    kind: "collection-rail";
    version: "1.5" | "1.6";
    order: number;
    layout: {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    };
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}, {
    data: {
        title: string;
        events: {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            categories?: string[] | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            locale?: string | undefined;
            timezone?: string | undefined;
            ticketUrl?: string | undefined;
        }[];
        description?: string | undefined;
        layout?: "grid" | "rail" | undefined;
        streaming?: {
            cursor?: string | undefined;
            mode?: "initial" | "append" | undefined;
        } | undefined;
        diversity?: {
            venue?: number | undefined;
            date?: number | undefined;
            category?: number | undefined;
        } | undefined;
    };
    id: string;
    key: string;
    kind: "collection-rail";
    order: number;
    version?: "1.5" | "1.6" | undefined;
    layout?: {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    } | undefined;
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    order: z.ZodNumber;
    layout: z.ZodDefault<z.ZodObject<{
        fullWidth: z.ZodDefault<z.ZodBoolean>;
        height: z.ZodOptional<z.ZodString>;
        minHeight: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }, {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        viewKey: z.ZodString;
        surface: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    }, "strip", z.ZodTypeAny, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }>>;
    a11y: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    kind: z.ZodLiteral<"microcalendar">;
    data: z.ZodObject<{
        days: z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            events: z.ZodArray<z.ZodObject<Pick<{
                id: z.ZodString;
                canonicalId: z.ZodString;
                name: z.ZodString;
                venue: z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                    geo: z.ZodOptional<z.ZodObject<{
                        lat: z.ZodNumber;
                        lng: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        lat: number;
                        lng: number;
                    }, {
                        lat: number;
                        lng: number;
                    }>>;
                    address: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                }, {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                }>;
                startDate: z.ZodString;
                endDate: z.ZodOptional<z.ZodString>;
                categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                heroImage: z.ZodOptional<z.ZodObject<{
                    url: z.ZodString;
                    alt: z.ZodString;
                    width: z.ZodOptional<z.ZodNumber>;
                    height: z.ZodOptional<z.ZodNumber>;
                    focalPoint: z.ZodOptional<z.ZodObject<{
                        x: z.ZodNumber;
                        y: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        x: number;
                        y: number;
                    }, {
                        x: number;
                        y: number;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }>>;
                price: z.ZodOptional<z.ZodObject<{
                    min: z.ZodOptional<z.ZodNumber>;
                    max: z.ZodOptional<z.ZodNumber>;
                    currency: z.ZodDefault<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                }, {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                }>>;
                distanceKm: z.ZodOptional<z.ZodNumber>;
                whyGo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                locale: z.ZodDefault<z.ZodString>;
                timezone: z.ZodDefault<z.ZodString>;
                ticketUrl: z.ZodOptional<z.ZodString>;
                source: z.ZodObject<{
                    provider: z.ZodString;
                    id: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    provider: string;
                }, {
                    id: string;
                    provider: string;
                }>;
            }, "id" | "canonicalId" | "name" | "startDate">, "strip", z.ZodTypeAny, {
                id: string;
                canonicalId: string;
                name: string;
                startDate: string;
            }, {
                id: string;
                canonicalId: string;
                name: string;
                startDate: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            date: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                startDate: string;
            }[];
        }, {
            date: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                startDate: string;
            }[];
        }>, "many">;
        timezone: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timezone: string;
        days: {
            date: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                startDate: string;
            }[];
        }[];
    }, {
        days: {
            date: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                startDate: string;
            }[];
        }[];
        timezone?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        timezone: string;
        days: {
            date: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                startDate: string;
            }[];
        }[];
    };
    id: string;
    key: string;
    kind: "microcalendar";
    version: "1.5" | "1.6";
    order: number;
    layout: {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    };
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}, {
    data: {
        days: {
            date: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                startDate: string;
            }[];
        }[];
        timezone?: string | undefined;
    };
    id: string;
    key: string;
    kind: "microcalendar";
    order: number;
    version?: "1.5" | "1.6" | undefined;
    layout?: {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    } | undefined;
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    order: z.ZodNumber;
    layout: z.ZodDefault<z.ZodObject<{
        fullWidth: z.ZodDefault<z.ZodBoolean>;
        height: z.ZodOptional<z.ZodString>;
        minHeight: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }, {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        viewKey: z.ZodString;
        surface: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    }, "strip", z.ZodTypeAny, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }>>;
    a11y: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    kind: z.ZodLiteral<"event-detail">;
    data: z.ZodObject<{
        event: z.ZodObject<{
            id: z.ZodString;
            canonicalId: z.ZodString;
            name: z.ZodString;
            venue: z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                geo: z.ZodOptional<z.ZodObject<{
                    lat: z.ZodNumber;
                    lng: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    lat: number;
                    lng: number;
                }, {
                    lat: number;
                    lng: number;
                }>>;
                address: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            }, {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            }>;
            startDate: z.ZodString;
            endDate: z.ZodOptional<z.ZodString>;
            categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            heroImage: z.ZodOptional<z.ZodObject<{
                url: z.ZodString;
                alt: z.ZodString;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                focalPoint: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    x: number;
                    y: number;
                }, {
                    x: number;
                    y: number;
                }>>;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            }, {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            }>>;
            price: z.ZodOptional<z.ZodObject<{
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                currency: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            }, {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            }>>;
            distanceKm: z.ZodOptional<z.ZodNumber>;
            whyGo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            locale: z.ZodDefault<z.ZodString>;
            timezone: z.ZodDefault<z.ZodString>;
            ticketUrl: z.ZodOptional<z.ZodString>;
            source: z.ZodObject<{
                provider: z.ZodString;
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                provider: string;
            }, {
                id: string;
                provider: string;
            }>;
            description: z.ZodOptional<z.ZodString>;
            accessibility: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            safety: z.ZodOptional<z.ZodObject<{
                rating: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
                notes: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                rating?: "low" | "medium" | "high" | undefined;
                notes?: string | undefined;
            }, {
                rating?: "low" | "medium" | "high" | undefined;
                notes?: string | undefined;
            }>>;
            similarEvents: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                canonicalId: z.ZodString;
                name: z.ZodString;
                venue: z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                    geo: z.ZodOptional<z.ZodObject<{
                        lat: z.ZodNumber;
                        lng: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        lat: number;
                        lng: number;
                    }, {
                        lat: number;
                        lng: number;
                    }>>;
                    address: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                }, {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                }>;
                startDate: z.ZodString;
                endDate: z.ZodOptional<z.ZodString>;
                categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                heroImage: z.ZodOptional<z.ZodObject<{
                    url: z.ZodString;
                    alt: z.ZodString;
                    width: z.ZodOptional<z.ZodNumber>;
                    height: z.ZodOptional<z.ZodNumber>;
                    focalPoint: z.ZodOptional<z.ZodObject<{
                        x: z.ZodNumber;
                        y: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        x: number;
                        y: number;
                    }, {
                        x: number;
                        y: number;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }>>;
                price: z.ZodOptional<z.ZodObject<{
                    min: z.ZodOptional<z.ZodNumber>;
                    max: z.ZodOptional<z.ZodNumber>;
                    currency: z.ZodDefault<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                }, {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                }>>;
                distanceKm: z.ZodOptional<z.ZodNumber>;
                whyGo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                locale: z.ZodDefault<z.ZodString>;
                timezone: z.ZodDefault<z.ZodString>;
                ticketUrl: z.ZodOptional<z.ZodString>;
                source: z.ZodObject<{
                    provider: z.ZodString;
                    id: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    provider: string;
                }, {
                    id: string;
                    provider: string;
                }>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
            }, {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
            }>, "many">>;
            map: z.ZodOptional<z.ZodObject<{
                lat: z.ZodNumber;
                lng: z.ZodNumber;
                zoom: z.ZodDefault<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                lat: number;
                lng: number;
                zoom: number;
            }, {
                lat: number;
                lng: number;
                zoom?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            categories: string[];
            locale: string;
            timezone: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            ticketUrl?: string | undefined;
            description?: string | undefined;
            accessibility?: string[] | undefined;
            safety?: {
                rating?: "low" | "medium" | "high" | undefined;
                notes?: string | undefined;
            } | undefined;
            similarEvents?: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
            }[] | undefined;
            map?: {
                lat: number;
                lng: number;
                zoom: number;
            } | undefined;
        }, {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            categories?: string[] | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            locale?: string | undefined;
            timezone?: string | undefined;
            ticketUrl?: string | undefined;
            description?: string | undefined;
            accessibility?: string[] | undefined;
            safety?: {
                rating?: "low" | "medium" | "high" | undefined;
                notes?: string | undefined;
            } | undefined;
            similarEvents?: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
            }[] | undefined;
            map?: {
                lat: number;
                lng: number;
                zoom?: number | undefined;
            } | undefined;
        }>;
        layout: z.ZodDefault<z.ZodEnum<["modal", "page"]>>;
    }, "strip", z.ZodTypeAny, {
        layout: "modal" | "page";
        event: {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            categories: string[];
            locale: string;
            timezone: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            ticketUrl?: string | undefined;
            description?: string | undefined;
            accessibility?: string[] | undefined;
            safety?: {
                rating?: "low" | "medium" | "high" | undefined;
                notes?: string | undefined;
            } | undefined;
            similarEvents?: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
            }[] | undefined;
            map?: {
                lat: number;
                lng: number;
                zoom: number;
            } | undefined;
        };
    }, {
        event: {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            categories?: string[] | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            locale?: string | undefined;
            timezone?: string | undefined;
            ticketUrl?: string | undefined;
            description?: string | undefined;
            accessibility?: string[] | undefined;
            safety?: {
                rating?: "low" | "medium" | "high" | undefined;
                notes?: string | undefined;
            } | undefined;
            similarEvents?: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
            }[] | undefined;
            map?: {
                lat: number;
                lng: number;
                zoom?: number | undefined;
            } | undefined;
        };
        layout?: "modal" | "page" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        layout: "modal" | "page";
        event: {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            categories: string[];
            locale: string;
            timezone: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            ticketUrl?: string | undefined;
            description?: string | undefined;
            accessibility?: string[] | undefined;
            safety?: {
                rating?: "low" | "medium" | "high" | undefined;
                notes?: string | undefined;
            } | undefined;
            similarEvents?: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
            }[] | undefined;
            map?: {
                lat: number;
                lng: number;
                zoom: number;
            } | undefined;
        };
    };
    id: string;
    key: string;
    kind: "event-detail";
    version: "1.5" | "1.6";
    order: number;
    layout: {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    };
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}, {
    data: {
        event: {
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            source: {
                id: string;
                provider: string;
            };
            endDate?: string | undefined;
            categories?: string[] | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            locale?: string | undefined;
            timezone?: string | undefined;
            ticketUrl?: string | undefined;
            description?: string | undefined;
            accessibility?: string[] | undefined;
            safety?: {
                rating?: "low" | "medium" | "high" | undefined;
                notes?: string | undefined;
            } | undefined;
            similarEvents?: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
            }[] | undefined;
            map?: {
                lat: number;
                lng: number;
                zoom?: number | undefined;
            } | undefined;
        };
        layout?: "modal" | "page" | undefined;
    };
    id: string;
    key: string;
    kind: "event-detail";
    order: number;
    version?: "1.5" | "1.6" | undefined;
    layout?: {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    } | undefined;
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    order: z.ZodNumber;
    layout: z.ZodDefault<z.ZodObject<{
        fullWidth: z.ZodDefault<z.ZodBoolean>;
        height: z.ZodOptional<z.ZodString>;
        minHeight: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }, {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        viewKey: z.ZodString;
        surface: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    }, "strip", z.ZodTypeAny, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }>>;
    a11y: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    kind: z.ZodLiteral<"seo-collection">;
    data: z.ZodObject<{
        html: z.ZodString;
        jsonLd: z.ZodOptional<z.ZodString>;
        criticalCss: z.ZodString;
        hashedCss: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        html: string;
        criticalCss: string;
        hashedCss: string;
        jsonLd?: string | undefined;
    }, {
        html: string;
        criticalCss: string;
        hashedCss: string;
        jsonLd?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        html: string;
        criticalCss: string;
        hashedCss: string;
        jsonLd?: string | undefined;
    };
    id: string;
    key: string;
    kind: "seo-collection";
    version: "1.5" | "1.6";
    order: number;
    layout: {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    };
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}, {
    data: {
        html: string;
        criticalCss: string;
        hashedCss: string;
        jsonLd?: string | undefined;
    };
    id: string;
    key: string;
    kind: "seo-collection";
    order: number;
    version?: "1.5" | "1.6" | undefined;
    layout?: {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    } | undefined;
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    order: z.ZodNumber;
    layout: z.ZodDefault<z.ZodObject<{
        fullWidth: z.ZodDefault<z.ZodBoolean>;
        height: z.ZodOptional<z.ZodString>;
        minHeight: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }, {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        viewKey: z.ZodString;
        surface: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    }, "strip", z.ZodTypeAny, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }>>;
    a11y: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    kind: z.ZodLiteral<"seo-detail">;
    data: z.ZodObject<{
        html: z.ZodString;
        jsonLd: z.ZodOptional<z.ZodString>;
        criticalCss: z.ZodString;
        hashedCss: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        html: string;
        criticalCss: string;
        hashedCss: string;
        jsonLd?: string | undefined;
    }, {
        html: string;
        criticalCss: string;
        hashedCss: string;
        jsonLd?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        html: string;
        criticalCss: string;
        hashedCss: string;
        jsonLd?: string | undefined;
    };
    id: string;
    key: string;
    kind: "seo-detail";
    version: "1.5" | "1.6";
    order: number;
    layout: {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    };
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}, {
    data: {
        html: string;
        criticalCss: string;
        hashedCss: string;
        jsonLd?: string | undefined;
    };
    id: string;
    key: string;
    kind: "seo-detail";
    order: number;
    version?: "1.5" | "1.6" | undefined;
    layout?: {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    } | undefined;
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    order: z.ZodNumber;
    layout: z.ZodDefault<z.ZodObject<{
        fullWidth: z.ZodDefault<z.ZodBoolean>;
        height: z.ZodOptional<z.ZodString>;
        minHeight: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }, {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        viewKey: z.ZodString;
        surface: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    }, "strip", z.ZodTypeAny, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }>>;
    a11y: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    kind: z.ZodLiteral<"map-grid">;
    data: z.ZodObject<{
        events: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            canonicalId: z.ZodString;
            name: z.ZodString;
            venue: z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                geo: z.ZodOptional<z.ZodObject<{
                    lat: z.ZodNumber;
                    lng: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    lat: number;
                    lng: number;
                }, {
                    lat: number;
                    lng: number;
                }>>;
                address: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            }, {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            }>;
            startDate: z.ZodString;
            endDate: z.ZodOptional<z.ZodString>;
            categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            heroImage: z.ZodOptional<z.ZodObject<{
                url: z.ZodString;
                alt: z.ZodString;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                focalPoint: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    x: number;
                    y: number;
                }, {
                    x: number;
                    y: number;
                }>>;
            }, "strip", z.ZodTypeAny, {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            }, {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            }>>;
            price: z.ZodOptional<z.ZodObject<{
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                currency: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            }, {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            }>>;
            distanceKm: z.ZodOptional<z.ZodNumber>;
            whyGo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            locale: z.ZodDefault<z.ZodString>;
            timezone: z.ZodDefault<z.ZodString>;
            ticketUrl: z.ZodOptional<z.ZodString>;
            source: z.ZodObject<{
                provider: z.ZodString;
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                provider: string;
            }, {
                id: string;
                provider: string;
            }>;
            map: z.ZodObject<{
                lat: z.ZodNumber;
                lng: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                lat: number;
                lng: number;
            }, {
                lat: number;
                lng: number;
            }>;
            listIndex: z.ZodNumber;
            clusterId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            map: {
                lat: number;
                lng: number;
            };
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            categories: string[];
            locale: string;
            timezone: string;
            source: {
                id: string;
                provider: string;
            };
            listIndex: number;
            endDate?: string | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            ticketUrl?: string | undefined;
            clusterId?: string | undefined;
        }, {
            map: {
                lat: number;
                lng: number;
            };
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            source: {
                id: string;
                provider: string;
            };
            listIndex: number;
            endDate?: string | undefined;
            categories?: string[] | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            locale?: string | undefined;
            timezone?: string | undefined;
            ticketUrl?: string | undefined;
            clusterId?: string | undefined;
        }>, "many">;
        viewport: z.ZodObject<{
            center: z.ZodObject<{
                lat: z.ZodNumber;
                lng: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                lat: number;
                lng: number;
            }, {
                lat: number;
                lng: number;
            }>;
            zoom: z.ZodNumber;
            bounds: z.ZodOptional<z.ZodObject<{
                ne: z.ZodObject<{
                    lat: z.ZodNumber;
                    lng: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    lat: number;
                    lng: number;
                }, {
                    lat: number;
                    lng: number;
                }>;
                sw: z.ZodObject<{
                    lat: z.ZodNumber;
                    lng: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    lat: number;
                    lng: number;
                }, {
                    lat: number;
                    lng: number;
                }>;
            }, "strip", z.ZodTypeAny, {
                ne: {
                    lat: number;
                    lng: number;
                };
                sw: {
                    lat: number;
                    lng: number;
                };
            }, {
                ne: {
                    lat: number;
                    lng: number;
                };
                sw: {
                    lat: number;
                    lng: number;
                };
            }>>;
        }, "strip", z.ZodTypeAny, {
            zoom: number;
            center: {
                lat: number;
                lng: number;
            };
            bounds?: {
                ne: {
                    lat: number;
                    lng: number;
                };
                sw: {
                    lat: number;
                    lng: number;
                };
            } | undefined;
        }, {
            zoom: number;
            center: {
                lat: number;
                lng: number;
            };
            bounds?: {
                ne: {
                    lat: number;
                    lng: number;
                };
                sw: {
                    lat: number;
                    lng: number;
                };
            } | undefined;
        }>;
        parityChecksum: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        events: {
            map: {
                lat: number;
                lng: number;
            };
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            categories: string[];
            locale: string;
            timezone: string;
            source: {
                id: string;
                provider: string;
            };
            listIndex: number;
            endDate?: string | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            ticketUrl?: string | undefined;
            clusterId?: string | undefined;
        }[];
        viewport: {
            zoom: number;
            center: {
                lat: number;
                lng: number;
            };
            bounds?: {
                ne: {
                    lat: number;
                    lng: number;
                };
                sw: {
                    lat: number;
                    lng: number;
                };
            } | undefined;
        };
        parityChecksum: string;
    }, {
        events: {
            map: {
                lat: number;
                lng: number;
            };
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            source: {
                id: string;
                provider: string;
            };
            listIndex: number;
            endDate?: string | undefined;
            categories?: string[] | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            locale?: string | undefined;
            timezone?: string | undefined;
            ticketUrl?: string | undefined;
            clusterId?: string | undefined;
        }[];
        viewport: {
            zoom: number;
            center: {
                lat: number;
                lng: number;
            };
            bounds?: {
                ne: {
                    lat: number;
                    lng: number;
                };
                sw: {
                    lat: number;
                    lng: number;
                };
            } | undefined;
        };
        parityChecksum: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        events: {
            map: {
                lat: number;
                lng: number;
            };
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            categories: string[];
            locale: string;
            timezone: string;
            source: {
                id: string;
                provider: string;
            };
            listIndex: number;
            endDate?: string | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                currency: string;
                min?: number | undefined;
                max?: number | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            ticketUrl?: string | undefined;
            clusterId?: string | undefined;
        }[];
        viewport: {
            zoom: number;
            center: {
                lat: number;
                lng: number;
            };
            bounds?: {
                ne: {
                    lat: number;
                    lng: number;
                };
                sw: {
                    lat: number;
                    lng: number;
                };
            } | undefined;
        };
        parityChecksum: string;
    };
    id: string;
    key: string;
    kind: "map-grid";
    version: "1.5" | "1.6";
    order: number;
    layout: {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    };
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}, {
    data: {
        events: {
            map: {
                lat: number;
                lng: number;
            };
            id: string;
            canonicalId: string;
            name: string;
            venue: {
                id: string;
                name: string;
                geo?: {
                    lat: number;
                    lng: number;
                } | undefined;
                address?: string | undefined;
            };
            startDate: string;
            source: {
                id: string;
                provider: string;
            };
            listIndex: number;
            endDate?: string | undefined;
            categories?: string[] | undefined;
            heroImage?: {
                url: string;
                alt: string;
                width?: number | undefined;
                height?: number | undefined;
                focalPoint?: {
                    x: number;
                    y: number;
                } | undefined;
            } | undefined;
            price?: {
                min?: number | undefined;
                max?: number | undefined;
                currency?: string | undefined;
            } | undefined;
            distanceKm?: number | undefined;
            whyGo?: string[] | undefined;
            locale?: string | undefined;
            timezone?: string | undefined;
            ticketUrl?: string | undefined;
            clusterId?: string | undefined;
        }[];
        viewport: {
            zoom: number;
            center: {
                lat: number;
                lng: number;
            };
            bounds?: {
                ne: {
                    lat: number;
                    lng: number;
                };
                sw: {
                    lat: number;
                    lng: number;
                };
            } | undefined;
        };
        parityChecksum: string;
    };
    id: string;
    key: string;
    kind: "map-grid";
    order: number;
    version?: "1.5" | "1.6" | undefined;
    layout?: {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    } | undefined;
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    order: z.ZodNumber;
    layout: z.ZodDefault<z.ZodObject<{
        fullWidth: z.ZodDefault<z.ZodBoolean>;
        height: z.ZodOptional<z.ZodString>;
        minHeight: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }, {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        viewKey: z.ZodString;
        surface: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    }, "strip", z.ZodTypeAny, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }>>;
    a11y: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    kind: z.ZodLiteral<"promo-slot">;
    data: z.ZodObject<{
        slotId: z.ZodString;
        advertiser: z.ZodOptional<z.ZodString>;
        disclosure: z.ZodDefault<z.ZodString>;
        measurement: z.ZodObject<{
            impressionUrl: z.ZodOptional<z.ZodString>;
            clickUrl: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            impressionUrl?: string | undefined;
            clickUrl?: string | undefined;
        }, {
            impressionUrl?: string | undefined;
            clickUrl?: string | undefined;
        }>;
        safety: z.ZodObject<{
            blockedCategories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            brandSuitability: z.ZodDefault<z.ZodEnum<["strict", "moderate", "relaxed"]>>;
        }, "strip", z.ZodTypeAny, {
            blockedCategories: string[];
            brandSuitability: "strict" | "moderate" | "relaxed";
        }, {
            blockedCategories?: string[] | undefined;
            brandSuitability?: "strict" | "moderate" | "relaxed" | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        safety: {
            blockedCategories: string[];
            brandSuitability: "strict" | "moderate" | "relaxed";
        };
        slotId: string;
        disclosure: string;
        measurement: {
            impressionUrl?: string | undefined;
            clickUrl?: string | undefined;
        };
        advertiser?: string | undefined;
    }, {
        safety: {
            blockedCategories?: string[] | undefined;
            brandSuitability?: "strict" | "moderate" | "relaxed" | undefined;
        };
        slotId: string;
        measurement: {
            impressionUrl?: string | undefined;
            clickUrl?: string | undefined;
        };
        advertiser?: string | undefined;
        disclosure?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        safety: {
            blockedCategories: string[];
            brandSuitability: "strict" | "moderate" | "relaxed";
        };
        slotId: string;
        disclosure: string;
        measurement: {
            impressionUrl?: string | undefined;
            clickUrl?: string | undefined;
        };
        advertiser?: string | undefined;
    };
    id: string;
    key: string;
    kind: "promo-slot";
    version: "1.5" | "1.6";
    order: number;
    layout: {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    };
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}, {
    data: {
        safety: {
            blockedCategories?: string[] | undefined;
            brandSuitability?: "strict" | "moderate" | "relaxed" | undefined;
        };
        slotId: string;
        measurement: {
            impressionUrl?: string | undefined;
            clickUrl?: string | undefined;
        };
        advertiser?: string | undefined;
        disclosure?: string | undefined;
    };
    id: string;
    key: string;
    kind: "promo-slot";
    order: number;
    version?: "1.5" | "1.6" | undefined;
    layout?: {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    } | undefined;
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    order: z.ZodNumber;
    layout: z.ZodDefault<z.ZodObject<{
        fullWidth: z.ZodDefault<z.ZodBoolean>;
        height: z.ZodOptional<z.ZodString>;
        minHeight: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }, {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        viewKey: z.ZodString;
        surface: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    }, "strip", z.ZodTypeAny, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }, {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    }>>;
    a11y: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }, {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    }>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    kind: z.ZodLiteral<"event-mini-chat">;
    data: z.ZodObject<{
        eventId: z.ZodString;
        conversationId: z.ZodString;
        starterQuestions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        availability: z.ZodObject<{
            requiresConsent: z.ZodDefault<z.ZodBoolean>;
            personalization: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            requiresConsent: boolean;
            personalization: boolean;
        }, {
            requiresConsent?: boolean | undefined;
            personalization?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        eventId: string;
        conversationId: string;
        starterQuestions: string[];
        availability: {
            requiresConsent: boolean;
            personalization: boolean;
        };
    }, {
        eventId: string;
        conversationId: string;
        availability: {
            requiresConsent?: boolean | undefined;
            personalization?: boolean | undefined;
        };
        starterQuestions?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        eventId: string;
        conversationId: string;
        starterQuestions: string[];
        availability: {
            requiresConsent: boolean;
            personalization: boolean;
        };
    };
    id: string;
    key: string;
    kind: "event-mini-chat";
    version: "1.5" | "1.6";
    order: number;
    layout: {
        fullWidth: boolean;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    };
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}, {
    data: {
        eventId: string;
        conversationId: string;
        availability: {
            requiresConsent?: boolean | undefined;
            personalization?: boolean | undefined;
        };
        starterQuestions?: string[] | undefined;
    };
    id: string;
    key: string;
    kind: "event-mini-chat";
    order: number;
    version?: "1.5" | "1.6" | undefined;
    layout?: {
        fullWidth?: boolean | undefined;
        height?: string | undefined;
        minHeight?: string | undefined;
        background?: string | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
    } | undefined;
    analytics?: {
        viewKey: string;
        surface: string;
        attributes?: Record<string, string | number | boolean> | undefined;
    } | undefined;
    a11y?: {
        label?: string | undefined;
        describedBy?: string[] | undefined;
        role?: string | undefined;
    } | undefined;
    featureFlags?: string[] | undefined;
}>]>;
declare const PlanCursorSchema: z.ZodObject<{
    blockKey: z.ZodString;
    cursor: z.ZodString;
    exhausted: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    cursor: string;
    blockKey: string;
    exhausted: boolean;
}, {
    cursor: string;
    blockKey: string;
    exhausted?: boolean | undefined;
}>;
export declare const PageDocSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    path: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodString;
    updatedAt: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodString>;
    version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
    blocks: z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
        order: z.ZodNumber;
        layout: z.ZodDefault<z.ZodObject<{
            fullWidth: z.ZodDefault<z.ZodBoolean>;
            height: z.ZodOptional<z.ZodString>;
            minHeight: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }, {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            viewKey: z.ZodString;
            surface: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, "strip", z.ZodTypeAny, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }>>;
        a11y: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }>>;
        featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        kind: z.ZodLiteral<"ai-dock">;
        data: z.ZodObject<{
            entryPointLabel: z.ZodDefault<z.ZodString>;
            welcomeMessages: z.ZodDefault<z.ZodArray<z.ZodObject<{
                role: z.ZodEnum<["system", "user", "assistant"]>;
                content: z.ZodString;
                eventId: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                role: "system" | "user" | "assistant";
                content: string;
                eventId?: string | undefined;
            }, {
                role: "system" | "user" | "assistant";
                content: string;
                eventId?: string | undefined;
            }>, "many">>;
            conversationId: z.ZodString;
            allowedScopes: z.ZodDefault<z.ZodArray<z.ZodEnum<["global", "event"]>, "many">>;
        }, "strip", z.ZodTypeAny, {
            entryPointLabel: string;
            welcomeMessages: {
                role: "system" | "user" | "assistant";
                content: string;
                eventId?: string | undefined;
            }[];
            conversationId: string;
            allowedScopes: ("global" | "event")[];
        }, {
            conversationId: string;
            entryPointLabel?: string | undefined;
            welcomeMessages?: {
                role: "system" | "user" | "assistant";
                content: string;
                eventId?: string | undefined;
            }[] | undefined;
            allowedScopes?: ("global" | "event")[] | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            entryPointLabel: string;
            welcomeMessages: {
                role: "system" | "user" | "assistant";
                content: string;
                eventId?: string | undefined;
            }[];
            conversationId: string;
            allowedScopes: ("global" | "event")[];
        };
        id: string;
        key: string;
        kind: "ai-dock";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }, {
        data: {
            conversationId: string;
            entryPointLabel?: string | undefined;
            welcomeMessages?: {
                role: "system" | "user" | "assistant";
                content: string;
                eventId?: string | undefined;
            }[] | undefined;
            allowedScopes?: ("global" | "event")[] | undefined;
        };
        id: string;
        key: string;
        kind: "ai-dock";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
        order: z.ZodNumber;
        layout: z.ZodDefault<z.ZodObject<{
            fullWidth: z.ZodDefault<z.ZodBoolean>;
            height: z.ZodOptional<z.ZodString>;
            minHeight: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }, {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            viewKey: z.ZodString;
            surface: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, "strip", z.ZodTypeAny, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }>>;
        a11y: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }>>;
        featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        kind: z.ZodLiteral<"filter-bar">;
        data: z.ZodObject<{
            facets: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                type: z.ZodEnum<["date", "category", "price", "distance", "family", "accessibility", "neighborhood"]>;
                options: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    label: z.ZodString;
                    count: z.ZodOptional<z.ZodNumber>;
                    icon: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    label: string;
                    id: string;
                    count?: number | undefined;
                    icon?: string | undefined;
                }, {
                    label: string;
                    id: string;
                    count?: number | undefined;
                    icon?: string | undefined;
                }>, "many">;
                multi: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                options: {
                    label: string;
                    id: string;
                    count?: number | undefined;
                    icon?: string | undefined;
                }[];
                type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
                label: string;
                id: string;
                multi: boolean;
            }, {
                options: {
                    label: string;
                    id: string;
                    count?: number | undefined;
                    icon?: string | undefined;
                }[];
                type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
                label: string;
                id: string;
                multi?: boolean | undefined;
            }>, "many">;
            active: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodString]>>;
            sortOptions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                default: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                label: string;
                id: string;
                default?: boolean | undefined;
            }, {
                label: string;
                id: string;
                default?: boolean | undefined;
            }>, "many">;
            flags: z.ZodDefault<z.ZodObject<{
                showReset: z.ZodDefault<z.ZodBoolean>;
                floating: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                showReset: boolean;
                floating: boolean;
            }, {
                showReset?: boolean | undefined;
                floating?: boolean | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            facets: {
                options: {
                    label: string;
                    id: string;
                    count?: number | undefined;
                    icon?: string | undefined;
                }[];
                type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
                label: string;
                id: string;
                multi: boolean;
            }[];
            active: Record<string, string | string[]>;
            sortOptions: {
                label: string;
                id: string;
                default?: boolean | undefined;
            }[];
            flags: {
                showReset: boolean;
                floating: boolean;
            };
        }, {
            facets: {
                options: {
                    label: string;
                    id: string;
                    count?: number | undefined;
                    icon?: string | undefined;
                }[];
                type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
                label: string;
                id: string;
                multi?: boolean | undefined;
            }[];
            active: Record<string, string | string[]>;
            sortOptions: {
                label: string;
                id: string;
                default?: boolean | undefined;
            }[];
            flags?: {
                showReset?: boolean | undefined;
                floating?: boolean | undefined;
            } | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            facets: {
                options: {
                    label: string;
                    id: string;
                    count?: number | undefined;
                    icon?: string | undefined;
                }[];
                type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
                label: string;
                id: string;
                multi: boolean;
            }[];
            active: Record<string, string | string[]>;
            sortOptions: {
                label: string;
                id: string;
                default?: boolean | undefined;
            }[];
            flags: {
                showReset: boolean;
                floating: boolean;
            };
        };
        id: string;
        key: string;
        kind: "filter-bar";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }, {
        data: {
            facets: {
                options: {
                    label: string;
                    id: string;
                    count?: number | undefined;
                    icon?: string | undefined;
                }[];
                type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
                label: string;
                id: string;
                multi?: boolean | undefined;
            }[];
            active: Record<string, string | string[]>;
            sortOptions: {
                label: string;
                id: string;
                default?: boolean | undefined;
            }[];
            flags?: {
                showReset?: boolean | undefined;
                floating?: boolean | undefined;
            } | undefined;
        };
        id: string;
        key: string;
        kind: "filter-bar";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
        order: z.ZodNumber;
        layout: z.ZodDefault<z.ZodObject<{
            fullWidth: z.ZodDefault<z.ZodBoolean>;
            height: z.ZodOptional<z.ZodString>;
            minHeight: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }, {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            viewKey: z.ZodString;
            surface: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, "strip", z.ZodTypeAny, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }>>;
        a11y: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }>>;
        featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        kind: z.ZodLiteral<"hero-carousel">;
        data: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                headline: z.ZodString;
                subhead: z.ZodOptional<z.ZodString>;
                image: z.ZodObject<{
                    url: z.ZodString;
                    alt: z.ZodString;
                    width: z.ZodOptional<z.ZodNumber>;
                    height: z.ZodOptional<z.ZodNumber>;
                    focalPoint: z.ZodOptional<z.ZodObject<{
                        x: z.ZodNumber;
                        y: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        x: number;
                        y: number;
                    }, {
                        x: number;
                        y: number;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }>;
                cta: z.ZodOptional<z.ZodObject<{
                    label: z.ZodString;
                    href: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    label: string;
                    href: string;
                }, {
                    label: string;
                    href: string;
                }>>;
                eventRef: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                headline: string;
                image: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                };
                subhead?: string | undefined;
                cta?: {
                    label: string;
                    href: string;
                } | undefined;
                eventRef?: string | undefined;
            }, {
                id: string;
                headline: string;
                image: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                };
                subhead?: string | undefined;
                cta?: {
                    label: string;
                    href: string;
                } | undefined;
                eventRef?: string | undefined;
            }>, "many">;
            autoplayMs: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            items: {
                id: string;
                headline: string;
                image: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                };
                subhead?: string | undefined;
                cta?: {
                    label: string;
                    href: string;
                } | undefined;
                eventRef?: string | undefined;
            }[];
            autoplayMs: number;
        }, {
            items: {
                id: string;
                headline: string;
                image: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                };
                subhead?: string | undefined;
                cta?: {
                    label: string;
                    href: string;
                } | undefined;
                eventRef?: string | undefined;
            }[];
            autoplayMs?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            items: {
                id: string;
                headline: string;
                image: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                };
                subhead?: string | undefined;
                cta?: {
                    label: string;
                    href: string;
                } | undefined;
                eventRef?: string | undefined;
            }[];
            autoplayMs: number;
        };
        id: string;
        key: string;
        kind: "hero-carousel";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }, {
        data: {
            items: {
                id: string;
                headline: string;
                image: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                };
                subhead?: string | undefined;
                cta?: {
                    label: string;
                    href: string;
                } | undefined;
                eventRef?: string | undefined;
            }[];
            autoplayMs?: number | undefined;
        };
        id: string;
        key: string;
        kind: "hero-carousel";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
        order: z.ZodNumber;
        layout: z.ZodDefault<z.ZodObject<{
            fullWidth: z.ZodDefault<z.ZodBoolean>;
            height: z.ZodOptional<z.ZodString>;
            minHeight: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }, {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            viewKey: z.ZodString;
            surface: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, "strip", z.ZodTypeAny, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }>>;
        a11y: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }>>;
        featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        kind: z.ZodLiteral<"collection-rail">;
        data: z.ZodObject<{
            title: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            events: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                canonicalId: z.ZodString;
                name: z.ZodString;
                venue: z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                    geo: z.ZodOptional<z.ZodObject<{
                        lat: z.ZodNumber;
                        lng: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        lat: number;
                        lng: number;
                    }, {
                        lat: number;
                        lng: number;
                    }>>;
                    address: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                }, {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                }>;
                startDate: z.ZodString;
                endDate: z.ZodOptional<z.ZodString>;
                categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                heroImage: z.ZodOptional<z.ZodObject<{
                    url: z.ZodString;
                    alt: z.ZodString;
                    width: z.ZodOptional<z.ZodNumber>;
                    height: z.ZodOptional<z.ZodNumber>;
                    focalPoint: z.ZodOptional<z.ZodObject<{
                        x: z.ZodNumber;
                        y: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        x: number;
                        y: number;
                    }, {
                        x: number;
                        y: number;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }>>;
                price: z.ZodOptional<z.ZodObject<{
                    min: z.ZodOptional<z.ZodNumber>;
                    max: z.ZodOptional<z.ZodNumber>;
                    currency: z.ZodDefault<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                }, {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                }>>;
                distanceKm: z.ZodOptional<z.ZodNumber>;
                whyGo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                locale: z.ZodDefault<z.ZodString>;
                timezone: z.ZodDefault<z.ZodString>;
                ticketUrl: z.ZodOptional<z.ZodString>;
                source: z.ZodObject<{
                    provider: z.ZodString;
                    id: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    provider: string;
                }, {
                    id: string;
                    provider: string;
                }>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
            }, {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
            }>, "many">;
            layout: z.ZodDefault<z.ZodEnum<["grid", "rail"]>>;
            streaming: z.ZodDefault<z.ZodObject<{
                cursor: z.ZodOptional<z.ZodString>;
                mode: z.ZodDefault<z.ZodEnum<["initial", "append"]>>;
            }, "strip", z.ZodTypeAny, {
                mode: "initial" | "append";
                cursor?: string | undefined;
            }, {
                cursor?: string | undefined;
                mode?: "initial" | "append" | undefined;
            }>>;
            diversity: z.ZodOptional<z.ZodObject<{
                venue: z.ZodDefault<z.ZodNumber>;
                date: z.ZodDefault<z.ZodNumber>;
                category: z.ZodDefault<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                date: number;
                venue: number;
                category: number;
            }, {
                venue?: number | undefined;
                date?: number | undefined;
                category?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            layout: "grid" | "rail";
            title: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
            }[];
            streaming: {
                mode: "initial" | "append";
                cursor?: string | undefined;
            };
            description?: string | undefined;
            diversity?: {
                date: number;
                venue: number;
                category: number;
            } | undefined;
        }, {
            title: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
            }[];
            description?: string | undefined;
            layout?: "grid" | "rail" | undefined;
            streaming?: {
                cursor?: string | undefined;
                mode?: "initial" | "append" | undefined;
            } | undefined;
            diversity?: {
                venue?: number | undefined;
                date?: number | undefined;
                category?: number | undefined;
            } | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            layout: "grid" | "rail";
            title: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
            }[];
            streaming: {
                mode: "initial" | "append";
                cursor?: string | undefined;
            };
            description?: string | undefined;
            diversity?: {
                date: number;
                venue: number;
                category: number;
            } | undefined;
        };
        id: string;
        key: string;
        kind: "collection-rail";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }, {
        data: {
            title: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
            }[];
            description?: string | undefined;
            layout?: "grid" | "rail" | undefined;
            streaming?: {
                cursor?: string | undefined;
                mode?: "initial" | "append" | undefined;
            } | undefined;
            diversity?: {
                venue?: number | undefined;
                date?: number | undefined;
                category?: number | undefined;
            } | undefined;
        };
        id: string;
        key: string;
        kind: "collection-rail";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
        order: z.ZodNumber;
        layout: z.ZodDefault<z.ZodObject<{
            fullWidth: z.ZodDefault<z.ZodBoolean>;
            height: z.ZodOptional<z.ZodString>;
            minHeight: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }, {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            viewKey: z.ZodString;
            surface: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, "strip", z.ZodTypeAny, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }>>;
        a11y: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }>>;
        featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        kind: z.ZodLiteral<"microcalendar">;
        data: z.ZodObject<{
            days: z.ZodArray<z.ZodObject<{
                date: z.ZodString;
                events: z.ZodArray<z.ZodObject<Pick<{
                    id: z.ZodString;
                    canonicalId: z.ZodString;
                    name: z.ZodString;
                    venue: z.ZodObject<{
                        id: z.ZodString;
                        name: z.ZodString;
                        geo: z.ZodOptional<z.ZodObject<{
                            lat: z.ZodNumber;
                            lng: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            lat: number;
                            lng: number;
                        }, {
                            lat: number;
                            lng: number;
                        }>>;
                        address: z.ZodOptional<z.ZodString>;
                    }, "strip", z.ZodTypeAny, {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    }, {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    }>;
                    startDate: z.ZodString;
                    endDate: z.ZodOptional<z.ZodString>;
                    categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                    heroImage: z.ZodOptional<z.ZodObject<{
                        url: z.ZodString;
                        alt: z.ZodString;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        focalPoint: z.ZodOptional<z.ZodObject<{
                            x: z.ZodNumber;
                            y: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            x: number;
                            y: number;
                        }, {
                            x: number;
                            y: number;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    }, {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    }>>;
                    price: z.ZodOptional<z.ZodObject<{
                        min: z.ZodOptional<z.ZodNumber>;
                        max: z.ZodOptional<z.ZodNumber>;
                        currency: z.ZodDefault<z.ZodString>;
                    }, "strip", z.ZodTypeAny, {
                        currency: string;
                        min?: number | undefined;
                        max?: number | undefined;
                    }, {
                        min?: number | undefined;
                        max?: number | undefined;
                        currency?: string | undefined;
                    }>>;
                    distanceKm: z.ZodOptional<z.ZodNumber>;
                    whyGo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    locale: z.ZodDefault<z.ZodString>;
                    timezone: z.ZodDefault<z.ZodString>;
                    ticketUrl: z.ZodOptional<z.ZodString>;
                    source: z.ZodObject<{
                        provider: z.ZodString;
                        id: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        id: string;
                        provider: string;
                    }, {
                        id: string;
                        provider: string;
                    }>;
                }, "id" | "canonicalId" | "name" | "startDate">, "strip", z.ZodTypeAny, {
                    id: string;
                    canonicalId: string;
                    name: string;
                    startDate: string;
                }, {
                    id: string;
                    canonicalId: string;
                    name: string;
                    startDate: string;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                date: string;
                events: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    startDate: string;
                }[];
            }, {
                date: string;
                events: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    startDate: string;
                }[];
            }>, "many">;
            timezone: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            timezone: string;
            days: {
                date: string;
                events: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    startDate: string;
                }[];
            }[];
        }, {
            days: {
                date: string;
                events: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    startDate: string;
                }[];
            }[];
            timezone?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            timezone: string;
            days: {
                date: string;
                events: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    startDate: string;
                }[];
            }[];
        };
        id: string;
        key: string;
        kind: "microcalendar";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }, {
        data: {
            days: {
                date: string;
                events: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    startDate: string;
                }[];
            }[];
            timezone?: string | undefined;
        };
        id: string;
        key: string;
        kind: "microcalendar";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
        order: z.ZodNumber;
        layout: z.ZodDefault<z.ZodObject<{
            fullWidth: z.ZodDefault<z.ZodBoolean>;
            height: z.ZodOptional<z.ZodString>;
            minHeight: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }, {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            viewKey: z.ZodString;
            surface: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, "strip", z.ZodTypeAny, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }>>;
        a11y: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }>>;
        featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        kind: z.ZodLiteral<"event-detail">;
        data: z.ZodObject<{
            event: z.ZodObject<{
                id: z.ZodString;
                canonicalId: z.ZodString;
                name: z.ZodString;
                venue: z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                    geo: z.ZodOptional<z.ZodObject<{
                        lat: z.ZodNumber;
                        lng: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        lat: number;
                        lng: number;
                    }, {
                        lat: number;
                        lng: number;
                    }>>;
                    address: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                }, {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                }>;
                startDate: z.ZodString;
                endDate: z.ZodOptional<z.ZodString>;
                categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                heroImage: z.ZodOptional<z.ZodObject<{
                    url: z.ZodString;
                    alt: z.ZodString;
                    width: z.ZodOptional<z.ZodNumber>;
                    height: z.ZodOptional<z.ZodNumber>;
                    focalPoint: z.ZodOptional<z.ZodObject<{
                        x: z.ZodNumber;
                        y: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        x: number;
                        y: number;
                    }, {
                        x: number;
                        y: number;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }>>;
                price: z.ZodOptional<z.ZodObject<{
                    min: z.ZodOptional<z.ZodNumber>;
                    max: z.ZodOptional<z.ZodNumber>;
                    currency: z.ZodDefault<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                }, {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                }>>;
                distanceKm: z.ZodOptional<z.ZodNumber>;
                whyGo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                locale: z.ZodDefault<z.ZodString>;
                timezone: z.ZodDefault<z.ZodString>;
                ticketUrl: z.ZodOptional<z.ZodString>;
                source: z.ZodObject<{
                    provider: z.ZodString;
                    id: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    provider: string;
                }, {
                    id: string;
                    provider: string;
                }>;
                description: z.ZodOptional<z.ZodString>;
                accessibility: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                safety: z.ZodOptional<z.ZodObject<{
                    rating: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
                    notes: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    rating?: "low" | "medium" | "high" | undefined;
                    notes?: string | undefined;
                }, {
                    rating?: "low" | "medium" | "high" | undefined;
                    notes?: string | undefined;
                }>>;
                similarEvents: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    canonicalId: z.ZodString;
                    name: z.ZodString;
                    venue: z.ZodObject<{
                        id: z.ZodString;
                        name: z.ZodString;
                        geo: z.ZodOptional<z.ZodObject<{
                            lat: z.ZodNumber;
                            lng: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            lat: number;
                            lng: number;
                        }, {
                            lat: number;
                            lng: number;
                        }>>;
                        address: z.ZodOptional<z.ZodString>;
                    }, "strip", z.ZodTypeAny, {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    }, {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    }>;
                    startDate: z.ZodString;
                    endDate: z.ZodOptional<z.ZodString>;
                    categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                    heroImage: z.ZodOptional<z.ZodObject<{
                        url: z.ZodString;
                        alt: z.ZodString;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        focalPoint: z.ZodOptional<z.ZodObject<{
                            x: z.ZodNumber;
                            y: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            x: number;
                            y: number;
                        }, {
                            x: number;
                            y: number;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    }, {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    }>>;
                    price: z.ZodOptional<z.ZodObject<{
                        min: z.ZodOptional<z.ZodNumber>;
                        max: z.ZodOptional<z.ZodNumber>;
                        currency: z.ZodDefault<z.ZodString>;
                    }, "strip", z.ZodTypeAny, {
                        currency: string;
                        min?: number | undefined;
                        max?: number | undefined;
                    }, {
                        min?: number | undefined;
                        max?: number | undefined;
                        currency?: string | undefined;
                    }>>;
                    distanceKm: z.ZodOptional<z.ZodNumber>;
                    whyGo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    locale: z.ZodDefault<z.ZodString>;
                    timezone: z.ZodDefault<z.ZodString>;
                    ticketUrl: z.ZodOptional<z.ZodString>;
                    source: z.ZodObject<{
                        provider: z.ZodString;
                        id: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        id: string;
                        provider: string;
                    }, {
                        id: string;
                        provider: string;
                    }>;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    canonicalId: string;
                    name: string;
                    venue: {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    };
                    startDate: string;
                    categories: string[];
                    locale: string;
                    timezone: string;
                    source: {
                        id: string;
                        provider: string;
                    };
                    endDate?: string | undefined;
                    heroImage?: {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    } | undefined;
                    price?: {
                        currency: string;
                        min?: number | undefined;
                        max?: number | undefined;
                    } | undefined;
                    distanceKm?: number | undefined;
                    whyGo?: string[] | undefined;
                    ticketUrl?: string | undefined;
                }, {
                    id: string;
                    canonicalId: string;
                    name: string;
                    venue: {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    };
                    startDate: string;
                    source: {
                        id: string;
                        provider: string;
                    };
                    endDate?: string | undefined;
                    categories?: string[] | undefined;
                    heroImage?: {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    } | undefined;
                    price?: {
                        min?: number | undefined;
                        max?: number | undefined;
                        currency?: string | undefined;
                    } | undefined;
                    distanceKm?: number | undefined;
                    whyGo?: string[] | undefined;
                    locale?: string | undefined;
                    timezone?: string | undefined;
                    ticketUrl?: string | undefined;
                }>, "many">>;
                map: z.ZodOptional<z.ZodObject<{
                    lat: z.ZodNumber;
                    lng: z.ZodNumber;
                    zoom: z.ZodDefault<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    lat: number;
                    lng: number;
                    zoom: number;
                }, {
                    lat: number;
                    lng: number;
                    zoom?: number | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
                description?: string | undefined;
                accessibility?: string[] | undefined;
                safety?: {
                    rating?: "low" | "medium" | "high" | undefined;
                    notes?: string | undefined;
                } | undefined;
                similarEvents?: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    venue: {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    };
                    startDate: string;
                    categories: string[];
                    locale: string;
                    timezone: string;
                    source: {
                        id: string;
                        provider: string;
                    };
                    endDate?: string | undefined;
                    heroImage?: {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    } | undefined;
                    price?: {
                        currency: string;
                        min?: number | undefined;
                        max?: number | undefined;
                    } | undefined;
                    distanceKm?: number | undefined;
                    whyGo?: string[] | undefined;
                    ticketUrl?: string | undefined;
                }[] | undefined;
                map?: {
                    lat: number;
                    lng: number;
                    zoom: number;
                } | undefined;
            }, {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
                description?: string | undefined;
                accessibility?: string[] | undefined;
                safety?: {
                    rating?: "low" | "medium" | "high" | undefined;
                    notes?: string | undefined;
                } | undefined;
                similarEvents?: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    venue: {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    };
                    startDate: string;
                    source: {
                        id: string;
                        provider: string;
                    };
                    endDate?: string | undefined;
                    categories?: string[] | undefined;
                    heroImage?: {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    } | undefined;
                    price?: {
                        min?: number | undefined;
                        max?: number | undefined;
                        currency?: string | undefined;
                    } | undefined;
                    distanceKm?: number | undefined;
                    whyGo?: string[] | undefined;
                    locale?: string | undefined;
                    timezone?: string | undefined;
                    ticketUrl?: string | undefined;
                }[] | undefined;
                map?: {
                    lat: number;
                    lng: number;
                    zoom?: number | undefined;
                } | undefined;
            }>;
            layout: z.ZodDefault<z.ZodEnum<["modal", "page"]>>;
        }, "strip", z.ZodTypeAny, {
            layout: "modal" | "page";
            event: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
                description?: string | undefined;
                accessibility?: string[] | undefined;
                safety?: {
                    rating?: "low" | "medium" | "high" | undefined;
                    notes?: string | undefined;
                } | undefined;
                similarEvents?: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    venue: {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    };
                    startDate: string;
                    categories: string[];
                    locale: string;
                    timezone: string;
                    source: {
                        id: string;
                        provider: string;
                    };
                    endDate?: string | undefined;
                    heroImage?: {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    } | undefined;
                    price?: {
                        currency: string;
                        min?: number | undefined;
                        max?: number | undefined;
                    } | undefined;
                    distanceKm?: number | undefined;
                    whyGo?: string[] | undefined;
                    ticketUrl?: string | undefined;
                }[] | undefined;
                map?: {
                    lat: number;
                    lng: number;
                    zoom: number;
                } | undefined;
            };
        }, {
            event: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
                description?: string | undefined;
                accessibility?: string[] | undefined;
                safety?: {
                    rating?: "low" | "medium" | "high" | undefined;
                    notes?: string | undefined;
                } | undefined;
                similarEvents?: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    venue: {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    };
                    startDate: string;
                    source: {
                        id: string;
                        provider: string;
                    };
                    endDate?: string | undefined;
                    categories?: string[] | undefined;
                    heroImage?: {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    } | undefined;
                    price?: {
                        min?: number | undefined;
                        max?: number | undefined;
                        currency?: string | undefined;
                    } | undefined;
                    distanceKm?: number | undefined;
                    whyGo?: string[] | undefined;
                    locale?: string | undefined;
                    timezone?: string | undefined;
                    ticketUrl?: string | undefined;
                }[] | undefined;
                map?: {
                    lat: number;
                    lng: number;
                    zoom?: number | undefined;
                } | undefined;
            };
            layout?: "modal" | "page" | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            layout: "modal" | "page";
            event: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
                description?: string | undefined;
                accessibility?: string[] | undefined;
                safety?: {
                    rating?: "low" | "medium" | "high" | undefined;
                    notes?: string | undefined;
                } | undefined;
                similarEvents?: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    venue: {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    };
                    startDate: string;
                    categories: string[];
                    locale: string;
                    timezone: string;
                    source: {
                        id: string;
                        provider: string;
                    };
                    endDate?: string | undefined;
                    heroImage?: {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    } | undefined;
                    price?: {
                        currency: string;
                        min?: number | undefined;
                        max?: number | undefined;
                    } | undefined;
                    distanceKm?: number | undefined;
                    whyGo?: string[] | undefined;
                    ticketUrl?: string | undefined;
                }[] | undefined;
                map?: {
                    lat: number;
                    lng: number;
                    zoom: number;
                } | undefined;
            };
        };
        id: string;
        key: string;
        kind: "event-detail";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }, {
        data: {
            event: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
                description?: string | undefined;
                accessibility?: string[] | undefined;
                safety?: {
                    rating?: "low" | "medium" | "high" | undefined;
                    notes?: string | undefined;
                } | undefined;
                similarEvents?: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    venue: {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    };
                    startDate: string;
                    source: {
                        id: string;
                        provider: string;
                    };
                    endDate?: string | undefined;
                    categories?: string[] | undefined;
                    heroImage?: {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    } | undefined;
                    price?: {
                        min?: number | undefined;
                        max?: number | undefined;
                        currency?: string | undefined;
                    } | undefined;
                    distanceKm?: number | undefined;
                    whyGo?: string[] | undefined;
                    locale?: string | undefined;
                    timezone?: string | undefined;
                    ticketUrl?: string | undefined;
                }[] | undefined;
                map?: {
                    lat: number;
                    lng: number;
                    zoom?: number | undefined;
                } | undefined;
            };
            layout?: "modal" | "page" | undefined;
        };
        id: string;
        key: string;
        kind: "event-detail";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
        order: z.ZodNumber;
        layout: z.ZodDefault<z.ZodObject<{
            fullWidth: z.ZodDefault<z.ZodBoolean>;
            height: z.ZodOptional<z.ZodString>;
            minHeight: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }, {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            viewKey: z.ZodString;
            surface: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, "strip", z.ZodTypeAny, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }>>;
        a11y: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }>>;
        featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        kind: z.ZodLiteral<"seo-collection">;
        data: z.ZodObject<{
            html: z.ZodString;
            jsonLd: z.ZodOptional<z.ZodString>;
            criticalCss: z.ZodString;
            hashedCss: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        }, {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        };
        id: string;
        key: string;
        kind: "seo-collection";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }, {
        data: {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        };
        id: string;
        key: string;
        kind: "seo-collection";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
        order: z.ZodNumber;
        layout: z.ZodDefault<z.ZodObject<{
            fullWidth: z.ZodDefault<z.ZodBoolean>;
            height: z.ZodOptional<z.ZodString>;
            minHeight: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }, {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            viewKey: z.ZodString;
            surface: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, "strip", z.ZodTypeAny, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }>>;
        a11y: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }>>;
        featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        kind: z.ZodLiteral<"seo-detail">;
        data: z.ZodObject<{
            html: z.ZodString;
            jsonLd: z.ZodOptional<z.ZodString>;
            criticalCss: z.ZodString;
            hashedCss: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        }, {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        };
        id: string;
        key: string;
        kind: "seo-detail";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }, {
        data: {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        };
        id: string;
        key: string;
        kind: "seo-detail";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
        order: z.ZodNumber;
        layout: z.ZodDefault<z.ZodObject<{
            fullWidth: z.ZodDefault<z.ZodBoolean>;
            height: z.ZodOptional<z.ZodString>;
            minHeight: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }, {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            viewKey: z.ZodString;
            surface: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, "strip", z.ZodTypeAny, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }>>;
        a11y: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }>>;
        featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        kind: z.ZodLiteral<"map-grid">;
        data: z.ZodObject<{
            events: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                canonicalId: z.ZodString;
                name: z.ZodString;
                venue: z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                    geo: z.ZodOptional<z.ZodObject<{
                        lat: z.ZodNumber;
                        lng: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        lat: number;
                        lng: number;
                    }, {
                        lat: number;
                        lng: number;
                    }>>;
                    address: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                }, {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                }>;
                startDate: z.ZodString;
                endDate: z.ZodOptional<z.ZodString>;
                categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                heroImage: z.ZodOptional<z.ZodObject<{
                    url: z.ZodString;
                    alt: z.ZodString;
                    width: z.ZodOptional<z.ZodNumber>;
                    height: z.ZodOptional<z.ZodNumber>;
                    focalPoint: z.ZodOptional<z.ZodObject<{
                        x: z.ZodNumber;
                        y: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        x: number;
                        y: number;
                    }, {
                        x: number;
                        y: number;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }, {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                }>>;
                price: z.ZodOptional<z.ZodObject<{
                    min: z.ZodOptional<z.ZodNumber>;
                    max: z.ZodOptional<z.ZodNumber>;
                    currency: z.ZodDefault<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                }, {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                }>>;
                distanceKm: z.ZodOptional<z.ZodNumber>;
                whyGo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                locale: z.ZodDefault<z.ZodString>;
                timezone: z.ZodDefault<z.ZodString>;
                ticketUrl: z.ZodOptional<z.ZodString>;
                source: z.ZodObject<{
                    provider: z.ZodString;
                    id: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    provider: string;
                }, {
                    id: string;
                    provider: string;
                }>;
                map: z.ZodObject<{
                    lat: z.ZodNumber;
                    lng: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    lat: number;
                    lng: number;
                }, {
                    lat: number;
                    lng: number;
                }>;
                listIndex: z.ZodNumber;
                clusterId: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                map: {
                    lat: number;
                    lng: number;
                };
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                listIndex: number;
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
                clusterId?: string | undefined;
            }, {
                map: {
                    lat: number;
                    lng: number;
                };
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                listIndex: number;
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
                clusterId?: string | undefined;
            }>, "many">;
            viewport: z.ZodObject<{
                center: z.ZodObject<{
                    lat: z.ZodNumber;
                    lng: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    lat: number;
                    lng: number;
                }, {
                    lat: number;
                    lng: number;
                }>;
                zoom: z.ZodNumber;
                bounds: z.ZodOptional<z.ZodObject<{
                    ne: z.ZodObject<{
                        lat: z.ZodNumber;
                        lng: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        lat: number;
                        lng: number;
                    }, {
                        lat: number;
                        lng: number;
                    }>;
                    sw: z.ZodObject<{
                        lat: z.ZodNumber;
                        lng: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        lat: number;
                        lng: number;
                    }, {
                        lat: number;
                        lng: number;
                    }>;
                }, "strip", z.ZodTypeAny, {
                    ne: {
                        lat: number;
                        lng: number;
                    };
                    sw: {
                        lat: number;
                        lng: number;
                    };
                }, {
                    ne: {
                        lat: number;
                        lng: number;
                    };
                    sw: {
                        lat: number;
                        lng: number;
                    };
                }>>;
            }, "strip", z.ZodTypeAny, {
                zoom: number;
                center: {
                    lat: number;
                    lng: number;
                };
                bounds?: {
                    ne: {
                        lat: number;
                        lng: number;
                    };
                    sw: {
                        lat: number;
                        lng: number;
                    };
                } | undefined;
            }, {
                zoom: number;
                center: {
                    lat: number;
                    lng: number;
                };
                bounds?: {
                    ne: {
                        lat: number;
                        lng: number;
                    };
                    sw: {
                        lat: number;
                        lng: number;
                    };
                } | undefined;
            }>;
            parityChecksum: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            events: {
                map: {
                    lat: number;
                    lng: number;
                };
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                listIndex: number;
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
                clusterId?: string | undefined;
            }[];
            viewport: {
                zoom: number;
                center: {
                    lat: number;
                    lng: number;
                };
                bounds?: {
                    ne: {
                        lat: number;
                        lng: number;
                    };
                    sw: {
                        lat: number;
                        lng: number;
                    };
                } | undefined;
            };
            parityChecksum: string;
        }, {
            events: {
                map: {
                    lat: number;
                    lng: number;
                };
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                listIndex: number;
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
                clusterId?: string | undefined;
            }[];
            viewport: {
                zoom: number;
                center: {
                    lat: number;
                    lng: number;
                };
                bounds?: {
                    ne: {
                        lat: number;
                        lng: number;
                    };
                    sw: {
                        lat: number;
                        lng: number;
                    };
                } | undefined;
            };
            parityChecksum: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            events: {
                map: {
                    lat: number;
                    lng: number;
                };
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                listIndex: number;
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
                clusterId?: string | undefined;
            }[];
            viewport: {
                zoom: number;
                center: {
                    lat: number;
                    lng: number;
                };
                bounds?: {
                    ne: {
                        lat: number;
                        lng: number;
                    };
                    sw: {
                        lat: number;
                        lng: number;
                    };
                } | undefined;
            };
            parityChecksum: string;
        };
        id: string;
        key: string;
        kind: "map-grid";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }, {
        data: {
            events: {
                map: {
                    lat: number;
                    lng: number;
                };
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                listIndex: number;
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
                clusterId?: string | undefined;
            }[];
            viewport: {
                zoom: number;
                center: {
                    lat: number;
                    lng: number;
                };
                bounds?: {
                    ne: {
                        lat: number;
                        lng: number;
                    };
                    sw: {
                        lat: number;
                        lng: number;
                    };
                } | undefined;
            };
            parityChecksum: string;
        };
        id: string;
        key: string;
        kind: "map-grid";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
        order: z.ZodNumber;
        layout: z.ZodDefault<z.ZodObject<{
            fullWidth: z.ZodDefault<z.ZodBoolean>;
            height: z.ZodOptional<z.ZodString>;
            minHeight: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }, {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            viewKey: z.ZodString;
            surface: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, "strip", z.ZodTypeAny, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }>>;
        a11y: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }>>;
        featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        kind: z.ZodLiteral<"promo-slot">;
        data: z.ZodObject<{
            slotId: z.ZodString;
            advertiser: z.ZodOptional<z.ZodString>;
            disclosure: z.ZodDefault<z.ZodString>;
            measurement: z.ZodObject<{
                impressionUrl: z.ZodOptional<z.ZodString>;
                clickUrl: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                impressionUrl?: string | undefined;
                clickUrl?: string | undefined;
            }, {
                impressionUrl?: string | undefined;
                clickUrl?: string | undefined;
            }>;
            safety: z.ZodObject<{
                blockedCategories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                brandSuitability: z.ZodDefault<z.ZodEnum<["strict", "moderate", "relaxed"]>>;
            }, "strip", z.ZodTypeAny, {
                blockedCategories: string[];
                brandSuitability: "strict" | "moderate" | "relaxed";
            }, {
                blockedCategories?: string[] | undefined;
                brandSuitability?: "strict" | "moderate" | "relaxed" | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            safety: {
                blockedCategories: string[];
                brandSuitability: "strict" | "moderate" | "relaxed";
            };
            slotId: string;
            disclosure: string;
            measurement: {
                impressionUrl?: string | undefined;
                clickUrl?: string | undefined;
            };
            advertiser?: string | undefined;
        }, {
            safety: {
                blockedCategories?: string[] | undefined;
                brandSuitability?: "strict" | "moderate" | "relaxed" | undefined;
            };
            slotId: string;
            measurement: {
                impressionUrl?: string | undefined;
                clickUrl?: string | undefined;
            };
            advertiser?: string | undefined;
            disclosure?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            safety: {
                blockedCategories: string[];
                brandSuitability: "strict" | "moderate" | "relaxed";
            };
            slotId: string;
            disclosure: string;
            measurement: {
                impressionUrl?: string | undefined;
                clickUrl?: string | undefined;
            };
            advertiser?: string | undefined;
        };
        id: string;
        key: string;
        kind: "promo-slot";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }, {
        data: {
            safety: {
                blockedCategories?: string[] | undefined;
                brandSuitability?: "strict" | "moderate" | "relaxed" | undefined;
            };
            slotId: string;
            measurement: {
                impressionUrl?: string | undefined;
                clickUrl?: string | undefined;
            };
            advertiser?: string | undefined;
            disclosure?: string | undefined;
        };
        id: string;
        key: string;
        kind: "promo-slot";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        key: z.ZodString;
        version: z.ZodDefault<z.ZodEnum<["1.5", "1.6"]>>;
        order: z.ZodNumber;
        layout: z.ZodDefault<z.ZodObject<{
            fullWidth: z.ZodDefault<z.ZodBoolean>;
            height: z.ZodOptional<z.ZodString>;
            minHeight: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                right: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                bottom: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
                left: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }, {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        }>>;
        analytics: z.ZodOptional<z.ZodObject<{
            viewKey: z.ZodString;
            surface: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, "strip", z.ZodTypeAny, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }, {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        }>>;
        a11y: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            describedBy: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            role: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }, {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        }>>;
        featureFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        kind: z.ZodLiteral<"event-mini-chat">;
        data: z.ZodObject<{
            eventId: z.ZodString;
            conversationId: z.ZodString;
            starterQuestions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            availability: z.ZodObject<{
                requiresConsent: z.ZodDefault<z.ZodBoolean>;
                personalization: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                requiresConsent: boolean;
                personalization: boolean;
            }, {
                requiresConsent?: boolean | undefined;
                personalization?: boolean | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            eventId: string;
            conversationId: string;
            starterQuestions: string[];
            availability: {
                requiresConsent: boolean;
                personalization: boolean;
            };
        }, {
            eventId: string;
            conversationId: string;
            availability: {
                requiresConsent?: boolean | undefined;
                personalization?: boolean | undefined;
            };
            starterQuestions?: string[] | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            eventId: string;
            conversationId: string;
            starterQuestions: string[];
            availability: {
                requiresConsent: boolean;
                personalization: boolean;
            };
        };
        id: string;
        key: string;
        kind: "event-mini-chat";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }, {
        data: {
            eventId: string;
            conversationId: string;
            availability: {
                requiresConsent?: boolean | undefined;
                personalization?: boolean | undefined;
            };
            starterQuestions?: string[] | undefined;
        };
        id: string;
        key: string;
        kind: "event-mini-chat";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    }>]>, "many">;
    meta: z.ZodObject<{
        planHash: z.ZodOptional<z.ZodString>;
        composerVersion: z.ZodOptional<z.ZodString>;
        generatedAt: z.ZodOptional<z.ZodString>;
        locale: z.ZodDefault<z.ZodString>;
        cacheTags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        flags: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        locale: string;
        flags: Record<string, boolean>;
        cacheTags: string[];
        planHash?: string | undefined;
        composerVersion?: string | undefined;
        generatedAt?: string | undefined;
    }, {
        planHash?: string | undefined;
        composerVersion?: string | undefined;
        generatedAt?: string | undefined;
        locale?: string | undefined;
        cacheTags?: string[] | undefined;
        flags?: Record<string, boolean> | undefined;
    }>;
    planCursors: z.ZodDefault<z.ZodArray<z.ZodObject<{
        blockKey: z.ZodString;
        cursor: z.ZodString;
        exhausted: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        cursor: string;
        blockKey: string;
        exhausted: boolean;
    }, {
        cursor: string;
        blockKey: string;
        exhausted?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    path: string;
    id: string;
    version: "1.5" | "1.6";
    title: string;
    tenantId: string;
    updatedAt: string;
    blocks: ({
        data: {
            entryPointLabel: string;
            welcomeMessages: {
                role: "system" | "user" | "assistant";
                content: string;
                eventId?: string | undefined;
            }[];
            conversationId: string;
            allowedScopes: ("global" | "event")[];
        };
        id: string;
        key: string;
        kind: "ai-dock";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            facets: {
                options: {
                    label: string;
                    id: string;
                    count?: number | undefined;
                    icon?: string | undefined;
                }[];
                type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
                label: string;
                id: string;
                multi: boolean;
            }[];
            active: Record<string, string | string[]>;
            sortOptions: {
                label: string;
                id: string;
                default?: boolean | undefined;
            }[];
            flags: {
                showReset: boolean;
                floating: boolean;
            };
        };
        id: string;
        key: string;
        kind: "filter-bar";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            items: {
                id: string;
                headline: string;
                image: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                };
                subhead?: string | undefined;
                cta?: {
                    label: string;
                    href: string;
                } | undefined;
                eventRef?: string | undefined;
            }[];
            autoplayMs: number;
        };
        id: string;
        key: string;
        kind: "hero-carousel";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            layout: "grid" | "rail";
            title: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
            }[];
            streaming: {
                mode: "initial" | "append";
                cursor?: string | undefined;
            };
            description?: string | undefined;
            diversity?: {
                date: number;
                venue: number;
                category: number;
            } | undefined;
        };
        id: string;
        key: string;
        kind: "collection-rail";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            timezone: string;
            days: {
                date: string;
                events: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    startDate: string;
                }[];
            }[];
        };
        id: string;
        key: string;
        kind: "microcalendar";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            layout: "modal" | "page";
            event: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
                description?: string | undefined;
                accessibility?: string[] | undefined;
                safety?: {
                    rating?: "low" | "medium" | "high" | undefined;
                    notes?: string | undefined;
                } | undefined;
                similarEvents?: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    venue: {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    };
                    startDate: string;
                    categories: string[];
                    locale: string;
                    timezone: string;
                    source: {
                        id: string;
                        provider: string;
                    };
                    endDate?: string | undefined;
                    heroImage?: {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    } | undefined;
                    price?: {
                        currency: string;
                        min?: number | undefined;
                        max?: number | undefined;
                    } | undefined;
                    distanceKm?: number | undefined;
                    whyGo?: string[] | undefined;
                    ticketUrl?: string | undefined;
                }[] | undefined;
                map?: {
                    lat: number;
                    lng: number;
                    zoom: number;
                } | undefined;
            };
        };
        id: string;
        key: string;
        kind: "event-detail";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        };
        id: string;
        key: string;
        kind: "seo-collection";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        };
        id: string;
        key: string;
        kind: "seo-detail";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            events: {
                map: {
                    lat: number;
                    lng: number;
                };
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                categories: string[];
                locale: string;
                timezone: string;
                source: {
                    id: string;
                    provider: string;
                };
                listIndex: number;
                endDate?: string | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    currency: string;
                    min?: number | undefined;
                    max?: number | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                ticketUrl?: string | undefined;
                clusterId?: string | undefined;
            }[];
            viewport: {
                zoom: number;
                center: {
                    lat: number;
                    lng: number;
                };
                bounds?: {
                    ne: {
                        lat: number;
                        lng: number;
                    };
                    sw: {
                        lat: number;
                        lng: number;
                    };
                } | undefined;
            };
            parityChecksum: string;
        };
        id: string;
        key: string;
        kind: "map-grid";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            safety: {
                blockedCategories: string[];
                brandSuitability: "strict" | "moderate" | "relaxed";
            };
            slotId: string;
            disclosure: string;
            measurement: {
                impressionUrl?: string | undefined;
                clickUrl?: string | undefined;
            };
            advertiser?: string | undefined;
        };
        id: string;
        key: string;
        kind: "promo-slot";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            eventId: string;
            conversationId: string;
            starterQuestions: string[];
            availability: {
                requiresConsent: boolean;
                personalization: boolean;
            };
        };
        id: string;
        key: string;
        kind: "event-mini-chat";
        version: "1.5" | "1.6";
        order: number;
        layout: {
            fullWidth: boolean;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        };
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    })[];
    meta: {
        locale: string;
        flags: Record<string, boolean>;
        cacheTags: string[];
        planHash?: string | undefined;
        composerVersion?: string | undefined;
        generatedAt?: string | undefined;
    };
    planCursors: {
        cursor: string;
        blockKey: string;
        exhausted: boolean;
    }[];
    description?: string | undefined;
    expiresAt?: string | undefined;
}, {
    path: string;
    id: string;
    title: string;
    tenantId: string;
    updatedAt: string;
    blocks: ({
        data: {
            conversationId: string;
            entryPointLabel?: string | undefined;
            welcomeMessages?: {
                role: "system" | "user" | "assistant";
                content: string;
                eventId?: string | undefined;
            }[] | undefined;
            allowedScopes?: ("global" | "event")[] | undefined;
        };
        id: string;
        key: string;
        kind: "ai-dock";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            facets: {
                options: {
                    label: string;
                    id: string;
                    count?: number | undefined;
                    icon?: string | undefined;
                }[];
                type: "date" | "price" | "category" | "distance" | "family" | "accessibility" | "neighborhood";
                label: string;
                id: string;
                multi?: boolean | undefined;
            }[];
            active: Record<string, string | string[]>;
            sortOptions: {
                label: string;
                id: string;
                default?: boolean | undefined;
            }[];
            flags?: {
                showReset?: boolean | undefined;
                floating?: boolean | undefined;
            } | undefined;
        };
        id: string;
        key: string;
        kind: "filter-bar";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            items: {
                id: string;
                headline: string;
                image: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                };
                subhead?: string | undefined;
                cta?: {
                    label: string;
                    href: string;
                } | undefined;
                eventRef?: string | undefined;
            }[];
            autoplayMs?: number | undefined;
        };
        id: string;
        key: string;
        kind: "hero-carousel";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            title: string;
            events: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
            }[];
            description?: string | undefined;
            layout?: "grid" | "rail" | undefined;
            streaming?: {
                cursor?: string | undefined;
                mode?: "initial" | "append" | undefined;
            } | undefined;
            diversity?: {
                venue?: number | undefined;
                date?: number | undefined;
                category?: number | undefined;
            } | undefined;
        };
        id: string;
        key: string;
        kind: "collection-rail";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            days: {
                date: string;
                events: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    startDate: string;
                }[];
            }[];
            timezone?: string | undefined;
        };
        id: string;
        key: string;
        kind: "microcalendar";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            event: {
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
                description?: string | undefined;
                accessibility?: string[] | undefined;
                safety?: {
                    rating?: "low" | "medium" | "high" | undefined;
                    notes?: string | undefined;
                } | undefined;
                similarEvents?: {
                    id: string;
                    canonicalId: string;
                    name: string;
                    venue: {
                        id: string;
                        name: string;
                        geo?: {
                            lat: number;
                            lng: number;
                        } | undefined;
                        address?: string | undefined;
                    };
                    startDate: string;
                    source: {
                        id: string;
                        provider: string;
                    };
                    endDate?: string | undefined;
                    categories?: string[] | undefined;
                    heroImage?: {
                        url: string;
                        alt: string;
                        width?: number | undefined;
                        height?: number | undefined;
                        focalPoint?: {
                            x: number;
                            y: number;
                        } | undefined;
                    } | undefined;
                    price?: {
                        min?: number | undefined;
                        max?: number | undefined;
                        currency?: string | undefined;
                    } | undefined;
                    distanceKm?: number | undefined;
                    whyGo?: string[] | undefined;
                    locale?: string | undefined;
                    timezone?: string | undefined;
                    ticketUrl?: string | undefined;
                }[] | undefined;
                map?: {
                    lat: number;
                    lng: number;
                    zoom?: number | undefined;
                } | undefined;
            };
            layout?: "modal" | "page" | undefined;
        };
        id: string;
        key: string;
        kind: "event-detail";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        };
        id: string;
        key: string;
        kind: "seo-collection";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            html: string;
            criticalCss: string;
            hashedCss: string;
            jsonLd?: string | undefined;
        };
        id: string;
        key: string;
        kind: "seo-detail";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            events: {
                map: {
                    lat: number;
                    lng: number;
                };
                id: string;
                canonicalId: string;
                name: string;
                venue: {
                    id: string;
                    name: string;
                    geo?: {
                        lat: number;
                        lng: number;
                    } | undefined;
                    address?: string | undefined;
                };
                startDate: string;
                source: {
                    id: string;
                    provider: string;
                };
                listIndex: number;
                endDate?: string | undefined;
                categories?: string[] | undefined;
                heroImage?: {
                    url: string;
                    alt: string;
                    width?: number | undefined;
                    height?: number | undefined;
                    focalPoint?: {
                        x: number;
                        y: number;
                    } | undefined;
                } | undefined;
                price?: {
                    min?: number | undefined;
                    max?: number | undefined;
                    currency?: string | undefined;
                } | undefined;
                distanceKm?: number | undefined;
                whyGo?: string[] | undefined;
                locale?: string | undefined;
                timezone?: string | undefined;
                ticketUrl?: string | undefined;
                clusterId?: string | undefined;
            }[];
            viewport: {
                zoom: number;
                center: {
                    lat: number;
                    lng: number;
                };
                bounds?: {
                    ne: {
                        lat: number;
                        lng: number;
                    };
                    sw: {
                        lat: number;
                        lng: number;
                    };
                } | undefined;
            };
            parityChecksum: string;
        };
        id: string;
        key: string;
        kind: "map-grid";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            safety: {
                blockedCategories?: string[] | undefined;
                brandSuitability?: "strict" | "moderate" | "relaxed" | undefined;
            };
            slotId: string;
            measurement: {
                impressionUrl?: string | undefined;
                clickUrl?: string | undefined;
            };
            advertiser?: string | undefined;
            disclosure?: string | undefined;
        };
        id: string;
        key: string;
        kind: "promo-slot";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    } | {
        data: {
            eventId: string;
            conversationId: string;
            availability: {
                requiresConsent?: boolean | undefined;
                personalization?: boolean | undefined;
            };
            starterQuestions?: string[] | undefined;
        };
        id: string;
        key: string;
        kind: "event-mini-chat";
        order: number;
        version?: "1.5" | "1.6" | undefined;
        layout?: {
            fullWidth?: boolean | undefined;
            height?: string | undefined;
            minHeight?: string | undefined;
            background?: string | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
        } | undefined;
        analytics?: {
            viewKey: string;
            surface: string;
            attributes?: Record<string, string | number | boolean> | undefined;
        } | undefined;
        a11y?: {
            label?: string | undefined;
            describedBy?: string[] | undefined;
            role?: string | undefined;
        } | undefined;
        featureFlags?: string[] | undefined;
    })[];
    meta: {
        planHash?: string | undefined;
        composerVersion?: string | undefined;
        generatedAt?: string | undefined;
        locale?: string | undefined;
        cacheTags?: string[] | undefined;
        flags?: Record<string, boolean> | undefined;
    };
    description?: string | undefined;
    expiresAt?: string | undefined;
    version?: "1.5" | "1.6" | undefined;
    planCursors?: {
        cursor: string;
        blockKey: string;
        exhausted?: boolean | undefined;
    }[] | undefined;
}>;
export type BlockInstance = z.infer<typeof BlockInstanceSchema>;
export type PageDoc = z.infer<typeof PageDocSchema>;
export type PlanCursor = z.infer<typeof PlanCursorSchema>;
export type EventSummary = z.infer<typeof EventSummarySchema>;
export declare function canonicalizePageDoc(doc: PageDoc): PageDoc;
export declare function computePlanHash(doc: PageDoc): string;
export declare function withPlanHash(doc: PageDoc): PageDoc;
export {};
//# sourceMappingURL=index.d.ts.map
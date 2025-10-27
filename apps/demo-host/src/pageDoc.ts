import type { PageDocType } from "@eventhub/page-schema";

export const demoPage: PageDocType = {
  id: "demo",
  title: "Events Hub Demo",
  path: "/",
  blocks: [
    {
      key: "hero",
      id: "hero-1",
      order: 0,
      layout: { fullWidth: true },
      data: { headline: "Discover what's happening nearby", subheadline: "Demo data via MSW" }
    }
  ],
  updatedAt: new Date().toISOString(),
  version: "1.5",
  tenantId: "demo",
  meta: { planHash: "demo" }
};

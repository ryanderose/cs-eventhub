import { createHash } from "node:crypto";
import { z } from "zod";
import { PageDoc } from "@eventhub/page-schema";

const AiQuerySchema = z.object({
  intent: z.enum(["search", "qa", "navigate"]),
  filters: z.record(z.any()),
  version: z.literal("dsl/1")
});

export interface ComposeInput {
  query: unknown;
  tenantId: string;
}

export function composePage(input: ComposeInput) {
  const query = AiQuerySchema.parse(input.query);
  const planHash = createHash("sha256").update(JSON.stringify({ query, tenantId: input.tenantId })).digest("hex");
  const page = PageDoc.parse({
    id: `page-${planHash.slice(0, 8)}`,
    title: "Events Hub Plan",
    path: "/",
    blocks: [
      {
        key: "hero",
        id: "hero-1",
        order: 0,
        layout: { fullWidth: true },
        data: { headline: "Plan ready", subheadline: `Intent: ${query.intent}` }
      }
    ],
    updatedAt: new Date().toISOString(),
    version: "1.5",
    tenantId: input.tenantId,
    meta: { planHash, composerVersion: "0.0.1" }
  });
  return { page, planHash, budgetMet: true };
}

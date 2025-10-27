import { z } from "zod";
import { BlockInstance } from "./block";

export const PageDoc = z.object({
  id: z.string(),
  title: z.string().min(1),
  path: z.string().min(1),
  blocks: z.array(BlockInstance),
  updatedAt: z.string(),
  version: z.literal("1.5"),
  tenantId: z.string(),
  meta: z
    .object({
      planHash: z.string().optional(),
      composerVersion: z.string().optional()
    })
    .optional()
});

export type PageDoc = z.infer<typeof PageDoc>;

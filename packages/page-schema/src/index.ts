import { z } from 'zod';

export const BlockInstance = z.object({
  key: z.string(),
  id: z.string(),
  order: z.number().int(),
  layout: z.object({ fullWidth: z.boolean().default(true) }),
  data: z.record(z.any())
});

export const PageDoc = z.object({
  id: z.string(),
  title: z.string(),
  path: z.string(),
  blocks: z.array(BlockInstance),
  updatedAt: z.string(),
  version: z.literal('1.5'),
  tenantId: z.string()
});

export type BlockInstance = z.infer<typeof BlockInstance>;
export type PageDoc = z.infer<typeof PageDoc>;

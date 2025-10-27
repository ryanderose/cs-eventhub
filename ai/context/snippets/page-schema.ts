import { z } from 'zod';

export const BlockInstance = z.object({
  key: z.string().min(1),
  id: z.string(),
  order: z.number().int(),
  layout: z.object({
    fullWidth: z.boolean().default(true),
    style: z.record(z.any()).optional()
  }),
  data: z.record(z.any()),
  options: z.record(z.any()).optional(),
  meta: z.record(z.any()).optional()
});
export type BlockInstance = z.infer<typeof BlockInstance>;

export const PageDoc = z.object({
  id: z.string(),
  title: z.string().min(1),
  path: z.string().min(1),
  blocks: z.array(BlockInstance),
  updatedAt: z.string(),
  version: z.literal('1.5'),
  tenantId: z.string(),
  meta: z
    .object({
      planHash: z.string().optional(),
      composerVersion: z.string().optional()
    })
    .optional()
});
export type PageDoc = z.infer<typeof PageDoc>;

import { z } from "zod";

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

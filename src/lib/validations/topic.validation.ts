import { z } from "zod";

export const createTopicSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(100).optional(),
  order: z.number().int().optional(),
  published: z.boolean().optional(),
});

export const updateTopicSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
  order: z.number().int().optional(),
  published: z.boolean().optional(),
});

export const reorderSchema = z.object({
  items: z
    .array(z.object({ id: z.string(), order: z.number().int() }))
    .min(1),
});

import { z } from "zod";

// Normalize a URL by prepending https:// if no protocol is present
const normalizeUrl = (val: string) => {
  const trimmed = val.trim();
  if (!trimmed) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const solveUrlSchema = z
  .string()
  .min(1, "Solve URL is required")
  .transform(normalizeUrl)
  .refine((val) => {
    try { new URL(val); return true; } catch { return false; }
  }, { message: "solveUrl must be a valid URL (e.g. https://leetcode.com/problems/...)" });

export const createProblemSchema = z.object({
  title: z.string().min(2).max(200),
  platform: z.string().max(50).optional(),
  externalId: z.string().max(100).optional(),
  solveUrl: solveUrlSchema,
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
});

export const updateProblemSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  platform: z.string().max(50).nullable().optional(),
  externalId: z.string().max(100).nullable().optional(),
  solveUrl: solveUrlSchema.optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
});

export const attachProblemSchema = z.object({
  problemId: z.string().min(1),
  isCore: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const reorderProblemsSchema = z.object({
  items: z
    .array(z.object({ problemId: z.string(), order: z.number().int() }))
    .min(1),
});

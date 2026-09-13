import { z } from "zod";

export const createPatternBaseSchema = z.object({
  topicId: z.string().optional(),
  topicName: z.string().optional(),
  number: z.number().int(),
  name: z.string().min(2).max(150),
  shortDescription: z.string().max(300).nullable().optional(),
  whatIsThis: z.string().nullable().optional(),
  intuition: z.string().nullable().optional(),
  identificationSignals: z.string().nullable().optional(),
  executionRecipe: z.string().nullable().optional(),
  coreIdea: z.string().nullable().optional(),
  interviewRule: z.string().nullable().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  importance: z.number().int().min(1).max(5).optional(),
  timeComplexity: z.string().max(50).nullable().optional(),
  spaceComplexity: z.string().max(50).nullable().optional(),
  pseudocode: z.string().nullable().optional(),
  cppTemplate: z.string().nullable().optional(),
  javaTemplate: z.string().nullable().optional(),
  jsTemplate: z.string().nullable().optional(),
  pyTemplate: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  benchmarkProblemIds: z.array(z.string()).optional(),
  useCases: z.array(z.string()).optional(),
  whenNotToUse: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

export const createPatternSchema = createPatternBaseSchema.refine(
  (data) => Boolean((data.topicId && data.topicId.trim().length > 0) || (data.topicName && data.topicName.trim().length > 0)),
  {
    message: "Curriculum Topic / Track (topicId or topicName) is required",
    path: ["topicId"],
  }
);

export const updatePatternSchema = createPatternBaseSchema.partial();


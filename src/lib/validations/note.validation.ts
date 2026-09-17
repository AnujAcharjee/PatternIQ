import { z } from "zod";

export const createNoteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty").max(5000),
  patternId: z.string().optional(),
  problemId: z.string().optional(),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1).max(5000),
});


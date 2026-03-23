import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "A valid id is required");

const questionConfigSchema = z.object({
  type: z.enum(["MCQ", "SHORT", "LONG"]),
  count: z.coerce.number().int().positive("Question count must be greater than 0"),
  marksPerQuestion: z.coerce.number().int().positive("Marks per question must be greater than 0"),
  difficulty: z.enum(["easy", "medium", "hard"])
});

const sectionSchema = z.object({
  sectionId: z.string().trim().min(1, "Section id is required"),
  title: z.string().trim().min(1, "Section title is required"),
  instruction: z.string().trim().min(1, "Section instruction is required"),
  questionConfig: questionConfigSchema
});

const sourceMaterialSchema = z.object({
  type: z.enum(["file", "text"]),
  content: z.string().trim().min(1, "Source material content is required")
});

export const assignmentParamsSchema = z.object({
  id: objectIdSchema
});

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  instructions: z.string().trim().min(1, "Instructions are required"),
  dueDate: z.coerce.date(),
  sections: z.array(sectionSchema).min(1, "At least one section is required"),
  sourceMaterial: sourceMaterialSchema.optional()
});

export const updateAssignmentSchema = z.object({
  instructions: z.string().trim().min(1, "Instructions are required").optional(),
  sourceMaterial: sourceMaterialSchema.optional()
});

export type CreateAssignmentPayload = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentPayload = z.infer<typeof updateAssignmentSchema>;

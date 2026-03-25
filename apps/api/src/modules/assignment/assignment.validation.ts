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

const textSourceMaterialSchema = z.object({
  content: z.string().trim().min(1, "Source material content is required")
});

const fileSourceMaterialSchema = z.object({
  fileUrl: z.string().trim().url("Source file URL must be a valid URL"),
  extractedText: z.string().trim().optional(),
  status: z.enum(["pending", "processed", "failed"]),
  error: z.string().trim().optional()
});

// Client input schema: allows optional text and/or file
const sourceMaterialInputSchema = z.object({
  text: textSourceMaterialSchema.optional(),
  file: fileSourceMaterialSchema.optional()
}).refine(
  (data) => data.text !== undefined || data.file !== undefined,
  { message: "At least one of text or file source material is required" }
);

// Full schema for database operations (both text and file can exist)
const sourceMaterialSchema = z.object({
  text: textSourceMaterialSchema.optional(),
  file: fileSourceMaterialSchema.optional()
});

export const assignmentParamsSchema = z.object({
  id: objectIdSchema
});

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  instructions: z.string().trim().min(1, "Instructions are required"),
  dueDate: z.coerce.date(),
  sections: z.array(sectionSchema).min(1, "At least one section is required"),
  sourceMaterial: sourceMaterialInputSchema.optional()
});

export const updateAssignmentSchema = z.object({
  instructions: z.string().trim().min(1, "Instructions are required").optional(),
  sourceMaterial: sourceMaterialInputSchema.optional()
});

export type CreateAssignmentPayload = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentPayload = z.infer<typeof updateAssignmentSchema>;

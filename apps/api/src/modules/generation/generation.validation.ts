import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "A valid id is required");

export const generationParamsSchema = z.object({
  id: objectIdSchema
});

export const createGenerationSchema = z.object({
  assignmentId: objectIdSchema,
  promptOverride: z.string().trim().min(1, "Prompt override cannot be empty").optional()
});

export type CreateGenerationPayload = z.infer<typeof createGenerationSchema>;

import { z, ZodError } from "zod";

import type {
  AssignmentDocument,
  AssignmentQuestionType
} from "../../common/types/assignment.types.js";
import type {
  GeneratedQuestion,
  GeneratedSection,
  GenerationResult
} from "../../common/types/generation.types.js";

const questionTypeSchema = z.enum(["MCQ", "SHORT", "LONG"]);
const difficultySchema = z.enum(["easy", "medium", "hard"]);

const questionSchema = z.object({
  question: z.string().trim().min(1, "Question text is required"),
  type: questionTypeSchema,
  difficulty: difficultySchema,
  marks: z.number().finite().positive(),
  options: z.array(z.string().trim().min(1)).optional()
});

const sectionSchema = z.object({
  sectionId: z.string().trim().min(1, "sectionId is required"),
  title: z.string().trim().min(1, "Section title is required"),
  instruction: z.string().trim().min(1, "Section instruction is required"),
  questions: z.array(questionSchema)
});

const generationResultSchema = z.object({
  sections: z.array(sectionSchema)
});

export class GenerationParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationParseError";
  }
}

const formatSectionId = (sectionId: string) => `'${sectionId}'`;

const assertQuestionOptions = (
  question: GeneratedQuestion,
  sectionId: string,
  questionIndex: number,
  expectedType: AssignmentQuestionType
) => {
  if (expectedType === "MCQ") {
    if (!question.options) {
      throw new GenerationParseError(
        `Question ${questionIndex + 1} in section ${formatSectionId(sectionId)} must include options for MCQ`
      );
    }

    if (question.options.length !== 4) {
      throw new GenerationParseError(
        `Question ${questionIndex + 1} in section ${formatSectionId(sectionId)} must include exactly 4 options`
      );
    }

    return;
  }

  if (question.options !== undefined) {
    throw new GenerationParseError(
      `Question ${questionIndex + 1} in section ${formatSectionId(sectionId)} must not include options for ${expectedType}`
    );
  }
};

const validateAssignmentAlignment = (
  parsedResult: GenerationResult,
  assignment: AssignmentDocument
): GenerationResult => {
  const expectedSections = assignment.sections;
  const receivedSections = parsedResult.sections;

  if (receivedSections.length !== expectedSections.length) {
    throw new GenerationParseError(
      `Section count mismatch: expected ${expectedSections.length}, received ${receivedSections.length}`
    );
  }

  const seenSectionIds = new Set<string>();

  const normalizedSections: GeneratedSection[] = expectedSections.map(
    (expectedSection) => {
      const matchingSections = receivedSections.filter(
        (section) => section.sectionId === expectedSection.sectionId
      );

      if (matchingSections.length === 0) {
        throw new GenerationParseError(
          `Missing required section ${formatSectionId(expectedSection.sectionId)}`
        );
      }

      if (matchingSections.length > 1) {
        throw new GenerationParseError(
          `Duplicate sectionId found: ${formatSectionId(expectedSection.sectionId)}`
        );
      }

      seenSectionIds.add(expectedSection.sectionId);
      const receivedSection = matchingSections[0]!;
      const expectedQuestionConfig = expectedSection.questionConfig;

      if (
        receivedSection.questions.length !== expectedQuestionConfig.count
      ) {
        throw new GenerationParseError(
          `Section ${formatSectionId(expectedSection.sectionId)} question count mismatch: expected ${expectedQuestionConfig.count}, received ${receivedSection.questions.length}`
        );
      }

      const normalizedQuestions: GeneratedQuestion[] = receivedSection.questions.map(
        (question, questionIndex) => {
          if (question.type !== expectedQuestionConfig.type) {
            throw new GenerationParseError(
              `Question ${questionIndex + 1} in section ${formatSectionId(expectedSection.sectionId)} has invalid type: expected ${expectedQuestionConfig.type}, received ${question.type}`
            );
          }

          if (question.difficulty !== expectedQuestionConfig.difficulty) {
            throw new GenerationParseError(
              `Question ${questionIndex + 1} in section ${formatSectionId(expectedSection.sectionId)} has invalid difficulty: expected ${expectedQuestionConfig.difficulty}, received ${question.difficulty}`
            );
          }

          if (question.marks !== expectedQuestionConfig.marksPerQuestion) {
            throw new GenerationParseError(
              `Question ${questionIndex + 1} in section ${formatSectionId(expectedSection.sectionId)} has invalid marks: expected ${expectedQuestionConfig.marksPerQuestion}, received ${question.marks}`
            );
          }

          assertQuestionOptions(
            question,
            expectedSection.sectionId,
            questionIndex,
            expectedQuestionConfig.type
          );

          return {
            question: question.question,
            type: question.type,
            difficulty: question.difficulty,
            marks: question.marks,
            options: question.options
          };
        }
      );

      return {
        sectionId: expectedSection.sectionId,
        title: receivedSection.title,
        instruction: receivedSection.instruction,
        questions: normalizedQuestions
      };
    }
  );

  for (const receivedSection of receivedSections) {
    if (!seenSectionIds.has(receivedSection.sectionId)) {
      throw new GenerationParseError(
        `Unexpected sectionId received: ${formatSectionId(receivedSection.sectionId)}`
      );
    }
  }

  return {
    sections: normalizedSections
  };
};

export const parseGenerationResponse = (
  rawResponse: string,
  assignment: AssignmentDocument
): GenerationResult => {
  const trimmedResponse = rawResponse.trim();

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(trimmedResponse);
  } catch {
    throw new GenerationParseError("LLM response is not valid JSON");
  }

  if (
    typeof parsedJson === "object" &&
    parsedJson !== null &&
    !("sections" in parsedJson)
  ) {
    throw new GenerationParseError("Missing required root field: sections");
  }

  try {
    const parsedResult = generationResultSchema.parse(parsedJson);
    return validateAssignmentAlignment(parsedResult, assignment);
  } catch (error) {
    if (error instanceof GenerationParseError) {
      throw error;
    }

    if (error instanceof ZodError) {
      const issue = error.issues[0];
      if (issue) {
        const path = issue.path.length > 0 ? issue.path.join(".") : "root";
        throw new GenerationParseError(`Invalid generation response at ${path}: ${issue.message}`);
      }
    }

    throw new GenerationParseError("Invalid generation response structure");
  }
};

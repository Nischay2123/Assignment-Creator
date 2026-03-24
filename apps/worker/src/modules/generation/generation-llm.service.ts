import type { AssignmentDocument } from "../../common/types/assignment.types.js";
import type { CreateGenerationJobResult } from "../../common/types/generation.types.js";

interface PlaceholderQuestion {
  prompt: string;
  type: "MCQ" | "SHORT" | "LONG";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  choices?: string[];
}

interface PlaceholderSection {
  sectionId: string;
  title: string;
  instruction: string;
  questions: PlaceholderQuestion[];
}

interface PlaceholderResponse {
  assignmentTitle: string;
  prompt: string;
  sections: PlaceholderSection[];
}

const buildPlaceholderQuestion = (
  sectionTitle: string,
  instruction: string,
  questionNumber: number,
  type: PlaceholderQuestion["type"],
  difficulty: PlaceholderQuestion["difficulty"],
  points: number
): PlaceholderQuestion => {
  const prompt = `Q${questionNumber}. ${sectionTitle}: ${instruction}`;

  if (type !== "MCQ") {
    return {
      prompt,
      type,
      difficulty,
      points
    };
  }

  return {
    prompt,
    type,
    difficulty,
    points,
    choices: [
      `Option A for ${sectionTitle}`,
      `Option B for ${sectionTitle}`,
      `Option C for ${sectionTitle}`,
      `Option D for ${sectionTitle}`
    ]
  };
};

export class GenerationLlmService {
  async generateAssignment(
    assignment: AssignmentDocument,
    prompt: string
  ): Promise<CreateGenerationJobResult> {
    const response: PlaceholderResponse = {
      assignmentTitle: assignment.title,
      prompt,
      sections: assignment.sections.map((section) => ({
        sectionId: section.sectionId,
        title: section.title,
        instruction: section.instruction,
        questions: Array.from(
          { length: section.questionConfig.count },
          (_, index) =>
            buildPlaceholderQuestion(
              section.title,
              section.instruction,
              index + 1,
              section.questionConfig.type,
              section.questionConfig.difficulty,
              section.questionConfig.marksPerQuestion
            )
        )
      }))
    };

    return {
      rawResponse: JSON.stringify(response, null, 2),
      result: {
        sections: response.sections.map((section) => ({
          sectionId: section.sectionId,
          title: section.title,
          instruction: section.instruction,
          questions: section.questions.map((question) => ({
            question: question.prompt,
            type: question.type,
            difficulty: question.difficulty,
            marks: question.points,
            options: question.choices
          }))
        }))
      }
    };
  }
}

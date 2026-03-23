import { HttpError } from "../../common/errors/http-error.js";
import type {
  AssignmentDocument,
  AssignmentResponse,
  CreateAssignmentInput,
  UpdateAssignmentInput
} from "../../common/types/assignment.types.js";
import { AssignmentModel } from "./assignment.model.js";

const toAssignmentResponse = (
  assignment: AssignmentDocument
): AssignmentResponse => {
  return {
    id: assignment._id.toString(),
    title: assignment.title,
    instructions: assignment.instructions,
    dueDate: assignment.dueDate,
    sections: assignment.sections,
    sourceMaterial: assignment.sourceMaterial,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt
  };
};

export class AssignmentService {
  async createAssignment(payload: CreateAssignmentInput): Promise<AssignmentResponse> {
    const assignment = await AssignmentModel.create(payload);

    return toAssignmentResponse(assignment);
  }

  async listAssignments(): Promise<AssignmentResponse[]> {
    const assignments = await AssignmentModel.find().sort({ createdAt: -1 });

    return assignments.map((assignment) => toAssignmentResponse(assignment));
  }

  async getAssignmentById(id: string): Promise<AssignmentResponse> {
    const assignment = await AssignmentModel.findById(id);

    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    return toAssignmentResponse(assignment);
  }

  async updateAssignment(id: string, payload: UpdateAssignmentInput): Promise<AssignmentResponse> {
    const assignment = await AssignmentModel.findByIdAndUpdate(id, payload, { new: true });

    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    return toAssignmentResponse(assignment);
  }
}

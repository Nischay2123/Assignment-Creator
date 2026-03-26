import mongoose from "mongoose";

import type { Assignment } from "../../common/types/assignment.types.js";

const { Schema, model } = mongoose;

const AssignmentQuestionConfigSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["MCQ", "SHORT", "LONG"],
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 1
    },
    marksPerQuestion: {
      type: Number,
      required: true,
      min: 1
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true
    }
  },
  {
    _id: false
  }
);

const AssignmentSectionSchema = new Schema(
  {
    sectionId: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    instruction: {
      type: String,
      required: true,
      trim: true
    },
    questionConfig: {
      type: AssignmentQuestionConfigSchema,
      required: true
    }
  },
  {
    _id: false
  }
);

const AssignmentTextSourceMaterialSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);

const AssignmentFileSourceMaterialSchema = new Schema(
  {
    fileUrl: {
      type: String,
      trim: true,
      required: true
    },
    extractedText: {
      type: String,
      trim: true,
      required: false
    },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      required: true
    },
    error: {
      type: String,
      trim: true,
      required: false
    }
  },
  {
    _id: false
  }
);

const AssignmentSourceMaterialSchema = new Schema(
  {
    text: {
      type: AssignmentTextSourceMaterialSchema,
      required: false
    },
    file: {
      type: AssignmentFileSourceMaterialSchema,
      required: false
    }
  },
  {
    _id: false
  }
);

const AssignmentSchema = new Schema<Assignment>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    instructions: {
      type: String,
      required: true,
      trim: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    sections: {
      type: [AssignmentSectionSchema],
      required: true,
      validate: {
        validator(value: unknown[]) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one section is required"
      }
    },
    sourceMaterial: {
      type: AssignmentSourceMaterialSchema,
      required: false
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const AssignmentModel = model<Assignment>("Assignment", AssignmentSchema);

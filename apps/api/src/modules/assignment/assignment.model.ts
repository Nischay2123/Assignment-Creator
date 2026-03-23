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

const AssignmentSourceMaterialSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["file", "text"],
      required: true
    },
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

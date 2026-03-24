import mongoose from "mongoose";

import type { Generation } from "../../common/types/generation.types.js";

const { Schema, model } = mongoose;

const GeneratedQuestionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["MCQ", "SHORT", "LONG"],
      required: true
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true
    },
    marks: {
      type: Number,
      required: true,
      min: 1
    },
    options: {
      type: [String],
      required: false,
      default: undefined
    }
  },
  {
    _id: false
  }
);

const GeneratedSectionSchema = new Schema(
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
    questions: {
      type: [GeneratedQuestionSchema],
      required: true,
      default: []
    }
  },
  {
    _id: false
  }
);

const GenerationResultSchema = new Schema(
  {
    sections: {
      type: [GeneratedSectionSchema],
      required: true,
      default: []
    }
  },
  {
    _id: false
  }
);

const GenerationSchema = new Schema<Generation>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true
    },
    version: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      required: true
    },
    result: {
      type: GenerationResultSchema,
      required: false
    },
    pdfUrl: {
      type: String,
      required: false,
      trim: true
    },
    pdfStatus: {
      type: String,
      enum: ["pending", "generated", "failed"],
      default: "pending",
      required: true
    },
    prompt: {
      type: String,
      required: false
    },
    rawResponse: {
      type: String,
      required: false
    },
    error: {
      type: String,
      required: false
    },
    processingTimeMs: {
      type: Number,
      required: false,
      min: 0
    },
    completedAt: {
      type: Date,
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

GenerationSchema.index({ assignmentId: 1, version: -1 }, { unique: true });

export const GenerationModel = model<Generation>("Generation", GenerationSchema);

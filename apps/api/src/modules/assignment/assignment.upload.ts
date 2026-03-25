import path from "node:path";

import multer from "multer";

import { HttpError } from "../../common/errors/http-error.js";

const ALLOWED_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

const ALLOWED_FILE_EXTENSIONS = new Set([".pdf", ".docx", ".txt"]);

const getFileExtension = (fileName: string): string => {
  return path.extname(fileName).toLowerCase();
};

export const assignmentFileUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const extension = getFileExtension(file.originalname);
    const isMimeAllowed = ALLOWED_FILE_MIME_TYPES.has(file.mimetype);
    const isExtensionAllowed = ALLOWED_FILE_EXTENSIONS.has(extension);

    if (!isMimeAllowed || !isExtensionAllowed) {
      cb(new HttpError(400, "Unsupported file format. Only pdf, docx, and txt are allowed."));

      return;
    }

    cb(null, true);
  }
});

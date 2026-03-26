import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker using the URL import to ensure version consistency
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PDF_PAGES = 30;
const ALLOWED_FILE_TYPES = ["txt", "pdf", "docx"];

const getFileExtension = (fileName: string): string => {
  return fileName.split(".").pop()?.toLowerCase() || "";
};

const validateFileType = (file: File): { valid: boolean; error?: string } => {
  const extension = getFileExtension(file.name);

  if (!ALLOWED_FILE_TYPES.includes(extension)) {
    return {
      valid: false,
      error: `Only .txt, .pdf, and .docx files are allowed. You uploaded .${extension}`,
    };
  }

  return { valid: true };
};

const validateFileSize = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size must not exceed 10 MB. Your file is ${sizeMB} MB.`,
    };
  }

  return { valid: true };
};

const getPdfPageCount = async (file: File): Promise<number> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Validate PDF signature to catch corrupted files early
  const view = new Uint8Array(arrayBuffer);
  if (view[0] !== 0x25 || view[1] !== 0x50 || view[2] !== 0x44 || view[3] !== 0x46) {
    // Not a valid PDF (should start with %PDF)
    throw new Error("Invalid PDF signature");
  }
  
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  return pdf.numPages;
};

const validatePdfPages = async (
  file: File
): Promise<{ valid: boolean; error?: string }> => {
  const extension = getFileExtension(file.name);

  if (extension !== "pdf") {
    return { valid: true };
  }

  try {
    const pageCount = await getPdfPageCount(file);

    if (pageCount > MAX_PDF_PAGES) {
      return {
        valid: false,
        error: `PDF files must not exceed ${MAX_PDF_PAGES} pages. Your file has ${pageCount} pages.`,
      };
    }

    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("PDF validation error:", errorMessage);
    
    // Provide more specific error messages
    if (errorMessage.includes("Invalid PDF signature")) {
      return {
        valid: false,
        error: "The file is not a valid PDF. Please check the file and try again.",
      };
    }
    
    return {
      valid: false,
      error: "Unable to read PDF file. Please ensure it is a valid PDF.",
    };
  }
};

export const validateFile = async (
  file: File
): Promise<{ valid: boolean; error?: string }> => {
  // Check file type
  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Check file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Check PDF pages if applicable
  const pdfValidation = await validatePdfPages(file);
  if (!pdfValidation.valid) {
    return pdfValidation;
  }

  return { valid: true };
};

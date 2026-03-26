import puppeteer from "puppeteer";

import type { GenerationResult } from "../../common/types/generation.types.js";

interface BuildPdfInput {
  version: number;
  result: GenerationResult;
}

const escapeHtml = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const getSectionRequiredQuestions = (instruction: string, totalQuestions: number): number => {
  const normalized = instruction.toLowerCase();

  if (normalized.includes("attempt all")) return totalQuestions;

  const anyMatch = normalized.match(/attempt\s+any\s+(\d+)/i);
  if (anyMatch?.[1]) return Math.min(Number(anyMatch[1]), totalQuestions);

  return totalQuestions;
};

const buildPaperHtml = ({ result }: BuildPdfInput): string => {
  const totalQuestions = result.sections.reduce(
    (acc, section) => acc + section.questions.length,
    0
  );

  const totalMarks = result.sections.reduce(
    (acc, section) =>
      acc + section.questions.reduce((s, q) => s + q.marks, 0),
    0
  );

  const notes = result.sections.map((section, index) => {
    const label = `Section ${String.fromCharCode(65 + index)}`;
    return `${label}: ${section.instruction}`;
  });

  const totalRequiredQuestions = result.sections.reduce((acc, section) => {
    return acc + getSectionRequiredQuestions(section.instruction, section.questions.length);
  }, 0);

  const sectionsHtml = result.sections
    .map((section, sectionIndex) => {
      const sectionLabel = `SECTION ${String.fromCharCode(65 + sectionIndex)}`;
      const sectionMarks = section.questions.reduce((acc, q) => acc + q.marks, 0);

      return `
        <div class="section">
          <div class="section-title">${sectionLabel}</div>

          <div class="section-meta">
            <div>Questions: ${section.questions.length}</div>
            <div>Marks: ${sectionMarks}</div>
          </div>

          <div class="section-instruction">${escapeHtml(section.instruction)}</div>

          ${section.questions
            .map((q, qIndex) => {
              const options =
                q.type === "MCQ" && q.options
                  ? `<div class="options">
                      ${q.options
                        .map((opt, i) => `<div>${String.fromCharCode(65 + i)}. ${escapeHtml(opt)}</div>`)
                        .join("")}
                    </div>`
                  : "";

              return `
                <div class="question">
                  <div class="question-row">
                    <div>Q${sectionIndex + 1}.${qIndex + 1} ${escapeHtml(q.question)}</div>
                    <div>[${q.marks}]</div>
                  </div>
                  ${options}
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    })
    .join("");

  const notesHtml = [
    `<li><strong>Overall Questions To Attempt:</strong> ${totalRequiredQuestions} out of ${totalQuestions}</li>`,
    ...notes.map((n) => `<li>${escapeHtml(n)}</li>`)
  ].join("");

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Question Paper</title>

<style>
  body {
    font-family: "Times New Roman", serif;
    margin: 40px;
    color: #000;
    line-height: 1.5;
  }

  .center {
    text-align: center;
  }

  .title {
    font-size: 22px;
    font-weight: bold;
    text-transform: uppercase;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 14px;
  }

  hr {
    margin: 12px 0;
    border: none;
    border-top: 1px solid #000;
  }

  .heading {
    font-weight: bold;
    text-decoration: underline;
    margin-top: 14px;
  }

  .instructions {
    margin-left: 18px;
    font-size: 14px;
  }

  .section {
    margin-top: 20px;
  }

  .section-title {
    text-align: center;
    font-weight: bold;
  }

  .section-meta {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    margin-top: 4px;
  }

  .section-instruction {
    margin-top: 6px;
    font-size: 14px;
  }

  .question {
    margin-top: 10px;
  }

  .question-row {
    display: flex;
    justify-content: space-between;
  }

  .options {
    margin-left: 20px;
    margin-top: 4px;
  }

</style>
</head>

<body>

<div class="center">
  <div class="title">QUESTION PAPER</div>
</div>

<div class="meta">
  <div>Total Questions: ${totalQuestions}</div>
  <div>Total Marks: ${totalMarks}</div>
</div>

<hr/>

<div class="heading">General Instructions:</div>
<ol class="instructions">
  ${notesHtml}
</ol>

<hr/>

${sectionsHtml}

</body>
</html>
`;
};

export class PdfGenerationService {
  async generatePdfBuffer(input: BuildPdfInput): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    try {
      const page = await browser.newPage();
      const html = buildPaperHtml(input);

      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "16mm",
          right: "12mm",
          bottom: "16mm",
          left: "12mm"
        },
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: '<div style="font-size:10px;text-align:right;width:100%;padding-right:10mm;"><span class="pageNumber"></span>/<span class="totalPages"></span></div>'
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
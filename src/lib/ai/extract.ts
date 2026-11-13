import { AI_LIMITS, validateDocxZip, validateFile, validateText } from "./contracts";

export async function extractCv(file: File): Promise<string> {
  validateFile(file.name, file.size);
  const buffer = await file.arrayBuffer();
  if (/\.docx$/i.test(file.name)) {
    validateDocxZip(buffer);
    const mammoth = await import("mammoth/mammoth.browser");
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return validateText(result.value);
  }
  if (new TextDecoder().decode(buffer.slice(0, 5)) !== "%PDF-") throw new Error("corrupt");
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const loading = pdfjs.getDocument({ data: buffer, useSystemFonts: true, enableXfa: false });
  try {
    const doc = await loading.promise;
    if (doc.numPages > AI_LIMITS.pdfPages) throw new Error("pageLimit");
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text +=
        content.items
          .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""))
          .join("") + "\n";
      if (text.length > AI_LIMITS.extractedChars) throw new Error("textLimit");
      page.cleanup();
    }
    return validateText(text);
  } finally {
    await loading.destroy();
  }
}

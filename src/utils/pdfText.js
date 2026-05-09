// ── PDF → plain text via PDF.js ──────────────────────────────────────────────
// Used as the fallback PDF-extraction path when the user is on the free
// Puter provider (Puter's chat API can't accept raw PDF binaries, but it
// can accept text). Anthropic users get the higher-fidelity
// `extractPaperFromPdf` path that lets Claude read the actual PDF.

import * as pdfjsLib from "pdfjs-dist";
// Vite turns the worker entry into a static URL we can hand to pdfjs.
// Loading the worker keeps text extraction off the main thread so the
// UI stays responsive on long papers.
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const fileToArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Could not read PDF file"));
    r.readAsArrayBuffer(file);
  });

// Concatenate the items on a single page into a clean paragraph string.
// PDF.js returns each text item with its own `str`; we join with spaces
// and let Claude (or whichever model) reconstruct the structure.
const pageText = (textContent) =>
  (textContent.items || [])
    .map((it) => (typeof it.str === "string" ? it.str : ""))
    .join(" ")
    .replace(/[ \t]+/g, " ")
    .trim();

export const extractTextFromPdf = async (file, { maxChars = 200000 } = {}) => {
  const buf = await fileToArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = pageText(await page.getTextContent());
    if (text) pages.push(text);
    // Soft cap: most academic papers are well under 200K chars; theses or
    // books can blow up the model context. Truncate cleanly with a note.
    if (pages.join("\n\n").length > maxChars) break;
  }
  let combined = pages.join("\n\n");
  if (combined.length > maxChars) {
    combined = combined.slice(0, maxChars).trimEnd() + "\n\n[…truncated for length]";
  }
  return combined;
};

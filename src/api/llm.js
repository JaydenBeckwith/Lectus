// ── LLM router ───────────────────────────────────────────────────────────────
// Uniform surface used by App.jsx + components. Dispatches each call to
// either Puter.js (free, default) or the Anthropic client (user's own key).
// PDF extraction always uses Anthropic since Puter doesn't accept base64 PDFs.

import * as puter from "./puter";
import * as anthropic from "./anthropic";

let provider = "puter"; // "puter" | "anthropic"

export const setProvider = (p) => {
  if (p === "puter" || p === "anthropic") provider = p;
};
export const getProvider = () => provider;

const choose = () => (provider === "anthropic" ? anthropic : puter);

export const askLibrary = (...a) => choose().askLibrary(...a);
export const askLibraryStream = (...a) => choose().askLibraryStream(...a);
export const generateReviewParagraph = (...a) => choose().generateReviewParagraph(...a);
export const generateStructuredReview = (...a) => choose().generateStructuredReview(...a);
export const compareContradictions = (...a) => choose().compareContradictions(...a);
export const enrichFromCitation = (...a) => choose().enrichFromCitation(...a);
export const deepenSection = (...a) => choose().deepenSection(...a);
export const suggestTags = (...a) => choose().suggestTags(...a);

// PDF: always Anthropic (Puter doesn't accept raw PDFs via chat).
export const extractPaperFromPdf = (b) => anthropic.extractPaperFromPdf(b);

export const testConnection = () => choose().testConnection();

// Whether AI features are usable. Puter is always usable (script load aside).
export const hasAccess = () => (provider === "puter" ? puter.hasApiKey() : anthropic.hasApiKey());

// Re-export the per-provider config setters so Settings can drive them.
export { setRuntimeApiKey, hasApiKey as hasAnthropicKey } from "./anthropic";
export { setPuterModel, getPuterModel, PUTER_MODELS } from "./puter";

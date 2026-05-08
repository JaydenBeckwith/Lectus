// ── Puter.js client ──────────────────────────────────────────────────────────
// Wraps window.puter.ai.chat in the same surface as anthropic.js so the rest
// of the app can stay agnostic about which provider is active. Loaded by the
// <script src="https://js.puter.com/v2/"> tag in index.html.
//
// Puter needs no API key — it sandbox-signs the user via their puter.com
// login (or anonymously) and bills the model usage against their quota. For
// our purposes that means free LLM access for end users.

import {
  SYSTEM_PROMPT,
  reviewPrompt,
  structuredReviewPrompt,
  tagSuggestionPrompt,
  contradictionPrompt,
  enrichFromCitationPrompt,
  sectionDeepenPrompt,
} from "../constants/prompts";

export const PUTER_MODELS = [
  { id: "gpt-5-nano", label: "GPT-5 Nano (fast, cheap)" },
  { id: "gpt-5", label: "GPT-5" },
  { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
  { id: "claude-opus-4-1", label: "Claude Opus 4.1" },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1 (reasoning)" },
];

let model = "gpt-5-nano";
export const setPuterModel = (m) => { if (m) model = m; };
export const getPuterModel = () => model;

// Puter is "always available" from this client's perspective — no key is
// needed. We just check the script actually loaded.
export const hasApiKey = () => typeof window !== "undefined" && Boolean(window.puter && window.puter.ai);

const ensurePuter = () => {
  if (typeof window === "undefined" || !window.puter || !window.puter.ai) {
    throw new Error("Puter.js hasn't loaded yet — check your network.");
  }
};

// Different models return different shapes. Normalise to a plain string.
const extractText = (response) => {
  if (response == null) return "";
  if (typeof response === "string") return response;
  const c = response.message?.content;
  if (Array.isArray(c)) return c.map((x) => x?.text || "").join("");
  if (typeof c === "string") return c;
  if (typeof response.text === "string") return response.text;
  return "";
};

export const askLibrary = async (papers, messages) => {
  ensurePuter();
  const full = [{ role: "system", content: SYSTEM_PROMPT(papers) }, ...messages];
  const res = await window.puter.ai.chat(full, { model });
  return extractText(res) || "Error.";
};

export const askLibraryStream = async (papers, messages, onDelta) => {
  ensurePuter();
  const full = [{ role: "system", content: SYSTEM_PROMPT(papers) }, ...messages];
  const res = await window.puter.ai.chat(full, { model, stream: true });
  let acc = "";
  // The stream is an async iterable yielding { text } chunks.
  for await (const part of res) {
    if (part?.text) {
      acc += part.text;
      onDelta?.(acc);
    }
  }
  return acc;
};

export const generateReviewParagraph = async (papers, topic) => {
  ensurePuter();
  const res = await window.puter.ai.chat(reviewPrompt(papers, topic), { model });
  return extractText(res) || "Error.";
};

const extractJson = (raw) => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in response");
  return JSON.parse(cleaned.slice(start, end + 1));
};

export const generateStructuredReview = async (papers, topic) => {
  ensurePuter();
  const res = await window.puter.ai.chat(structuredReviewPrompt(papers, topic), { model });
  return extractJson(extractText(res));
};

export const compareContradictions = async (papers) => {
  ensurePuter();
  const res = await window.puter.ai.chat(contradictionPrompt(papers), { model });
  return extractJson(extractText(res));
};

export const deepenSection = async (paper, section) => {
  ensurePuter();
  const res = await window.puter.ai.chat(sectionDeepenPrompt(paper, section), { model });
  return (extractText(res) || "").trim();
};

export const enrichFromCitation = async (paper) => {
  ensurePuter();
  const res = await window.puter.ai.chat(enrichFromCitationPrompt(paper), { model });
  const j = extractJson(extractText(res));
  return {
    keyFindings: Array.isArray(j.keyFindings) ? j.keyFindings.filter((x) => typeof x === "string") : [],
    methods: typeof j.methods === "string" ? j.methods : "",
    results: typeof j.results === "string" ? j.results : "",
    discussion: typeof j.discussion === "string" ? j.discussion : "",
  };
};

export const suggestTags = async (paper, existing = []) => {
  ensurePuter();
  const res = await window.puter.ai.chat(tagSuggestionPrompt(paper, existing), { model });
  const raw = extractText(res).replace(/```json|```/g, "").trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const arr = JSON.parse(raw.slice(start, end + 1));
    if (!Array.isArray(arr)) return [];
    return arr.filter((t) => typeof t === "string").map((t) => t.trim()).filter((t) => t.length > 0 && t.length <= 40);
  } catch {
    return [];
  }
};

// PDF extraction needs vision/file support — Puter's chat API doesn't accept
// raw base64 PDFs directly, so for now we route PDF uploads through the
// Anthropic client. The router in api/llm.js handles that fallback.
export const extractPaperFromPdf = async () => {
  throw new Error("PDF extraction needs the Anthropic key — switch provider in Settings.");
};

export const testConnection = async () => {
  ensurePuter();
  const res = await window.puter.ai.chat("ping", { model });
  if (!extractText(res)) throw new Error("Empty response");
  return true;
};

// Stub setRuntimeApiKey so the router can call it uniformly.
export const setRuntimeApiKey = () => {};

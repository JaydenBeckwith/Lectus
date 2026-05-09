import {
  SYSTEM_PROMPT,
  PDF_EXTRACT_PROMPT,
  pdfTextExtractPrompt,
  reviewPrompt,
  structuredReviewPrompt,
  tagSuggestionPrompt,
  contradictionPrompt,
  enrichFromCitationPrompt,
  sectionDeepenPrompt,
} from "../constants/prompts";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";
const ENV_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

let runtimeKey = null;

export const setRuntimeApiKey = (k) => {
  runtimeKey = k && k.trim() ? k.trim() : null;
};

const getKey = () => runtimeKey || ENV_KEY || "";
export const hasApiKey = () => Boolean(getKey());

const headers = () => {
  const h = {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  };
  const key = getKey();
  if (key) h["x-api-key"] = key;
  return h;
};

const ensureKey = () => {
  if (!getKey()) {
    throw new Error("No Anthropic API key — add one in Settings or set VITE_ANTHROPIC_API_KEY");
  }
};

const post = async (body) => {
  ensureKey();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Surface the most common failure modes in plain language so the user
    // knows what to fix without having to read the raw JSON.
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Anthropic rejected the API key (HTTP " + res.status + "). " +
        "Open Settings → API key, paste a fresh key (starts with `sk-ant-…`), and try again. " +
        "If you're using the free Puter provider for chat, note that PDF extraction still needs your own Anthropic key — Puter's chat API can't accept raw PDFs."
      );
    }
    if (res.status === 429) {
      throw new Error(
        "Anthropic rate-limited this request (HTTP 429). Wait a minute or check your usage limits, then retry."
      );
    }
    throw new Error(`Anthropic API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
};

export const askLibrary = async (papers, messages) => {
  const data = await post({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM_PROMPT(papers),
    messages,
  });
  return data.content?.[0]?.text || "Error.";
};

export const askLibraryStream = async (papers, messages, onDelta, signal) => {
  ensureKey();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(),
    signal,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT(papers),
      messages,
      stream: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API ${res.status}: ${text || res.statusText}`);
  }
  if (!res.body) throw new Error("Streaming not supported in this environment");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";
    for (const block of blocks) {
      const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const payload = dataLine.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
          full += json.delta.text;
          onDelta?.(full);
        } else if (json.type === "error") {
          throw new Error(json.error?.message || "Stream error");
        }
      } catch (err) {
        if (err instanceof SyntaxError) continue;
        throw err;
      }
    }
  }
  return full;
};

const extractJson = (raw) => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in response");
  return JSON.parse(cleaned.slice(start, end + 1));
};

// Make sure every field downstream code expects is present, even if the model
// skips one. Empty strings/arrays render harmlessly in the UI.
const normalisePaper = (p) => ({
  title: p.title || "(untitled)",
  authors: p.authors || "Unknown",
  journal: p.journal || "",
  year: p.year || null,
  doi: p.doi || "",
  tags: Array.isArray(p.tags) ? p.tags : [],
  abstract: p.abstract || "",
  keyFindings: Array.isArray(p.keyFindings) ? p.keyFindings : [],
  methods: typeof p.methods === "string" ? p.methods : "",
  results: typeof p.results === "string" ? p.results : "",
  discussion: typeof p.discussion === "string" ? p.discussion : "",
});

// Text-input variant. Used when the PDF was already parsed client-side via
// PDF.js. Same JSON shape as extractPaperFromPdf so the caller can use them
// interchangeably.
export const extractPaperFromText = async (text) => {
  const data = await post({
    model: MODEL,
    max_tokens: 4500,
    messages: [{ role: "user", content: pdfTextExtractPrompt(text) }],
  });
  const raw = data.content?.[0]?.text || "";
  return normalisePaper(extractJson(raw));
};

export const extractPaperFromPdf = async (base64Pdf) => {
  // 4500 tokens leaves enough headroom for abstract + methods + results +
  // discussion (each ~150-400 words) plus the metadata block.
  const data = await post({
    model: MODEL,
    max_tokens: 4500,
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Pdf } },
          { type: "text", text: PDF_EXTRACT_PROMPT },
        ],
      },
    ],
  });
  const raw = data.content?.[0]?.text || "";
  return normalisePaper(extractJson(raw));
};

export const generateReviewParagraph = async (papers, topic) => {
  const data = await post({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: reviewPrompt(papers, topic) }],
  });
  return data.content?.[0]?.text || "Error.";
};

export const generateStructuredReview = async (papers, topic) => {
  const data = await post({
    model: MODEL,
    max_tokens: 3000,
    messages: [{ role: "user", content: structuredReviewPrompt(papers, topic) }],
  });
  const raw = data.content?.[0]?.text || "";
  return extractJson(raw);
};

export const compareContradictions = async (papers) => {
  const data = await post({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: contradictionPrompt(papers) }],
  });
  const raw = data.content?.[0]?.text || "";
  return extractJson(raw);
};

// Per-section deepen. Returns a longer, focused summary of a single
// section (methods | results | discussion) for an existing paper. Plain
// text; the caller writes it back onto paper[section].
export const deepenSection = async (paper, section) => {
  const data = await post({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: sectionDeepenPrompt(paper, section) }],
  });
  return (data.content?.[0]?.text || "").trim();
};

// Fill in keyFindings + methods + results + discussion for a citation we
// just looked up via DOI (where we don't have a PDF). Returns the four
// fields normalised; empty values where the LLM didn't have enough to go on.
export const enrichFromCitation = async (paper) => {
  const data = await post({
    model: MODEL,
    max_tokens: 1800,
    messages: [{ role: "user", content: enrichFromCitationPrompt(paper) }],
  });
  const raw = data.content?.[0]?.text || "";
  const j = extractJson(raw);
  return {
    keyFindings: Array.isArray(j.keyFindings) ? j.keyFindings.filter((x) => typeof x === "string") : [],
    methods: typeof j.methods === "string" ? j.methods : "",
    results: typeof j.results === "string" ? j.results : "",
    discussion: typeof j.discussion === "string" ? j.discussion : "",
  };
};

// Ask Claude for 4-6 tag suggestions for a paper. Returns a string array;
// the caller filters out any duplicates of existing tags. Empty array if the
// model returns garbage.
export const suggestTags = async (paper, existing = []) => {
  const data = await post({
    model: MODEL,
    max_tokens: 300,
    messages: [{ role: "user", content: tagSuggestionPrompt(paper, existing) }],
  });
  const raw = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const arr = JSON.parse(raw.slice(start, end + 1));
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((t) => typeof t === "string")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 40);
  } catch {
    return [];
  }
};

export const testConnection = async () => {
  ensureKey();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ model: MODEL, max_tokens: 1, messages: [{ role: "user", content: "ping" }] }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = res.statusText;
    try { const j = JSON.parse(text); if (j?.error?.message) msg = j.error.message; } catch {}
    throw new Error(`${res.status} ${msg}`);
  }
  return true;
};

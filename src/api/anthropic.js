// ── Anthropic API client ──────────────────────────────────────────────────────
// All HTTP traffic to the Anthropic Messages API lives here. The key is read
// from import.meta.env.VITE_ANTHROPIC_API_KEY. Anything VITE_-prefixed is
// inlined into the browser bundle, so this is fine for local development but
// MUST be replaced with a server-side proxy before deploying anywhere public.

import {
  SYSTEM_PROMPT,
  PDF_EXTRACT_PROMPT,
  reviewPrompt,
  structuredReviewPrompt,
} from "../constants/prompts";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const headers = () => {
  const h = {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  };
  if (API_KEY) h["x-api-key"] = API_KEY;
  return h;
};

const post = async (body) => {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
};

// Library chat (non-streaming) — kept around for fallbacks / tests.
export const askLibrary = async (papers, messages) => {
  const data = await post({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM_PROMPT(papers),
    messages,
  });
  return data.content?.[0]?.text || "Error.";
};

// Streaming variant. Parses SSE text_delta events and pushes the running
// total to onDelta(partialText). Resolves with the full final string.
export const askLibraryStream = async (papers, messages, onDelta, signal) => {
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

// Extract metadata from an uploaded PDF and return parsed JSON.
export const extractPaperFromPdf = async (base64Pdf) => {
  const data = await post({
    model: MODEL,
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Pdf,
            },
          },
          { type: "text", text: PDF_EXTRACT_PROMPT },
        ],
      },
    ],
  });
  const txt = data.content?.[0]?.text?.trim() || "";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
};

// Generate a literature-review paragraph from a selection of papers.
export const generateReviewParagraph = async (papers, topic) => {
  const data = await post({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: reviewPrompt(papers, topic) }],
  });
  return data.content?.[0]?.text || "Error.";
};

// Strip ```json fences and any leading/trailing prose so JSON.parse succeeds
// even when the model gets chatty.
const extractJson = (raw) => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in response");
  return JSON.parse(cleaned.slice(start, end + 1));
};

// Structured synthesis: returns a parsed object with agreements, contradictions,
// gaps, future_directions, and per_paper contributions.
export const generateStructuredReview = async (papers, topic) => {
  const data = await post({
    model: MODEL,
    max_tokens: 3000,
    messages: [{ role: "user", content: structuredReviewPrompt(papers, topic) }],
  });
  const raw = data.content?.[0]?.text || "";
  return extractJson(raw);
};

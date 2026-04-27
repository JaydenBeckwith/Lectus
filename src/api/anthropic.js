// ── Anthropic API client ──────────────────────────────────────────────────────
// All HTTP traffic to the Anthropic Messages API lives here. The key is read
// from import.meta.env.VITE_ANTHROPIC_API_KEY. Anything VITE_-prefixed is
// inlined into the browser bundle, so this is fine for local development but
// MUST be replaced with a server-side proxy before deploying anywhere public.

import { SYSTEM_PROMPT, PDF_EXTRACT_PROMPT, reviewPrompt } from "../constants/prompts";

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

// Library chat — answers questions grounded in the user's papers.
export const askLibrary = async (papers, messages) => {
  const data = await post({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM_PROMPT(papers),
    messages,
  });
  return data.content?.[0]?.text || "Error.";
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

import {
  SYSTEM_PROMPT,
  PDF_EXTRACT_PROMPT,
  reviewPrompt,
  structuredReviewPrompt,
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

export const extractPaperFromPdf = async (base64Pdf) => {
  const data = await post({
    model: MODEL,
    max_tokens: 1500,
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
  const txt = data.content?.[0]?.text?.trim() || "";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
};

export const generateReviewParagraph = async (papers, topic) => {
  const data = await post({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: reviewPrompt(papers, topic) }],
  });
  return data.content?.[0]?.text || "Error.";
};

const extractJson = (raw) => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in response");
  return JSON.parse(cleaned.slice(start, end + 1));
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

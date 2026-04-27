// ── Prompt templates ──────────────────────────────────────────────────────────
// Centralised prompt builders so anyone tweaking the AI behaviour edits one
// place rather than hunting through API call sites.

export const SYSTEM_PROMPT = (papers) => `You are an expert research assistant for an oncology researcher. You have access to their personal paper library containing ${papers.length} papers, including their personal notes and highlights.

LIBRARY:
${papers
  .map(
    (p) => `
---
ID: ${p.id}
Title: ${p.title}
Authors: ${p.authors}
Journal: ${p.journal} (${p.year})
Tags: ${p.tags.join(", ")}
Abstract: ${p.abstract}
Key Findings: ${p.keyFindings.join(" | ")}
${p.notes ? `User's Notes: ${p.notes}` : ""}
${p.highlights?.length ? `User's Highlights: ${p.highlights.join(" | ")}` : ""}
`
  )
  .join("")}

Answer questions by drawing on this library. Cite papers by title. Incorporate the user's notes/highlights when relevant. Be precise and scientifically rigorous.`;

export const PDF_EXTRACT_PROMPT = `Extract metadata and return ONLY a JSON object (no markdown):
{"title":"...","authors":"First Author, Second Author, et al.","journal":"...","year":2024,"doi":"...","tags":["tag1","tag2","tag3","tag4","tag5"],"abstract":"...","keyFindings":["finding 1","finding 2","finding 3"]}

Tags: 4-6 scientific keywords. Key findings: 3 short statements (max 12 words each). Return ONLY the JSON.`;

const formatPaperBlock = (papers) =>
  papers
    .map(
      (p, i) =>
        `${i + 1}. ${p.authors} (${p.year}). "${p.title}". ${p.journal}.\nAbstract: ${p.abstract}\nKey: ${p.keyFindings.join("; ")}`
    )
    .join("\n\n");

export const reviewPrompt = (papers, topic) => `Write a literature review paragraph${
  topic ? ` focused on: "${topic}"` : ""
} synthesising the following ${papers.length} papers. Use academic tone, cite each as (Author Year) using first author surname, weave into coherent narrative. Highlight agreements, disagreements, gaps. 250-400 words.

PAPERS:
${formatPaperBlock(papers)}`;

// Multi-paper structured synthesis. Asks Claude to return strict JSON so the
// UI can render each section into its own card without relying on markdown.
// Anything outside the JSON block (preambles, code fences) is stripped client-side.
export const structuredReviewPrompt = (papers, topic) => `You are synthesising ${papers.length} papers for a researcher${
  topic ? ` with a focus on: "${topic}"` : ""
}. Read carefully and return ONLY a JSON object — no markdown fences, no commentary.

Schema:
{
  "summary": "2-3 sentence high-level synthesis (string)",
  "agreements": [
    { "point": "what the papers agree on (string, ~25 words)", "papers": ["<first-author surname> <year>", "..."] }
  ],
  "contradictions": [
    { "point": "what the papers disagree on", "papers": ["..."] }
  ],
  "gaps": [
    { "point": "what's missing from the literature", "papers": ["..."] }
  ],
  "future_directions": [
    "string (one sentence)"
  ],
  "per_paper": [
    { "id": "paper id from the input", "contribution": "1 sentence on this paper's distinct contribution to the topic" }
  ]
}

Rules:
- Every list should have 2-5 items unless the literature genuinely supports fewer.
- Cite using first-author surname + year, e.g. "Blank 2018".
- "per_paper" must include every paper, in input order.
- Be precise; do not invent findings.

PAPERS:
${papers.map((p) => `[id: ${p.id}]\n${p.authors} (${p.year}). "${p.title}". ${p.journal}.\nAbstract: ${p.abstract}\nKey: ${p.keyFindings.join("; ")}`).join("\n\n")}`;

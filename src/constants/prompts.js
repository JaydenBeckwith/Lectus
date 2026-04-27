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

export const reviewPrompt = (papers, topic) => `Write a literature review paragraph${
  topic ? ` focused on: "${topic}"` : ""
} synthesising the following ${papers.length} papers. Use academic tone, cite each as (Author Year) using first author surname, weave into coherent narrative. Highlight agreements, disagreements, gaps. 250-400 words.

PAPERS:
${papers
  .map(
    (p, i) =>
      `${i + 1}. ${p.authors} (${p.year}). "${p.title}". ${p.journal}.\nAbstract: ${p.abstract}\nKey: ${p.keyFindings.join("; ")}`
  )
  .join("\n\n")}`;

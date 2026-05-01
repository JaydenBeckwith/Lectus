// Prompt builders. Helpers below keep the template literals readable and
// short; the model gets a clean stitched-together string.

const formatLibrary = (papers) =>
  papers
    .map(
      (p) =>
        "\n---\n" +
        "ID: " + p.id + "\n" +
        "Title: " + p.title + "\n" +
        "Authors: " + p.authors + "\n" +
        "Journal: " + p.journal + " (" + p.year + ")\n" +
        "Tags: " + p.tags.join(", ") + "\n" +
        "Abstract: " + p.abstract + "\n" +
        "Key Findings: " + p.keyFindings.join(" | ") + "\n" +
        (p.notes ? "User's Notes: " + p.notes + "\n" : "") +
        (p.highlights?.length ? "User's Highlights: " + p.highlights.join(" | ") + "\n" : "")
    )
    .join("");

const formatPapers = (papers) =>
  papers
    .map(
      (p, i) =>
        (i + 1) + ". " + p.authors + " (" + p.year + '). "' + p.title + '". ' + p.journal +
        ".\nAbstract: " + p.abstract +
        "\nKey: " + p.keyFindings.join("; ")
    )
    .join("\n\n");

const formatPapersWithIds = (papers) =>
  papers
    .map(
      (p) =>
        "[id: " + p.id + "]\n" + p.authors + " (" + p.year + '). "' + p.title + '". ' + p.journal +
        ".\nAbstract: " + p.abstract +
        "\nKey: " + p.keyFindings.join("; ")
    )
    .join("\n\n");

export const SYSTEM_PROMPT = (papers) =>
  "You are an expert research assistant for a researcher. You have access to their personal paper library containing " +
  papers.length +
  " papers, including their personal notes and highlights.\n\nLIBRARY:\n" +
  formatLibrary(papers) +
  "\n\nAnswer questions by drawing on this library. Cite papers by title. Incorporate the user's notes/highlights when relevant. Be precise and scientifically rigorous.";

export const tagSuggestionPrompt = (paper, existing = []) =>
  "Suggest 4-6 short scientific tags for this paper. Tags should be lowercase noun-phrases — concepts, methods, diseases, drug classes, biological pathways, or study types. Keep each tag 1-3 words. Avoid full sentences.\n\n" +
  "Return ONLY a JSON array of strings, no commentary, no markdown.\n\n" +
  "Title: " + paper.title + "\n" +
  "Authors: " + paper.authors + "\n" +
  "Journal: " + (paper.journal || "(unknown)") + " " + (paper.year ? "(" + paper.year + ")" : "") + "\n" +
  "Abstract: " + (paper.abstract || "(no abstract available)") + "\n" +
  (paper.keyFindings?.length ? "Key findings: " + paper.keyFindings.join("; ") + "\n" : "") +
  (existing?.length ? "Existing tags (do NOT repeat these): " + existing.join(", ") : "");

export const PDF_EXTRACT_PROMPT =
  'Extract metadata and return ONLY a JSON object (no markdown):\n' +
  '{"title":"...","authors":"First Author, Second Author, et al.","journal":"...","year":2024,"doi":"...","tags":["tag1","tag2","tag3","tag4","tag5"],"abstract":"...","keyFindings":["finding 1","finding 2","finding 3"]}\n\n' +
  "Tags: 4-6 scientific keywords. Key findings: 3 short statements (max 12 words each). Return ONLY the JSON.";

export const reviewPrompt = (papers, topic) =>
  "Write a literature review paragraph" +
  (topic ? ' focused on: "' + topic + '"' : "") +
  " synthesising the following " + papers.length + " papers. Use academic tone, cite each as (Author Year) using first author surname, weave into coherent narrative. Highlight agreements, disagreements, gaps. 250-400 words.\n\nPAPERS:\n" +
  formatPapers(papers);

export const structuredReviewPrompt = (papers, topic) =>
  "You are synthesising " + papers.length + " papers for a researcher" +
  (topic ? ' with a focus on: "' + topic + '"' : "") +
  ". Return ONLY a JSON object — no markdown fences, no commentary.\n\n" +
  "Schema:\n" +
  '{ "summary": "2-3 sentence high-level synthesis", ' +
  '"agreements": [{ "point": "string", "papers": ["Surname Year"] }], ' +
  '"contradictions": [{ "point": "string", "papers": ["Surname Year"] }], ' +
  '"gaps": [{ "point": "string", "papers": ["Surname Year"] }], ' +
  '"future_directions": ["string"], ' +
  '"per_paper": [{ "id": "input id", "contribution": "1 sentence" }] }\n\n' +
  "Rules:\n" +
  "- Every list should have 2-5 items unless the literature genuinely supports fewer.\n" +
  '- Cite using first-author surname + year, e.g. "Blank 2018".\n' +
  '- "per_paper" must include every paper in input order.\n' +
  "- Be precise; do not invent findings.\n\n" +
  "PAPERS:\n" +
  formatPapersWithIds(papers);

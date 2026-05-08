// Prompt builders. Helpers below keep the template literals readable and
// short; the model gets a clean stitched-together string.

// Truncate long section text so we don't blow up the context window when a
// paper has a 5,000-word Discussion. Most LLM-grade synthesis tasks only need
// a few hundred words per section to find the relevant claim.
const trim = (text, max = 1200) => {
  if (!text) return "";
  const t = String(text).trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + " […truncated]";
};

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
        (p.methods ? "Methods: " + trim(p.methods) + "\n" : "") +
        (p.results ? "Results: " + trim(p.results) + "\n" : "") +
        (p.discussion ? "Discussion: " + trim(p.discussion) + "\n" : "") +
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
        (p.methods ? "\nMethods: " + trim(p.methods) : "") +
        (p.results ? "\nResults: " + trim(p.results) : "") +
        (p.discussion ? "\nDiscussion: " + trim(p.discussion) : "") +
        "\nKey: " + p.keyFindings.join("; ")
    )
    .join("\n\n");

const formatPapersWithIds = (papers) =>
  papers
    .map(
      (p) =>
        "[id: " + p.id + "]\n" + p.authors + " (" + p.year + '). "' + p.title + '". ' + p.journal +
        ".\nAbstract: " + p.abstract +
        (p.methods ? "\nMethods: " + trim(p.methods) : "") +
        (p.results ? "\nResults: " + trim(p.results) : "") +
        (p.discussion ? "\nDiscussion: " + trim(p.discussion) : "") +
        "\nKey: " + p.keyFindings.join("; ")
    )
    .join("\n\n");

export const SYSTEM_PROMPT = (papers) =>
  "You are an expert research assistant for a researcher. You have access to their personal paper library containing " +
  papers.length +
  " papers, including their personal notes and highlights.\n\nLIBRARY:\n" +
  formatLibrary(papers) +
  "\n\nAnswer questions by drawing on this library. Cite papers by title. When relevant, draw on the methods, results, and discussion text supplied for each paper rather than only the abstract. Incorporate the user's notes/highlights when relevant. Be precise and scientifically rigorous.";

export const tagSuggestionPrompt = (paper, existing = []) =>
  "Suggest 4-6 short scientific tags for this paper. Tags should be lowercase noun-phrases — concepts, methods, diseases, drug classes, biological pathways, or study types. Keep each tag 1-3 words. Avoid full sentences.\n\n" +
  "Return ONLY a JSON array of strings, no commentary, no markdown.\n\n" +
  "Title: " + paper.title + "\n" +
  "Authors: " + paper.authors + "\n" +
  "Journal: " + (paper.journal || "(unknown)") + " " + (paper.year ? "(" + paper.year + ")" : "") + "\n" +
  "Abstract: " + (paper.abstract || "(no abstract available)") + "\n" +
  (paper.keyFindings?.length ? "Key findings: " + paper.keyFindings.join("; ") + "\n" : "") +
  (existing?.length ? "Existing tags (do NOT repeat these): " + existing.join(", ") : "");

// Extracts metadata + the three substantive prose sections (methods, results,
// discussion). Sections are stored as plain strings — no internal markdown —
// so the UI can render them however it likes (collapsible blocks, etc.).
export const PDF_EXTRACT_PROMPT =
  'Extract metadata AND the substantive prose sections from this paper. Return ONLY a JSON object (no markdown):\n' +
  '{"title":"...","authors":"First Author, Second Author, et al.","journal":"...","year":2024,"doi":"...","tags":["tag1","tag2","tag3","tag4","tag5"],"abstract":"...","keyFindings":["finding 1","finding 2","finding 3"],"methods":"...","results":"...","discussion":"..."}\n\n' +
  "Rules:\n" +
  "- Tags: 4-6 scientific keywords. Key findings: 3 short statements (max 12 words each).\n" +
  "- abstract: copy the paper's abstract verbatim if present, otherwise a 3-5 sentence faithful summary.\n" +
  "- methods: a faithful 150-400 word summary of the paper's methods/materials section (study design, cohort, assays, statistical approach). Plain prose, no headings, no bullets.\n" +
  "- results: a faithful 150-400 word summary of the results section (key quantitative findings, effect sizes/p-values where stated). Plain prose.\n" +
  "- discussion: a faithful 150-400 word summary of the discussion / conclusions section (interpretation, limitations, implications). Plain prose.\n" +
  '- If a section is genuinely absent (e.g. an editorial), set its value to an empty string "".\n' +
  "- Do NOT invent findings. Do NOT include section headings or bullet markers inside the section strings.\n" +
  "Return ONLY the JSON.";

export const reviewPrompt = (papers, topic) =>
  "Write a literature review paragraph" +
  (topic ? ' focused on: "' + topic + '"' : "") +
  " synthesising the following " + papers.length + " papers. Use academic tone, cite each as (Author Year) using first author surname, weave into coherent narrative. Highlight agreements, disagreements, gaps. 250-400 words. Use the methods, results, and discussion text where available — not just the abstract.\n\nPAPERS:\n" +
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
  "- Be precise; do not invent findings. Use the methods/results/discussion text supplied where helpful.\n\n" +
  "PAPERS:\n" +
  formatPapersWithIds(papers);

// DOI-add enrichment. We've already pulled citation metadata (and possibly
// an abstract) from CrossRef/OpenAlex. The model now fills in keyFindings +
// methods + results + discussion. Honesty rule: it should be obvious from the
// prompt that we don't have full text, so the LLM is asked to base everything
// on the provided abstract + any prior knowledge of the paper, and to leave
// fields empty when it can't support the content.
export const enrichFromCitationPrompt = (paper) =>
  "You are enriching a citation entry where we have the abstract but NOT the full paper. " +
  "Generate the missing fields based on the supplied abstract. You may also draw on prior knowledge of this specific paper if you are confident — but do NOT invent results, mechanisms, or numbers. " +
  "Return ONLY a JSON object — no markdown fences, no commentary.\n\n" +
  "Schema:\n" +
  '{ "keyFindings": ["finding 1", "finding 2", "finding 3"], ' +
  '"methods": "...", ' +
  '"results": "...", ' +
  '"discussion": "..." }\n\n' +
  "Rules:\n" +
  "- keyFindings: exactly 3 short statements (max 12 words each), drawn from the abstract.\n" +
  "- methods / results / discussion: 2-5 sentence summaries grounded in the abstract. If the abstract is silent on a section, return an empty string for that field rather than speculating. Plain prose, no headings.\n" +
  "- If the abstract is empty or unusable, set keyFindings to an empty array and the three section strings to empty strings.\n\n" +
  "CITATION:\n" +
  "Title: " + (paper.title || "(unknown)") + "\n" +
  "Authors: " + (paper.authors || "(unknown)") + "\n" +
  "Journal: " + (paper.journal || "(unknown)") + " " + (paper.year ? "(" + paper.year + ")" : "") + "\n" +
  "DOI: " + (paper.doi || "(none)") + "\n" +
  "Abstract: " + (paper.abstract || "(no abstract available)");

// Per-section deepen. The user has a paper they added via DOI (so we only
// have the abstract) and wants a fuller summary of one specific section.
// The model is instructed to lean on the abstract first, then prior knowledge
// of THIS paper if it is confident — and to be explicit when it can only go
// so far. Output is plain prose; we drop it straight into the UI.
const SECTION_GUIDANCE = {
  methods:
    "Cover study design, cohort/sample, key materials and assays, statistical approach, and any unusual methodological choices. Mention sample sizes if known.",
  results:
    "Cover the main quantitative findings, key effect sizes / p-values where stated, and any subgroup or secondary findings. Be specific where the source supports it.",
  discussion:
    "Cover how the authors interpret their findings, how they relate to prior literature, stated limitations, and clinical/scientific implications.",
};

export const sectionDeepenPrompt = (paper, section) =>
  "You are producing a longer, more detailed summary of the " + section.toUpperCase() +
  " section of a single paper. Base your summary on the abstract supplied below, " +
  "and on prior knowledge of this specific paper if you are confident — but do NOT invent results, mechanisms, or numbers.\n\n" +
  "Guidance for the " + section + " section: " + (SECTION_GUIDANCE[section] || "") + "\n\n" +
  "Length: 200-450 words. Plain prose only — no headings, no bullets, no markdown. " +
  "If the abstract is silent on this section AND you do not have reliable prior knowledge of this paper, return a single sentence noting that — do NOT speculate.\n\n" +
  "PAPER:\n" +
  "Title: " + (paper.title || "(unknown)") + "\n" +
  "Authors: " + (paper.authors || "(unknown)") + "\n" +
  "Journal: " + (paper.journal || "(unknown)") + " " + (paper.year ? "(" + paper.year + ")" : "") + "\n" +
  "DOI: " + (paper.doi || "(none)") + "\n" +
  "Abstract: " + (paper.abstract || "(no abstract available)") + "\n" +
  (paper[section] ? "Existing " + section + " summary (improve on this if possible): " + paper[section] : "");

// Compare-view contradiction analysis. Asks the model to read the supplied
// papers and surface points where they disagree (in claims, methods, or
// interpretation). Returns a strict JSON object the UI can render.
export const contradictionPrompt = (papers) =>
  "You are comparing " + papers.length + " papers for a researcher and looking specifically for CONTRADICTIONS — places where the papers disagree on findings, effect sizes, mechanisms, methodology, or interpretation. Return ONLY a JSON object — no markdown fences, no commentary.\n\n" +
  "Schema:\n" +
  '{ "summary": "1-2 sentence high-level read on whether these papers agree or disagree overall", ' +
  '"contradictions": [{ "topic": "short label", "detail": "1-3 sentence description of the disagreement, citing what each paper claims", "papers": ["Surname Year", "Surname Year"] }], ' +
  '"agreements": [{ "point": "1-2 sentence shared finding", "papers": ["Surname Year"] }] }\n\n' +
  "Rules:\n" +
  '- "contradictions" should have 0-6 items. Only include genuine contradictions — not topical differences.\n' +
  '- "agreements" should have 0-4 items capturing where the papers converge.\n' +
  '- Cite using first-author surname + year, e.g. "Blank 2018". Each item must reference at least 2 papers when possible.\n' +
  "- Use the methods/results/discussion text where available, not just the abstract.\n" +
  "- Be precise; do not invent disagreements. If the papers don't really conflict, return an empty contradictions array and explain in the summary.\n\n" +
  "PAPERS:\n" +
  formatPapersWithIds(papers);

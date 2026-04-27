// ── Lightweight markdown renderer ─────────────────────────────────────────────
// Used by ChatView to render assistant messages. Handles **bold**, leading
// "- " bullets, and newlines. Output is injected via dangerouslySetInnerHTML
// so input must be trusted (it always is — comes from our own API call).

export const fmt = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.*$)/gm, "<li>$1</li>")
    .replace(/\n/g, "<br/>");

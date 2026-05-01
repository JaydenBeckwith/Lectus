import { useState } from "react";
import { tagColor } from "../constants/tagColors";

// Editable list of tags with optional AI suggestion. Click × to remove,
// type + Enter (or comma) to add. If `onSuggest` is provided AND
// `canSuggest` is true, a "Suggest tags" button appears below; clicking it
// shows ghost chips that the user can click to accept individually or
// "Add all".
export default function TagEditor({
  tags = [],
  onChange,
  onSuggest,
  canSuggest = false,
  theme,
}) {
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  const add = (raw) => {
    const t = raw.trim();
    if (!t) return;
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, t]);
    setDraft("");
    // If user accepted a suggested tag via typing, drop it from suggestions.
    setSuggestions((prev) => prev.filter((s) => s.toLowerCase() !== t.toLowerCase()));
  };

  const remove = (i) => onChange(tags.filter((_, idx) => idx !== i));

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      remove(tags.length - 1);
    }
  };

  const handleSuggest = async () => {
    if (!onSuggest || suggestLoading) return;
    setSuggestLoading(true);
    setSuggestError("");
    try {
      const next = await onSuggest();
      // Filter out anything that's already a tag (case-insensitive).
      const lowerExisting = new Set(tags.map((t) => t.toLowerCase()));
      const fresh = (next || []).filter((t) => !lowerExisting.has(t.toLowerCase()));
      setSuggestions(fresh);
      if (fresh.length === 0 && (next || []).length > 0) {
        setSuggestError("All suggestions already in your tags.");
      } else if (fresh.length === 0) {
        setSuggestError("No suggestions returned.");
      }
    } catch (err) {
      setSuggestError(err.message || "Suggestion failed");
    } finally {
      setSuggestLoading(false);
    }
  };

  const acceptSuggestion = (s) => {
    if (!tags.some((x) => x.toLowerCase() === s.toLowerCase())) {
      onChange([...tags, s]);
    }
    setSuggestions((prev) => prev.filter((x) => x !== s));
  };

  const acceptAll = () => {
    const lowerExisting = new Set(tags.map((t) => t.toLowerCase()));
    const toAdd = suggestions.filter((s) => !lowerExisting.has(s.toLowerCase()));
    if (toAdd.length) onChange([...tags, ...toAdd]);
    setSuggestions([]);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
          alignItems: "center",
          background: theme.inputBg,
          border: `1px solid ${theme.inputBorder}`,
          borderRadius: 8,
          padding: "0.45rem 0.5rem",
        }}
      >
        {tags.map((t, i) => (
          <span
            key={`${t}-${i}`}
            style={{
              background: tagColor(t) + "33",
              color: tagColor(t) + "ee",
              border: `1px solid ${tagColor(t)}44`,
              borderRadius: 12,
              padding: "0.18rem 0.55rem",
              fontSize: "0.7rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {t}
            <button
              onClick={() => remove(i)}
              style={{
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: "0.7rem",
                padding: 0,
                lineHeight: 1,
                opacity: 0.7,
              }}
              aria-label={`Remove tag ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={tags.length ? "" : "Add a tag…"}
          style={{
            flex: 1,
            minWidth: 100,
            background: "transparent",
            border: "none",
            color: theme.text,
            fontSize: "0.78rem",
            padding: "0.1rem 0.2rem",
          }}
        />
      </div>

      {/* Suggestion bar */}
      {onSuggest && (
        <div style={{ marginTop: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={handleSuggest}
              disabled={!canSuggest || suggestLoading}
              title={canSuggest ? "Ask Claude to read the abstract and suggest tags" : "Add an Anthropic API key in Settings to enable"}
              style={{
                background: "transparent",
                border: `1px solid ${canSuggest ? theme.chipBorder : theme.panelBorder}`,
                color: canSuggest ? theme.accent : theme.textMuted,
                borderRadius: 6,
                padding: "0.3rem 0.7rem",
                fontSize: "0.7rem",
                cursor: canSuggest && !suggestLoading ? "pointer" : "not-allowed",
                letterSpacing: "0.04em",
              }}
            >
              {suggestLoading ? "Thinking…" : "✨ Suggest tags"}
            </button>
            {suggestions.length > 0 && (
              <button
                onClick={acceptAll}
                style={{
                  background: theme.chip,
                  border: `1px solid ${theme.chipBorder}`,
                  color: theme.accent,
                  borderRadius: 6,
                  padding: "0.3rem 0.7rem",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                }}
              >
                Add all ({suggestions.length})
              </button>
            )}
            {suggestions.length > 0 && (
              <button
                onClick={() => setSuggestions([])}
                style={{
                  background: "transparent",
                  border: "none",
                  color: theme.textMuted,
                  fontSize: "0.65rem",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                dismiss
              </button>
            )}
            {suggestError && (
              <span style={{ fontSize: "0.7rem", color: theme.textMuted, fontStyle: "italic" }}>
                {suggestError}
              </span>
            )}
          </div>

          {suggestions.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.35rem",
                marginTop: "0.5rem",
                paddingTop: "0.5rem",
                borderTop: `1px dashed ${theme.panelBorder}`,
              }}
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => acceptSuggestion(s)}
                  title="Click to add"
                  style={{
                    background: "transparent",
                    color: tagColor(s) + "ee",
                    border: `1px dashed ${tagColor(s)}66`,
                    borderRadius: 12,
                    padding: "0.18rem 0.55rem 0.18rem 0.45rem",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <span style={{ opacity: 0.6, fontSize: "0.8rem", lineHeight: 1 }}>+</span>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

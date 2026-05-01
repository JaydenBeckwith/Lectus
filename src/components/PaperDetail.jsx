import { useState } from "react";
import TagEditor from "./TagEditor";

// Detail view for a single paper: status, abstract, key findings,
// highlights and personal notes. Triggers a chat query via onAskAI.
export default function PaperDetail({
  paper,
  statusColors,
  onUpdate,
  onDelete,
  onBack,
  onAskAI,
  onSuggestTags,
  hasKey,
  theme,
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");
  const [newHighlight, setNewHighlight] = useState("");

  const addHighlight = () => {
    const h = newHighlight.trim();
    if (!h) return;
    onUpdate(paper.id, { highlights: [...(paper.highlights || []), h] });
    setNewHighlight("");
  };

  const removeHighlight = (idx) => {
    onUpdate(paper.id, {
      highlights: paper.highlights.filter((_, i) => i !== idx),
    });
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.5rem",
        maxWidth: 740,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: theme.textMuted,
          cursor: "pointer",
          fontSize: "0.78rem",
          marginBottom: "1.25rem",
        }}
      >
        ← Back
      </button>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "1.5rem",
          color: theme.textBright,
          lineHeight: 1.35,
          marginBottom: "0.5rem",
        }}
      >
        {paper.title}
      </div>
      <div style={{ fontSize: "0.78rem", color: theme.textSubtle, marginBottom: "0.75rem" }}>
        {paper.authors}
      </div>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
        {Object.entries(statusColors).map(([s, c]) => (
          <button
            key={s}
            onClick={() => onUpdate(paper.id, { status: s })}
            style={{
              background: paper.status === s ? c.bg : "transparent",
              color: paper.status === s ? c.color : theme.textMuted,
              border: `1px solid ${paper.status === s ? c.color + "55" : theme.panelBorder}`,
              fontSize: "0.65rem",
              padding: "0.25rem 0.7rem",
              borderRadius: 4,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "0.75rem",
            color: theme.textSubtle,
            background: theme.panel,
            border: `1px solid ${theme.panelBorder}`,
            borderRadius: 6,
            padding: "0.25rem 0.6rem",
          }}
        >
          {paper.journal} · {paper.year}
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            color: theme.textSubtle,
            background: theme.panel,
            border: `1px solid ${theme.panelBorder}`,
            borderRadius: 6,
            padding: "0.25rem 0.6rem",
          }}
        >
          DOI: {paper.doi}
        </span>
      </div>

      {/* Tags — editable, with optional AI suggestion */}
      <div style={{ marginBottom: "1.25rem" }}>
        <TagEditor
          tags={paper.tags}
          onChange={(next) => onUpdate(paper.id, { tags: next })}
          onSuggest={onSuggestTags ? () => onSuggestTags(paper) : undefined}
          canSuggest={Boolean(hasKey)}
          theme={theme}
        />
      </div>

      <Section title="Abstract" theme={theme}>
        <div style={{ fontSize: "0.83rem", lineHeight: 1.7, color: theme.text }}>{paper.abstract}</div>
      </Section>

      <Section title="Key Findings" theme={theme}>
        {paper.keyFindings.map((f, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: "0.6rem", marginBottom: "0.4rem", alignItems: "flex-start" }}
          >
            <span style={{ color: theme.accent, fontSize: "0.7rem", marginTop: "0.15rem", flexShrink: 0 }}>◆</span>
            <span style={{ fontSize: "0.82rem", color: theme.text, lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </Section>

      <Section
        title="Highlights"
        theme={theme}
        right={<span style={{ color: theme.textMuted }}>{paper.highlights?.length || 0}</span>}
      >
        {paper.highlights?.map((h, i) => (
          <div
            key={i}
            style={{
              background: theme.accent + "11",
              borderLeft: `2px solid ${theme.accent}`,
              padding: "0.5rem 0.75rem",
              marginBottom: "0.4rem",
              fontSize: "0.78rem",
              color: theme.text,
              lineHeight: 1.6,
              fontStyle: "italic",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "0.5rem",
            }}
          >
            <span>"{h}"</span>
            <button
              onClick={() => removeHighlight(i)}
              style={{
                background: "none",
                border: "none",
                color: theme.textMuted,
                cursor: "pointer",
                fontSize: "0.7rem",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
          <input
            value={newHighlight}
            onChange={(e) => setNewHighlight(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addHighlight();
            }}
            placeholder="Add a highlight quote..."
            style={{
              flex: 1,
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: 6,
              padding: "0.4rem 0.6rem",
              color: theme.text,
              fontSize: "0.78rem",
            }}
          />
          <button
            onClick={addHighlight}
            style={{
              background: theme.chip,
              border: `1px solid ${theme.chipBorder}`,
              color: theme.accent,
              borderRadius: 6,
              padding: "0.4rem 0.8rem",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </Section>

      <Section
        title="My Notes"
        theme={theme}
        right={
          !editingNotes && (
            <button
              onClick={() => {
                setTempNotes(paper.notes || "");
                setEditingNotes(true);
              }}
              style={{
                background: "none",
                border: "none",
                color: theme.accent,
                cursor: "pointer",
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {paper.notes ? "Edit" : "+ Add"}
            </button>
          )
        }
      >
        {editingNotes ? (
          <div>
            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Your thoughts, connections, questions..."
              rows={5}
              style={{
                width: "100%",
                background: theme.inputBg,
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: 6,
                padding: "0.6rem 0.75rem",
                color: theme.text,
                fontSize: "0.82rem",
                resize: "vertical",
                lineHeight: 1.6,
              }}
            />
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => {
                  onUpdate(paper.id, { notes: tempNotes });
                  setEditingNotes(false);
                }}
                style={{
                  background: theme.accent,
                  border: "none",
                  color: theme.bg,
                  borderRadius: 6,
                  padding: "0.35rem 0.9rem",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingNotes(false)}
                style={{
                  background: "transparent",
                  border: `1px solid ${theme.panelBorder}`,
                  color: theme.textSubtle,
                  borderRadius: 6,
                  padding: "0.35rem 0.9rem",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: "0.82rem",
              color: paper.notes ? theme.text : theme.textMuted,
              lineHeight: 1.7,
              fontStyle: paper.notes ? "normal" : "italic",
            }}
          >
            {paper.notes || "No notes yet."}
          </div>
        )}
      </Section>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() =>
            onAskAI(
              `Summarise the key findings of "${paper.title}" and how it connects to other papers in my library.${
                paper.notes ? ` Also consider my notes: "${paper.notes}"` : ""
              }`
            )
          }
          style={{
            background: theme.chip,
            border: `1px solid ${theme.chipBorder}`,
            color: theme.accent,
            borderRadius: 8,
            padding: "0.5rem 1rem",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Ask AI about this paper →
        </button>

        {onDelete && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  `Delete "${paper.title}"?\n\nThis removes the paper, your notes, and your highlights from the library. This can't be undone unless you have a JSON backup.`
                )
              ) {
                onDelete(paper.id);
              }
            }}
            style={{
              background: "transparent",
              border: `1px solid #c47a6e55`,
              color: "#c47a6e",
              borderRadius: 8,
              padding: "0.5rem 1rem",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#c47a6e22";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Delete from library
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, right, children, theme }) {
  return (
    <div
      style={{
        background: theme.panel,
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: 10,
        padding: "1rem 1.1rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          color: theme.textMuted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "0.6rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{title}</span>
        {right}
      </div>
      {children}
    </div>
  );
}


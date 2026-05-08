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
  onDeepenSection,
  hasKey,
  projects = [],
  onToggleProject,
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

      {/* Projects — toggle membership across one or more projects */}
      {projects.length > 0 && onToggleProject && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.62rem", color: theme.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Projects</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {projects.map((proj) => {
              const inProj = (paper.projects || []).includes(proj.id);
              return (
                <button
                  key={proj.id}
                  onClick={() => onToggleProject(paper.id, proj.id)}
                  title={inProj ? "Remove from " + proj.name : "Add to " + proj.name}
                  style={{
                    background: inProj ? theme.accent + "22" : "transparent",
                    border: "1px solid " + (inProj ? theme.accent : theme.panelBorder),
                    color: inProj ? theme.accent : theme.textSubtle,
                    borderRadius: 14,
                    padding: "0.22rem 0.7rem",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                    transition: "all .15s",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  {inProj && <span style={{ fontSize: "0.7rem" }}>✓</span>}
                  {proj.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Section title="Abstract" theme={theme}>
        <div style={{ fontSize: "0.83rem", lineHeight: 1.7, color: theme.text }}>{paper.abstract}</div>
      </Section>

      <CollapsibleSection
        title="Methods"
        sectionKey="methods"
        body={paper.methods}
        onDeepen={onDeepenSection}
        canDeepen={Boolean(hasKey)}
        theme={theme}
      />
      <CollapsibleSection
        title="Results"
        sectionKey="results"
        body={paper.results}
        onDeepen={onDeepenSection}
        canDeepen={Boolean(hasKey)}
        theme={theme}
      />
      <CollapsibleSection
        title="Discussion"
        sectionKey="discussion"
        body={paper.discussion}
        onDeepen={onDeepenSection}
        canDeepen={Boolean(hasKey)}
        theme={theme}
      />

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

// Collapsible block for a longer prose section (Methods / Results /
// Discussion). Always renders so the user can request an AI-deepened
// summary even when DOI-add only gave us the abstract.
function CollapsibleSection({ title, sectionKey, body, onDeepen, canDeepen, theme }) {
  const hasBody = Boolean(body && body.trim());
  const [open, setOpen] = useState(hasBody ? false : true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeepen = async (e) => {
    e?.stopPropagation();
    if (!onDeepen || loading) return;
    setLoading(true);
    setError("");
    try {
      await onDeepen(sectionKey);
      setOpen(true);
    } catch (err) {
      setError(err?.message || "Could not generate summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: theme.panel,
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: 10,
        padding: "0.85rem 1.1rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.6rem",
        }}
      >
        <button
          onClick={() => hasBody && setOpen((o) => !o)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: hasBody ? "pointer" : "default",
            color: "inherit",
            flex: 1,
            textAlign: "left",
          }}
        >
          <span
            style={{
              fontSize: "0.65rem",
              color: theme.textMuted,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </span>
          {hasBody && (
            <span style={{ fontSize: "0.7rem", color: theme.accent }}>
              {open ? "Hide ▴" : "Show ▾"}
            </span>
          )}
          {!hasBody && (
            <span style={{ fontSize: "0.68rem", color: theme.textMuted, fontStyle: "italic" }}>
              not extracted
            </span>
          )}
        </button>

        {onDeepen && (
          <button
            onClick={handleDeepen}
            disabled={loading || !canDeepen}
            title={canDeepen ? "Use AI to write a longer summary of this section" : "Connect an AI provider in Settings"}
            style={{
              background: canDeepen ? theme.chip : "transparent",
              border: `1px solid ${canDeepen ? theme.chipBorder : theme.panelBorder}`,
              color: canDeepen ? theme.accent : theme.textMuted,
              borderRadius: 6,
              padding: "0.25rem 0.6rem",
              fontSize: "0.65rem",
              cursor: canDeepen && !loading ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Thinking…" : hasBody ? "Expand with AI ✦" : "Generate with AI ✦"}
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            background: "#7c4a4a22",
            border: "1px solid #7c4a4a55",
            color: "#c47a6e",
            borderRadius: 6,
            padding: "0.4rem 0.6rem",
            marginTop: "0.55rem",
            fontSize: "0.74rem",
          }}
        >
          {error}
        </div>
      )}

      {open && hasBody && (
        <div
          className="fade-in"
          style={{
            fontSize: "0.83rem",
            lineHeight: 1.7,
            color: theme.text,
            marginTop: "0.7rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {body}
        </div>
      )}
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

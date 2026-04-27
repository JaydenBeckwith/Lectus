// Literature review generator: pick papers, optionally focus a topic,
// get a publication-ready paragraph back.
export default function ReviewView({
  papers,
  reviewSelection,
  setReviewSelection,
  reviewTopic,
  setReviewTopic,
  reviewOutput,
  reviewLoading,
  onGenerate,
  theme,
}) {
  const toggle = (id) =>
    setReviewSelection(
      reviewSelection.includes(id)
        ? reviewSelection.filter((x) => x !== id)
        : [...reviewSelection, id]
    );

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.5rem",
        maxWidth: 900,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "1.6rem",
          fontStyle: "italic",
          color: theme.textBright,
          marginBottom: "0.3rem",
        }}
      >
        Literature review
      </div>
      <div style={{ fontSize: "0.78rem", color: theme.textMuted, marginBottom: "1.5rem" }}>
        Select papers, optionally focus a topic, get a publication-ready paragraph
      </div>

      {/* Topic input */}
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            fontSize: "0.68rem",
            color: theme.textMuted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "0.4rem",
          }}
        >
          Topic / Focus (optional)
        </div>
        <input
          value={reviewTopic}
          onChange={(e) => setReviewTopic(e.target.value)}
          placeholder="e.g. CTLA4 isoform switching as a biomarker"
          style={{
            width: "100%",
            background: theme.inputBg,
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: 8,
            padding: "0.55rem 0.75rem",
            color: theme.text,
            fontSize: "0.82rem",
          }}
        />
      </div>

      {/* Selection header */}
      <div
        style={{
          fontSize: "0.68rem",
          color: theme.textMuted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "0.5rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Select papers ({reviewSelection.length} selected)</span>
        {reviewSelection.length > 0 && (
          <button
            onClick={() => setReviewSelection([])}
            style={{
              background: "none",
              border: "none",
              color: theme.textSubtle,
              fontSize: "0.65rem",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Paper checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.5rem" }}>
        {papers.map((p) => {
          const sel = reviewSelection.includes(p.id);
          return (
            <div
              key={p.id}
              onClick={() => toggle(p.id)}
              style={{
                background: sel ? theme.chip : theme.panel,
                border: `1px solid ${sel ? theme.accent : theme.panelBorder}`,
                borderRadius: 8,
                padding: "0.7rem 0.85rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.7rem",
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: `1.5px solid ${sel ? theme.accent : theme.panelBorder}`,
                  background: sel ? theme.accent : "transparent",
                  marginTop: "0.15rem",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  color: theme.bg,
                }}
              >
                {sel && "✓"}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "0.85rem",
                    color: theme.textBright,
                    lineHeight: 1.35,
                    marginBottom: "0.2rem",
                  }}
                >
                  {p.title}
                </div>
                <div style={{ fontSize: "0.68rem", color: theme.textMuted }}>
                  {p.authors.split(",")[0]} et al. · {p.year}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onGenerate}
        disabled={reviewSelection.length < 2 || reviewLoading}
        style={{
          background: reviewSelection.length >= 2 ? theme.accent : theme.chip,
          color: reviewSelection.length >= 2 ? theme.bg : theme.textMuted,
          border: "none",
          borderRadius: 8,
          padding: "0.7rem 1.5rem",
          fontSize: "0.82rem",
          fontWeight: 500,
          cursor: reviewSelection.length >= 2 && !reviewLoading ? "pointer" : "not-allowed",
          marginBottom: "1.5rem",
        }}
      >
        {reviewLoading
          ? "Synthesising..."
          : `Generate review${
              reviewSelection.length >= 2 ? ` from ${reviewSelection.length} papers` : " (select 2+)"
            }`}
      </button>

      {(reviewOutput || reviewLoading) && (
        <div
          className="fade-in"
          style={{
            background: theme.panel,
            border: `1px solid ${theme.panelBorder}`,
            borderRadius: 10,
            padding: "1.25rem 1.5rem",
            marginTop: "1rem",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: theme.textMuted,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "0.8rem",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Generated Review</span>
            {reviewOutput && (
              <button
                onClick={() => navigator.clipboard.writeText(reviewOutput)}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.accent,
                  fontSize: "0.65rem",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Copy
              </button>
            )}
          </div>
          {reviewLoading ? (
            <div className="typing">
              <span style={{ background: theme.accent }} />
              <span style={{ background: theme.accent }} />
              <span style={{ background: theme.accent }} />
            </div>
          ) : (
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "0.92rem",
                lineHeight: 1.85,
                color: theme.text,
              }}
            >
              {reviewOutput
                .split("\n")
                .map((para, i) => para.trim() && <p key={i} style={{ marginBottom: "1rem" }}>{para}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

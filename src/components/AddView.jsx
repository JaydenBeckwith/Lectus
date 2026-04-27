import { useRef, useState } from "react";

// Two ways to add a paper: drop a PDF (AI extracts the metadata) or paste a
// DOI (CrossRef lookup, free and instant). Both end at the same `onAdd` /
// `onPdfUpload` handlers wired up in App.jsx.
export default function AddView({
  pdfLoading,
  pdfStatus,
  onPdfUpload,
  onDoiLookup,
  theme,
}) {
  const fileInputRef = useRef(null);

  const [doi, setDoi] = useState("");
  const [doiLoading, setDoiLoading] = useState(false);
  const [doiStatus, setDoiStatus] = useState("");

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    await onPdfUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDoiSubmit = async (e) => {
    e?.preventDefault();
    if (!doi.trim() || doiLoading) return;
    setDoiLoading(true);
    setDoiStatus("Fetching metadata from CrossRef…");
    try {
      const result = await onDoiLookup(doi);
      setDoiStatus(`✓ Added "${result.title.slice(0, 40)}…"`);
      setDoi("");
    } catch (err) {
      setDoiStatus(`Error: ${err.message}`);
    } finally {
      setDoiLoading(false);
      setTimeout(() => setDoiStatus(""), 3500);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.5rem",
        maxWidth: 580,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "1.4rem",
          fontStyle: "italic",
          color: theme.textBright,
          marginBottom: "0.3rem",
        }}
      >
        Add a paper
      </div>
      <div style={{ fontSize: "0.75rem", color: theme.textMuted, marginBottom: "1.5rem" }}>
        Paste a DOI for an instant lookup, or drop a PDF for full AI extraction
      </div>

      {/* DOI lookup */}
      <form
        onSubmit={handleDoiSubmit}
        style={{
          background: theme.panel,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 12,
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
            marginBottom: "0.5rem",
          }}
        >
          Quick add by DOI
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            placeholder="10.1038/s41591-018-0274-4"
            disabled={doiLoading}
            style={{
              flex: 1,
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: 8,
              padding: "0.5rem 0.75rem",
              color: theme.text,
              fontSize: "0.82rem",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          />
          <button
            type="submit"
            disabled={doiLoading || !doi.trim()}
            style={{
              background: doi.trim() && !doiLoading ? theme.accent : theme.chip,
              color: doi.trim() && !doiLoading ? theme.bg : theme.textMuted,
              border: "none",
              borderRadius: 8,
              padding: "0.5rem 1rem",
              fontSize: "0.78rem",
              cursor: doi.trim() && !doiLoading ? "pointer" : "not-allowed",
              fontWeight: 500,
            }}
          >
            {doiLoading ? "…" : "Fetch"}
          </button>
        </div>
        {doiStatus && (
          <div
            style={{
              fontSize: "0.75rem",
              color: doiStatus.startsWith("✓") ? "#6a9060" : doiStatus.startsWith("Error") ? "#c47a6e" : theme.accent,
              marginTop: "0.6rem",
            }}
          >
            {doiStatus}
          </div>
        )}
        <div style={{ fontSize: "0.68rem", color: theme.textMuted, marginTop: "0.5rem" }}>
          Free CrossRef lookup — no API key, no PDF required.
        </div>
      </form>

      {/* PDF dropzone */}
      <div
        onClick={() => !pdfLoading && fileInputRef.current?.click()}
        onMouseEnter={(e) => {
          if (!pdfLoading) {
            e.currentTarget.style.background = theme.panelHover;
            e.currentTarget.style.borderColor = theme.accent;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme.panel;
          e.currentTarget.style.borderColor = theme.panelBorder;
        }}
        style={{
          background: theme.panel,
          border: `2px dashed ${theme.panelBorder}`,
          borderRadius: 12,
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          cursor: pdfLoading ? "not-allowed" : "pointer",
          transition: "all .2s",
          opacity: pdfLoading ? 0.5 : 1,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleChange}
          style={{ display: "none" }}
          disabled={pdfLoading}
        />
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem", opacity: 0.6 }}>📄</div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "1.05rem",
            color: theme.accent,
            marginBottom: "0.3rem",
            fontStyle: "italic",
          }}
        >
          {pdfLoading ? pdfStatus : "Drop a PDF or click to upload"}
        </div>
        <div style={{ fontSize: "0.72rem", color: theme.textMuted }}>
          {pdfLoading ? "" : "AI extracts title, authors, abstract, tags, key findings"}
        </div>
        {pdfStatus && !pdfLoading && (
          <div
            style={{
              fontSize: "0.78rem",
              color: pdfStatus.startsWith("✓") ? "#6a9060" : theme.accent,
              marginTop: "0.75rem",
            }}
          >
            {pdfStatus}
          </div>
        )}
      </div>
    </div>
  );
}

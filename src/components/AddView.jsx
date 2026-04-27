import { useRef } from "react";

// PDF dropzone — sends the file to the AI metadata extractor, then adds the
// resulting paper to the library.
export default function AddView({ pdfLoading, pdfStatus, onPdfUpload, theme }) {
  const fileInputRef = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    await onPdfUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        Drop a PDF — AI extracts everything automatically
      </div>

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

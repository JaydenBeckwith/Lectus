import { useRef, useState } from "react";
import { THEMES } from "../constants/themes";

const ACCENT_SWATCHES = [
  "#c8a96e",
  "#8b5a2b",
  "#5fb3c4",
  "#8fb572",
  "#c47a6e",
  "#9c7ac4",
  "#c4a35f",
  "#7ac49c",
];

// Settings panel: theme picker, accent colour, import/export, library stats.
export default function SettingsView({
  themeKey,
  setThemeKey,
  accentColor,
  setAccentColor,
  papers,
  onExportBibtex,
  onExportJson,
  onImportFile,
  theme,
}) {
  const importRef = useRef(null);
  const [importStatus, setImportStatus] = useState("");

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("Reading file…");
    try {
      const result = await onImportFile(file);
      setImportStatus(`✓ Imported ${result.added} paper${result.added === 1 ? "" : "s"} (${result.skipped} duplicates skipped)`);
    } catch (err) {
      setImportStatus(`Error: ${err.message}`);
    }
    if (importRef.current) importRef.current.value = "";
    setTimeout(() => setImportStatus(""), 4000);
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.5rem",
        maxWidth: 700,
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
        Settings
      </div>
      <div style={{ fontSize: "0.78rem", color: theme.textMuted, marginBottom: "2rem" }}>
        Customise how Lectus looks
      </div>

      {/* Theme picker */}
      <div style={{ marginBottom: "2rem" }}>
        <SectionLabel theme={theme}>Theme</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {Object.entries(THEMES).map(([k, t]) => (
            <button
              key={k}
              onClick={() => {
                setThemeKey(k);
                setAccentColor(null);
              }}
              style={{
                background: t.panel,
                border: `2px solid ${themeKey === k ? t.accent : t.panelBorder}`,
                borderRadius: 10,
                padding: "1rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all .15s",
              }}
            >
              <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.6rem" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: t.bg, border: `1px solid ${t.panelBorder}` }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, background: t.panel, border: `1px solid ${t.panelBorder}` }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, background: t.accent }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, background: t.text, opacity: 0.4 }} />
              </div>
              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "0.95rem",
                  color: t.textBright,
                  fontStyle: "italic",
                }}
              >
                {t.name}
              </div>
              {themeKey === k && (
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: t.accent,
                    marginTop: "0.3rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  ✓ Active
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Accent swatches */}
      <div style={{ marginBottom: "2rem" }}>
        <SectionLabel theme={theme}>Accent Colour</SectionLabel>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {ACCENT_SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => setAccentColor(c)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: c,
                border: `2px solid ${theme.accent === c ? theme.textBright : "transparent"}`,
                cursor: "pointer",
                transition: "all .15s",
              }}
            />
          ))}
          <button
            onClick={() => setAccentColor(null)}
            style={{
              background: "transparent",
              border: `1px solid ${theme.panelBorder}`,
              color: theme.textSubtle,
              fontSize: "0.7rem",
              padding: "0.4rem 0.75rem",
              borderRadius: 6,
              cursor: "pointer",
              marginLeft: "0.5rem",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Custom hex */}
      <div style={{ marginBottom: "2rem" }}>
        <SectionLabel theme={theme}>Custom accent (hex)</SectionLabel>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="color"
            value={theme.accent}
            onChange={(e) => setAccentColor(e.target.value)}
            style={{
              width: 40,
              height: 40,
              border: `1px solid ${theme.panelBorder}`,
              borderRadius: 6,
              background: "transparent",
              cursor: "pointer",
            }}
          />
          <input
            value={theme.accent}
            onChange={(e) => setAccentColor(e.target.value)}
            style={{
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: 6,
              padding: "0.4rem 0.7rem",
              color: theme.text,
              fontSize: "0.82rem",
              width: 120,
              fontFamily: "monospace",
            }}
          />
        </div>
      </div>

      {/* Import / Export */}
      <div style={{ marginBottom: "2rem" }}>
        <SectionLabel theme={theme}>Import / Export</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={onExportBibtex}
            style={{
              background: theme.chip,
              border: `1px solid ${theme.chipBorder}`,
              color: theme.accent,
              borderRadius: 8,
              padding: "0.5rem 0.95rem",
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
          >
            Export BibTeX
          </button>
          <button
            onClick={onExportJson}
            style={{
              background: theme.chip,
              border: `1px solid ${theme.chipBorder}`,
              color: theme.accent,
              borderRadius: 8,
              padding: "0.5rem 0.95rem",
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
          >
            Export JSON backup
          </button>
          <button
            onClick={() => importRef.current?.click()}
            style={{
              background: "transparent",
              border: `1px solid ${theme.panelBorder}`,
              color: theme.textSubtle,
              borderRadius: 8,
              padding: "0.5rem 0.95rem",
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
          >
            Import .bib or .json
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".bib,.json,application/json,text/plain"
            onChange={handleImport}
            style={{ display: "none" }}
          />
        </div>
        {importStatus && (
          <div
            style={{
              fontSize: "0.75rem",
              color: importStatus.startsWith("✓")
                ? "#6a9060"
                : importStatus.startsWith("Error")
                ? "#c47a6e"
                : theme.accent,
              marginTop: "0.6rem",
            }}
          >
            {importStatus}
          </div>
        )}
        <div style={{ fontSize: "0.68rem", color: theme.textMuted, marginTop: "0.5rem" }}>
          BibTeX exports the bibliographic fields. JSON exports the full library including notes and highlights — use it as a backup.
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          marginBottom: "2rem",
          background: theme.panel,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 10,
          padding: "1rem 1.25rem",
        }}
      >
        <SectionLabel theme={theme}>Library Stats</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "1rem",
          }}
        >
          {[
            ["Papers", papers.length],
            ["Read", papers.filter((p) => p.status === "read").length],
            ["Reading", papers.filter((p) => p.status === "reading").length],
            ["To read", papers.filter((p) => p.status === "to-read").length],
            ["Notes", papers.filter((p) => p.notes).length],
            ["Highlights", papers.reduce((s, p) => s + (p.highlights?.length || 0), 0)],
          ].map(([l, v]) => (
            <div key={l}>
              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "1.5rem",
                  color: theme.accent,
                  fontStyle: "italic",
                }}
              >
                {v}
              </div>
              <div style={{ fontSize: "0.7rem", color: theme.textMuted }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          fontSize: "0.7rem",
          color: theme.textMuted,
          textAlign: "center",
          padding: "1rem",
          fontStyle: "italic",
        }}
      >
        Lectus · v0.6 · "Having been read"
      </div>
    </div>
  );
}

function SectionLabel({ children, theme }) {
  return (
    <div
      style={{
        fontSize: "0.7rem",
        color: theme.textMuted,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "0.75rem",
      }}
    >
      {children}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { THEMES } from "../constants/themes";

const ACCENT_SWATCHES = ["#c8a96e","#8b5a2b","#5fb3c4","#8fb572","#c47a6e","#9c7ac4","#c4a35f","#7ac49c"];

export default function SettingsView({
  themeKey, setThemeKey, accentColor, setAccentColor, papers,
  apiKey, apiKeySource, onSaveApiKey, onClearApiKey, onTestApiKey,
  onExportBibtex, onExportJson, onImportFile, onLoadExamples, theme,
}) {
  const importRef = useRef(null);
  const [importStatus, setImportStatus] = useState("");
  const [keyDraft, setKeyDraft] = useState(apiKey || "");
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyStatus, setKeyStatus] = useState("");
  const [keyBusy, setKeyBusy] = useState(false);

  useEffect(() => { setKeyDraft(apiKey || ""); }, [apiKey]);
  const dirty = keyDraft.trim() !== (apiKey || "");

  const handleSaveKey = async () => {
    setKeyBusy(true);
    try { await onSaveApiKey(keyDraft.trim()); setKeyStatus("✓ Saved"); }
    catch (err) { setKeyStatus(`Error: ${err.message}`); }
    finally { setKeyBusy(false); setTimeout(() => setKeyStatus(""), 2500); }
  };
  const handleClearKey = async () => {
    setKeyBusy(true);
    try { await onClearApiKey(); setKeyDraft(""); setKeyStatus("✓ Cleared"); }
    catch (err) { setKeyStatus(`Error: ${err.message}`); }
    finally { setKeyBusy(false); setTimeout(() => setKeyStatus(""), 2500); }
  };
  const handleTestKey = async () => {
    setKeyBusy(true); setKeyStatus("Pinging Anthropic…");
    try { await onTestApiKey(); setKeyStatus("✓ Connected"); }
    catch (err) { setKeyStatus(`Error: ${err.message}`); }
    finally { setKeyBusy(false); setTimeout(() => setKeyStatus(""), 4000); }
  };
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("Reading file…");
    try {
      const result = await onImportFile(file);
      setImportStatus(`✓ Imported ${result.added} paper${result.added === 1 ? "" : "s"} (${result.skipped} duplicates skipped)`);
    } catch (err) { setImportStatus(`Error: ${err.message}`); }
    if (importRef.current) importRef.current.value = "";
    setTimeout(() => setImportStatus(""), 4000);
  };
  const tone = (s) => s.startsWith("✓") ? "#6a9060" : s.startsWith("Error") ? "#c47a6e" : theme.accent;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", maxWidth: 700, margin: "0 auto", width: "100%" }}>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.6rem", fontStyle: "italic", color: theme.textBright, marginBottom: "0.3rem" }}>Settings</div>
      <div style={{ fontSize: "0.78rem", color: theme.textMuted, marginBottom: "2rem" }}>Configure your Anthropic key, customise how Lectus looks, and back up your library</div>

      <div style={{ marginBottom: "2rem", background: theme.panel, border: `1px solid ${theme.panelBorder}`, borderRadius: 10, padding: "1.1rem 1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
          <Label theme={theme} flush>Anthropic API key</Label>
          <KeyPill apiKey={apiKey} source={apiKeySource} theme={theme} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input type={keyVisible ? "text" : "password"} value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)}
            placeholder="sk-ant-…" spellCheck="false" autoCapitalize="off" autoComplete="off"
            style={{ flex: 1, background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: 8, padding: "0.5rem 0.75rem", color: theme.text, fontSize: "0.82rem", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: keyVisible ? "0" : "0.15em" }} />
          <button type="button" onClick={() => setKeyVisible((v) => !v)} style={{ background: "transparent", border: `1px solid ${theme.panelBorder}`, color: theme.textSubtle, borderRadius: 8, padding: "0.5rem 0.7rem", fontSize: "0.78rem", cursor: "pointer" }}>{keyVisible ? "Hide" : "Show"}</button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.65rem", alignItems: "center" }}>
          <button onClick={handleSaveKey} disabled={keyBusy || !dirty || !keyDraft.trim()} style={{ background: !dirty || !keyDraft.trim() ? theme.chip : theme.accent, color: !dirty || !keyDraft.trim() ? theme.textMuted : theme.bg, border: "none", borderRadius: 8, padding: "0.45rem 1rem", fontSize: "0.78rem", cursor: keyBusy || !dirty || !keyDraft.trim() ? "not-allowed" : "pointer", fontWeight: 500 }}>Save key</button>
          <button onClick={handleTestKey} disabled={keyBusy || !keyDraft.trim()} style={{ background: theme.chip, border: `1px solid ${theme.chipBorder}`, color: theme.accent, borderRadius: 8, padding: "0.45rem 1rem", fontSize: "0.78rem", cursor: keyBusy || !keyDraft.trim() ? "not-allowed" : "pointer" }}>Test connection</button>
          <button onClick={handleClearKey} disabled={keyBusy || !apiKey} style={{ background: "transparent", border: `1px solid ${theme.panelBorder}`, color: theme.textSubtle, borderRadius: 8, padding: "0.45rem 1rem", fontSize: "0.78rem", cursor: keyBusy || !apiKey ? "not-allowed" : "pointer" }}>Clear</button>
          {keyStatus && <span style={{ fontSize: "0.75rem", color: tone(keyStatus), marginLeft: "0.25rem" }}>{keyStatus}</span>}
        </div>
        <div style={{ fontSize: "0.68rem", color: theme.textMuted, marginTop: "0.7rem", lineHeight: 1.55 }}>
          Stored locally in your browser's IndexedDB. Get a key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{ color: theme.accent, textDecoration: "underline" }}>console.anthropic.com</a>.
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <Label theme={theme}>Theme</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
          {Object.entries(THEMES).map(([k, t]) => (
            <button key={k} onClick={() => { setThemeKey(k); setAccentColor(null); }} style={{ background: t.panel, border: `2px solid ${themeKey === k ? t.accent : t.panelBorder}`, borderRadius: 10, padding: "1rem", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
              <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.6rem" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: t.bg, border: `1px solid ${t.panelBorder}` }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, background: t.panel, border: `1px solid ${t.panelBorder}` }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, background: t.accent }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, background: t.text, opacity: 0.4 }} />
              </div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "0.95rem", color: t.textBright, fontStyle: "italic" }}>{t.name}</div>
              {themeKey === k && <div style={{ fontSize: "0.65rem", color: t.accent, marginTop: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>✓ Active</div>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <Label theme={theme}>Accent Colour</Label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {ACCENT_SWATCHES.map((c) => (
            <button key={c} onClick={() => setAccentColor(c)} style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: `2px solid ${theme.accent === c ? theme.textBright : "transparent"}`, cursor: "pointer", transition: "all .15s" }} />
          ))}
          <button onClick={() => setAccentColor(null)} style={{ background: "transparent", border: `1px solid ${theme.panelBorder}`, color: theme.textSubtle, fontSize: "0.7rem", padding: "0.4rem 0.75rem", borderRadius: 6, cursor: "pointer", marginLeft: "0.5rem" }}>Reset</button>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <Label theme={theme}>Custom accent (hex)</Label>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input type="color" value={theme.accent} onChange={(e) => setAccentColor(e.target.value)} style={{ width: 40, height: 40, border: `1px solid ${theme.panelBorder}`, borderRadius: 6, background: "transparent", cursor: "pointer" }} />
          <input value={theme.accent} onChange={(e) => setAccentColor(e.target.value)} style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: 6, padding: "0.4rem 0.7rem", color: theme.text, fontSize: "0.82rem", width: 120, fontFamily: "monospace" }} />
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <Label theme={theme}>Import / Export</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <button onClick={onExportBibtex} style={{ background: theme.chip, border: `1px solid ${theme.chipBorder}`, color: theme.accent, borderRadius: 8, padding: "0.5rem 0.95rem", fontSize: "0.78rem", cursor: "pointer" }}>Export BibTeX</button>
          <button onClick={onExportJson} style={{ background: theme.chip, border: `1px solid ${theme.chipBorder}`, color: theme.accent, borderRadius: 8, padding: "0.5rem 0.95rem", fontSize: "0.78rem", cursor: "pointer" }}>Export JSON backup</button>
          <button onClick={() => importRef.current?.click()} style={{ background: "transparent", border: `1px solid ${theme.panelBorder}`, color: theme.textSubtle, borderRadius: 8, padding: "0.5rem 0.95rem", fontSize: "0.78rem", cursor: "pointer" }}>Import .bib or .json</button>
          {onLoadExamples && (
            <button
              onClick={() => {
                const added = onLoadExamples();
                setImportStatus(`✓ Loaded ${added} example paper${added === 1 ? "" : "s"}`);
                setTimeout(() => setImportStatus(""), 3000);
              }}
              style={{ background: "transparent", border: `1px solid ${theme.panelBorder}`, color: theme.textSubtle, borderRadius: 8, padding: "0.5rem 0.95rem", fontSize: "0.78rem", cursor: "pointer" }}
            >
              Load example library
            </button>
          )}
          <input ref={importRef} type="file" accept=".bib,.json,application/json,text/plain" onChange={handleImport} style={{ display: "none" }} />
        </div>
        {importStatus && <div style={{ fontSize: "0.75rem", color: tone(importStatus), marginTop: "0.6rem" }}>{importStatus}</div>}
      </div>

      <div style={{ marginBottom: "2rem", background: theme.panel, border: `1px solid ${theme.panelBorder}`, borderRadius: 10, padding: "1rem 1.25rem" }}>
        <Label theme={theme}>Library Stats</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem" }}>
          {[["Papers", papers.length],["Read", papers.filter((p) => p.status === "read").length],["Reading", papers.filter((p) => p.status === "reading").length],["To read", papers.filter((p) => p.status === "to-read").length],["Notes", papers.filter((p) => p.notes).length],["Highlights", papers.reduce((s, p) => s + (p.highlights?.length || 0), 0)]].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.5rem", color: theme.accent, fontStyle: "italic" }}>{v}</div>
              <div style={{ fontSize: "0.7rem", color: theme.textMuted }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: "0.7rem", color: theme.textMuted, textAlign: "center", padding: "1rem", fontStyle: "italic" }}>Lectus · v0.7 · "Having been read"</div>
    </div>
  );
}

function Label({ children, theme, flush }) {
  return <div style={{ fontSize: "0.7rem", color: theme.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: flush ? 0 : "0.75rem" }}>{children}</div>;
}

function KeyPill({ apiKey, source, theme }) {
  const set = Boolean(apiKey);
  const colour = set ? "#6a9060" : theme.textMuted;
  const label = !set ? "Not set" : source === "env" ? "Set (from .env)" : "Set";
  return <span style={{ fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: colour, background: set ? "#1a2418" : theme.chip, border: `1px solid ${set ? "#6a906055" : theme.chipBorder}`, borderRadius: 4, padding: "0.2rem 0.55rem" }}>{label}</span>;
}

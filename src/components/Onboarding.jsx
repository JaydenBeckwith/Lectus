import { useState } from "react";

export default function Onboarding({ onSave, onSkip, theme }) {
  const [draft, setDraft] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const submit = async (e) => {
    e?.preventDefault();
    const k = draft.trim();
    if (!k) return;
    setBusy(true);
    setStatus("");
    try {
      await onSave(k);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1.5rem",
      }}
    >
      <form
        onSubmit={submit}
        className="fade-in"
        style={{
          background: theme.panel,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 12,
          padding: "1.6rem 1.7rem 1.4rem",
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "1.5rem",
            fontStyle: "italic",
            color: theme.textBright,
            marginBottom: "0.4rem",
          }}
        >
          Welcome to Lectus
        </div>
        <div
          style={{
            fontSize: "0.82rem",
            color: theme.text,
            lineHeight: 1.6,
            marginBottom: "1.1rem",
          }}
        >
          Paste your Anthropic API key to enable Ask, Review and PDF extraction. The
          library, graph, timeline and compare views all work without one — you can add
          a key later in <strong style={{ color: theme.textBright }}>Settings</strong>.
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <input
            type={visible ? "text" : "password"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="sk-ant-…"
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
            autoFocus
            style={{
              flex: 1,
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: 8,
              padding: "0.55rem 0.8rem",
              color: theme.text,
              fontSize: "0.85rem",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              letterSpacing: visible ? "0" : "0.15em",
            }}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            style={{
              background: "transparent",
              border: `1px solid ${theme.panelBorder}`,
              color: theme.textSubtle,
              borderRadius: 8,
              padding: "0.5rem 0.7rem",
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>

        {status && (
          <div
            style={{
              fontSize: "0.75rem",
              color: status.startsWith("Error") ? "#c47a6e" : theme.accent,
              marginBottom: "0.6rem",
            }}
          >
            {status}
          </div>
        )}

        <div
          style={{
            fontSize: "0.7rem",
            color: theme.textMuted,
            marginBottom: "1rem",
            lineHeight: 1.55,
          }}
        >
          Stored locally in your browser's IndexedDB — never sent anywhere except
          Anthropic. Get a key at{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: theme.accent, textDecoration: "underline" }}
          >
            console.anthropic.com
          </a>
          .
        </div>

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onSkip}
            disabled={busy}
            style={{
              background: "transparent",
              border: `1px solid ${theme.panelBorder}`,
              color: theme.textSubtle,
              borderRadius: 8,
              padding: "0.5rem 1rem",
              fontSize: "0.8rem",
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            style={{
              background: draft.trim() && !busy ? theme.accent : theme.chip,
              color: draft.trim() && !busy ? theme.bg : theme.textMuted,
              border: "none",
              borderRadius: 8,
              padding: "0.5rem 1.1rem",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: busy || !draft.trim() ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Saving…" : "Save key"}
          </button>
        </div>
      </form>
    </div>
  );
}

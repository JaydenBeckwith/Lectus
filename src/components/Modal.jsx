import { useEffect, useRef, useState } from "react";

// ── Reusable modal primitives ────────────────────────────────────────────────
// Replaces window.prompt / window.confirm — both are blocked in modern
// Electron, and they look out of place against the app's theme. These are
// themed, focus-trapped, and respond to Esc (cancel) + Enter (confirm).

const Backdrop = ({ children, onClose, theme }) => {
  // Close on Esc, but ignore key repeats from inputs higher in the tree.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn .12s ease",
      }}
    >
      <div
        style={{
          background: theme.panel,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 12,
          padding: "1.25rem 1.4rem",
          width: 420,
          maxWidth: "calc(100vw - 2rem)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export function PromptModal({
  open,
  title,
  message,
  defaultValue = "",
  placeholder = "",
  confirmLabel = "Save",
  onSubmit,
  onCancel,
  theme,
}) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);
  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      // setTimeout so the focus lands AFTER React mounts the input.
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, defaultValue]);
  if (!open) return null;
  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };
  return (
    <Backdrop onClose={onCancel} theme={theme}>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: "1.15rem",
          color: theme.textBright,
          marginBottom: message ? "0.4rem" : "0.85rem",
        }}
      >
        {title}
      </div>
      {message && (
        <div style={{ fontSize: "0.78rem", color: theme.textSubtle, lineHeight: 1.55, marginBottom: "0.85rem" }}>
          {message}
        </div>
      )}
      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          else if (e.key === "Escape") onCancel();
        }}
        style={{
          width: "100%",
          background: theme.inputBg,
          border: `1px solid ${theme.inputBorder}`,
          borderRadius: 8,
          padding: "0.55rem 0.75rem",
          color: theme.text,
          fontSize: "0.85rem",
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
        <button
          onClick={onCancel}
          style={{
            background: "transparent",
            border: `1px solid ${theme.panelBorder}`,
            color: theme.textSubtle,
            borderRadius: 8,
            padding: "0.4rem 0.95rem",
            fontSize: "0.78rem",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!value.trim()}
          style={{
            background: value.trim() ? theme.accent : theme.chip,
            color: value.trim() ? theme.bg : theme.textMuted,
            border: "none",
            borderRadius: 8,
            padding: "0.4rem 0.95rem",
            fontSize: "0.78rem",
            fontWeight: 500,
            cursor: value.trim() ? "pointer" : "not-allowed",
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Backdrop>
  );
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
  theme,
}) {
  const buttonRef = useRef(null);
  useEffect(() => {
    if (open) setTimeout(() => buttonRef.current?.focus(), 0);
  }, [open]);
  if (!open) return null;
  const accent = danger ? "#c47a6e" : theme.accent;
  return (
    <Backdrop onClose={onCancel} theme={theme}>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: "1.15rem",
          color: theme.textBright,
          marginBottom: "0.5rem",
        }}
      >
        {title}
      </div>
      {message && (
        <div style={{ fontSize: "0.82rem", color: theme.text, lineHeight: 1.6, marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
          {message}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <button
          onClick={onCancel}
          style={{
            background: "transparent",
            border: `1px solid ${theme.panelBorder}`,
            color: theme.textSubtle,
            borderRadius: 8,
            padding: "0.4rem 0.95rem",
            fontSize: "0.78rem",
            cursor: "pointer",
          }}
        >
          {cancelLabel}
        </button>
        <button
          ref={buttonRef}
          onClick={onConfirm}
          style={{
            background: danger ? "transparent" : accent,
            border: danger ? `1px solid ${accent}` : "none",
            color: danger ? accent : theme.bg,
            borderRadius: 8,
            padding: "0.4rem 0.95rem",
            fontSize: "0.78rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Backdrop>
  );
}

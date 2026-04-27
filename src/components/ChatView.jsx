import { useEffect, useRef } from "react";
import { fmt } from "../utils/format";

const SUGGESTED_PROMPTS = [
  "Which papers discuss LAG3 and melanoma response?",
  "Compare the neoadjuvant studies in my library",
  "What are the key gaps across my papers?",
  "Summarise what I've highlighted and noted",
];

// Chat panel for asking questions about the library.
export default function ChatView({
  papers,
  messages,
  loading,
  chatInput,
  setChatInput,
  onSend,
  theme,
}) {
  const messagesEnd = useRef(null);

  // Auto-scroll to the bottom when messages change.
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: "2rem" }}>
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "1.4rem",
                fontStyle: "italic",
                color: theme.textBright,
                marginBottom: "0.4rem",
              }}
            >
              Ask your library
            </div>
            <div style={{ fontSize: "0.8rem", color: theme.textMuted, marginBottom: "2rem" }}>
              {papers.length} papers loaded · {papers.filter((p) => p.notes).length} with notes
            </div>
            {SUGGESTED_PROMPTS.map((q, i) => (
              <button
                key={i}
                onClick={() => onSend(q)}
                style={{
                  display: "block",
                  margin: "0.4rem auto",
                  background: theme.panel,
                  border: `1px solid ${theme.panelBorder}`,
                  color: theme.textSubtle,
                  borderRadius: 20,
                  padding: "0.4rem 1rem",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className="fade-in"
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "84%",
                background: m.role === "user" ? theme.chip : theme.panel,
                border: `1px solid ${m.role === "user" ? theme.chipBorder : theme.panelBorder}`,
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding: "0.8rem 1rem",
                fontSize: "0.83rem",
                lineHeight: 1.65,
                color: theme.text,
              }}
            >
              {m.role === "assistant" ? (
                <div dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="fade-in" style={{ display: "flex" }}>
            <div
              style={{
                background: theme.panel,
                border: `1px solid ${theme.panelBorder}`,
                borderRadius: "16px 16px 16px 4px",
                padding: "0.8rem 1rem",
              }}
              className="typing"
            >
              <span style={{ background: theme.accent }} />
              <span style={{ background: theme.accent }} />
              <span style={{ background: theme.accent }} />
            </div>
          </div>
        )}

        <div ref={messagesEnd} />
      </div>

      <div
        style={{
          padding: "0.75rem 1.25rem",
          borderTop: `1px solid ${theme.panelBorder}`,
          display: "flex",
          gap: "0.5rem",
          alignItems: "flex-end",
        }}
      >
        <textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask about your papers..."
          rows={2}
          style={{
            flex: 1,
            background: theme.inputBg,
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: 10,
            padding: "0.65rem 0.85rem",
            color: theme.text,
            fontSize: "0.82rem",
            resize: "none",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={() => onSend()}
          disabled={loading}
          style={{
            background: theme.chip,
            border: `1px solid ${theme.chipBorder}`,
            color: theme.accent,
            borderRadius: 10,
            padding: "0.65rem 0.9rem",
            cursor: "pointer",
            fontSize: "0.9rem",
            flexShrink: 0,
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}

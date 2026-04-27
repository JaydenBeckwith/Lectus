import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Themed react-markdown wrapper. Centralises the renderer overrides so both
// the chat view and any future markdown surfaces (e.g. note rendering) get
// consistent styling out of the same theme tokens.
export default function Markdown({ children, theme }) {
  return (
    <div style={{ color: theme.text, fontSize: "0.83rem", lineHeight: 1.65 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "1.2rem",
                fontStyle: "italic",
                color: theme.textBright,
                margin: "0.6rem 0 0.4rem",
              }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "1.05rem",
                fontStyle: "italic",
                color: theme.textBright,
                margin: "0.55rem 0 0.35rem",
              }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              style={{
                fontSize: "0.9rem",
                color: theme.textBright,
                fontWeight: 500,
                margin: "0.5rem 0 0.3rem",
              }}
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p style={{ margin: "0.4rem 0", lineHeight: 1.65 }} {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              style={{ color: theme.accent, textDecoration: "underline" }}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          ul: ({ node, ordered, ...props }) => (
            <ul style={{ margin: "0.3rem 0", paddingLeft: "1.1rem" }} {...props} />
          ),
          ol: ({ node, ordered, ...props }) => (
            <ol style={{ margin: "0.3rem 0", paddingLeft: "1.3rem" }} {...props} />
          ),
          li: ({ node, ordered, ...props }) => (
            <li style={{ margin: "0.15rem 0", lineHeight: 1.55 }} {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong style={{ color: theme.textBright, fontWeight: 600 }} {...props} />
          ),
          em: ({ node, ...props }) => <em style={{ color: theme.text }} {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                borderLeft: `2px solid ${theme.accent}`,
                paddingLeft: "0.7rem",
                color: theme.textSubtle,
                fontStyle: "italic",
                margin: "0.5rem 0",
              }}
              {...props}
            />
          ),
          code: ({ node, inline, className, children, ...props }) =>
            inline ? (
              <code
                style={{
                  background: theme.chip,
                  border: `1px solid ${theme.chipBorder}`,
                  borderRadius: 4,
                  padding: "0.05rem 0.3rem",
                  fontSize: "0.78rem",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre
                style={{
                  background: theme.chip,
                  border: `1px solid ${theme.chipBorder}`,
                  borderRadius: 6,
                  padding: "0.6rem 0.75rem",
                  margin: "0.5rem 0",
                  overflowX: "auto",
                  fontSize: "0.78rem",
                  lineHeight: 1.55,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                <code {...props}>{children}</code>
              </pre>
            ),
          table: ({ node, ...props }) => (
            <div style={{ overflowX: "auto", margin: "0.5rem 0" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  fontSize: "0.78rem",
                  width: "100%",
                }}
                {...props}
              />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              style={{
                textAlign: "left",
                padding: "0.4rem 0.6rem",
                borderBottom: `1px solid ${theme.panelBorder}`,
                color: theme.textBright,
                fontWeight: 500,
              }}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              style={{
                padding: "0.35rem 0.6rem",
                borderBottom: `1px solid ${theme.panelBorder}`,
              }}
              {...props}
            />
          ),
          hr: () => (
            <hr style={{ border: "none", borderTop: `1px solid ${theme.panelBorder}`, margin: "0.7rem 0" }} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

import { useState } from "react";
import { tagColor } from "../constants/tagColors";

// Editable list of tags. Click × on a chip to remove; type and Enter (or comma)
// to add. De-dupes case-insensitively. Backspace on empty input pops the last.
export default function TagEditor({ tags = [], onChange, theme }) {
  const [draft, setDraft] = useState("");

  const add = (raw) => {
    const t = raw.trim();
    if (!t) return;
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, t]);
    setDraft("");
  };

  const remove = (i) => onChange(tags.filter((_, idx) => idx !== i));

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      remove(tags.length - 1);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.4rem",
        alignItems: "center",
        background: theme.inputBg,
        border: `1px solid ${theme.inputBorder}`,
        borderRadius: 8,
        padding: "0.45rem 0.5rem",
      }}
    >
      {tags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          style={{
            background: tagColor(t) + "33",
            color: tagColor(t) + "ee",
            border: `1px solid ${tagColor(t)}44`,
            borderRadius: 12,
            padding: "0.18rem 0.55rem",
            fontSize: "0.7rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          {t}
          <button
            onClick={() => remove(i)}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: "0.7rem",
              padding: 0,
              lineHeight: 1,
              opacity: 0.7,
            }}
            aria-label={`Remove tag ${t}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        placeholder={tags.length ? "" : "Add a tag…"}
        style={{
          flex: 1,
          minWidth: 100,
          background: "transparent",
          border: "none",
          color: theme.text,
          fontSize: "0.78rem",
          padding: "0.1rem 0.2rem",
        }}
      />
    </div>
  );
}

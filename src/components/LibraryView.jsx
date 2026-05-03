import { useEffect, useRef, useState } from "react";
import { tagColor } from "../constants/tagColors";

const STATUS_OPTIONS = [
  ["all", "All"],
  ["to-read", "To read"],
  ["reading", "Reading"],
  ["read", "Read"],
];

export default function LibraryView({
  papers, filtered, search, setSearch,
  activeTag, setActiveTag, statusFilter, setStatusFilter,
  allTags, statusColors, onSelectPaper,
  projects = [], activeProjectId = null, setActiveProjectId,
  onCreateProject, onRenameProject, onDeleteProject,
  onExportBibtex, onExportJson, onImportFile, onLoadExamples,
  theme,
}) {
  const importRef = useRef(null);
  const exportRef = useRef(null);
  const [ioStatus, setIoStatus] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportOpen]);

  const handleImportClick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onImportFile) return;
    setIoStatus("Reading file…");
    try {
      const result = await onImportFile(file);
      setIoStatus("✓ Imported " + result.added + " paper" + (result.added === 1 ? "" : "s") + " (" + result.skipped + " duplicates skipped)");
    } catch (err) { setIoStatus("Error: " + err.message); }
    if (importRef.current) importRef.current.value = "";
    setTimeout(() => setIoStatus(""), 4000);
  };
  const handleLoadExamples = () => {
    if (!onLoadExamples) return;
    const added = onLoadExamples();
    setIoStatus("✓ Loaded " + added + " example paper" + (added === 1 ? "" : "s"));
    setTimeout(() => setIoStatus(""), 3000);
  };

  const handleNewProject = () => {
    if (!onCreateProject) return;
    const name = window.prompt("New project name:");
    if (name && name.trim()) onCreateProject(name.trim());
  };
  const handleDeleteProject = (id, name) => {
    if (!onDeleteProject) return;
    if (window.confirm("Delete project \"" + name + "\"?\n\nThe project is removed and all papers stay in your library — they're just unlinked from this project.")) {
      onDeleteProject(id);
    }
  };
  const handleRenameProject = (id, currentName) => {
    if (!onRenameProject) return;
    const next = window.prompt("Rename project:", currentName);
    if (next && next.trim() && next.trim() !== currentName) onRenameProject(id, next.trim());
  };

  const ioTone = ioStatus.startsWith("✓") ? "#6a9060" : ioStatus.startsWith("Error") ? "#c47a6e" : theme.accent;
  const hasExport = onExportBibtex || onExportJson;
  const hasIO = hasExport || onImportFile || onLoadExamples;

  const sidebarBtn = (active) => ({
    display: "block", width: "100%", textAlign: "left", padding: "0.3rem 1rem",
    background: active ? theme.chip : "none", border: "none",
    color: active ? theme.accent : theme.textSubtle, fontSize: "0.75rem", cursor: "pointer",
  });
  const sectionLabel = { padding: "0 1rem", fontSize: "0.62rem", color: theme.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" };
  const ioBtnFilled = (enabled) => ({
    background: theme.chip, border: "1px solid " + theme.chipBorder,
    color: enabled ? theme.accent : theme.textMuted,
    borderRadius: 8, padding: "0.42rem 0.7rem", fontSize: "0.72rem",
    cursor: enabled ? "pointer" : "not-allowed",
    display: "inline-flex", alignItems: "center", gap: "0.3rem",
  });
  const ioBtnGhost = {
    background: "transparent", border: "1px solid " + theme.panelBorder,
    color: theme.textSubtle, borderRadius: 8,
    padding: "0.42rem 0.7rem", fontSize: "0.72rem", cursor: "pointer",
  };
  const menuItemStyle = {
    background: "transparent", border: "none", color: theme.text,
    padding: "0.55rem 0.85rem", fontSize: "0.78rem",
    cursor: "pointer", textAlign: "left", width: "100%",
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem",
  };

  // Count papers per project (project.id -> count)
  const projectCounts = {};
  for (const p of papers) for (const id of (p.projects || [])) projectCounts[id] = (projectCounts[id] || 0) + 1;

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
      <div style={{ width: 220, borderRight: "1px solid " + theme.panelBorder, padding: "1rem 0", overflowY: "auto", flexShrink: 0 }}>
        {/* ── Projects ─────────────────────────────────────────────── */}
        <div style={sectionLabel}>
          <span>Projects</span>
          {onCreateProject && (
            <button onClick={handleNewProject} title="New project" style={{ background: "transparent", border: "none", color: theme.accent, cursor: "pointer", fontSize: "0.85rem", padding: "0 0.4rem", lineHeight: 1 }}>+</button>
          )}
        </div>
        <button onClick={() => setActiveProjectId && setActiveProjectId(null)} style={sidebarBtn(!activeProjectId)}>
          All papers ({papers.length})
        </button>
        {projects.length === 0 ? (
          <div style={{ padding: "0.2rem 1rem 0.5rem", fontSize: "0.65rem", color: theme.textMuted, fontStyle: "italic", lineHeight: 1.5 }}>
            Create a project to group papers together — they can belong to several projects at once.
          </div>
        ) : (
          projects.map((proj) => (
            <ProjectRow
              key={proj.id}
              project={proj}
              count={projectCounts[proj.id] || 0}
              active={activeProjectId === proj.id}
              theme={theme}
              onSelect={() => setActiveProjectId && setActiveProjectId(proj.id)}
              onRename={() => handleRenameProject(proj.id, proj.name)}
              onDelete={() => handleDeleteProject(proj.id, proj.name)}
            />
          ))
        )}

        {/* ── Status ──────────────────────────────────────────────── */}
        <div style={{ ...sectionLabel, marginTop: "1.1rem" }}><span>Status</span></div>
        {STATUS_OPTIONS.map(([s, l]) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={sidebarBtn(statusFilter === s)}>
            {l} ({s === "all" ? papers.length : papers.filter((p) => p.status === s).length})
          </button>
        ))}

        {/* ── Tags ────────────────────────────────────────────────── */}
        <div style={{ ...sectionLabel, marginTop: "1.1rem" }}><span>Tags</span></div>
        <button onClick={() => setActiveTag(null)} style={sidebarBtn(!activeTag)}>All ({papers.length})</button>
        {allTags.map((t) => (
          <button key={t} onClick={() => setActiveTag(t === activeTag ? null : t)} style={{ ...sidebarBtn(activeTag === t), fontSize: "0.72rem" }}>
            {t} ({papers.filter((p) => p.tags.includes(t)).length})
          </button>
        ))}
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid " + theme.panelBorder, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles, authors, tags, abstracts..."
              style={{ flex: 1, minWidth: 220, background: theme.inputBg, border: "1px solid " + theme.inputBorder, borderRadius: 8, padding: "0.5rem 0.75rem", color: theme.text, fontSize: "0.82rem" }}
            />
            {hasIO && (
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {hasExport && (
                  <div ref={exportRef} style={{ position: "relative" }}>
                    <button onClick={() => papers.length && setExportOpen((v) => !v)} disabled={!papers.length} title={papers.length ? "Export your library" : "Add papers first"} style={ioBtnFilled(papers.length > 0)}>
                      Export <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>▾</span>
                    </button>
                    {exportOpen && papers.length > 0 && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: theme.panel, border: "1px solid " + theme.panelBorder, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.35)", minWidth: 200, zIndex: 100, overflow: "hidden" }}>
                        {onExportBibtex && (
                          <button onClick={() => { onExportBibtex(); setExportOpen(false); }} onMouseEnter={(e) => { e.currentTarget.style.background = theme.panelHover; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} style={menuItemStyle}>
                            <span>BibTeX</span>
                            <span style={{ fontSize: "0.65rem", color: theme.textMuted, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>.bib</span>
                          </button>
                        )}
                        {onExportJson && (
                          <button onClick={() => { onExportJson(); setExportOpen(false); }} onMouseEnter={(e) => { e.currentTarget.style.background = theme.panelHover; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} style={{ ...menuItemStyle, borderTop: "1px solid " + theme.panelBorder }}>
                            <span>JSON backup<div style={{ fontSize: "0.6rem", color: theme.textMuted, marginTop: 2 }}>includes notes & highlights</div></span>
                            <span style={{ fontSize: "0.65rem", color: theme.textMuted, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>.json</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {onImportFile && (
                  <>
                    <button onClick={() => importRef.current?.click()} title="Import a .bib or .json file" style={ioBtnGhost}>Import</button>
                    <input ref={importRef} type="file" accept=".bib,.json,application/json,text/plain" onChange={handleImportClick} style={{ display: "none" }} />
                  </>
                )}
                {onLoadExamples && papers.length === 0 && (
                  <button onClick={handleLoadExamples} title="Load 6 sample papers to explore the app" style={ioBtnGhost}>Load examples</button>
                )}
              </div>
            )}
          </div>
          {ioStatus && <div style={{ fontSize: "0.72rem", color: ioTone }}>{ioStatus}</div>}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.length === 0 && (
            <div style={{ color: theme.textMuted, textAlign: "center", paddingTop: "3rem", fontSize: "0.85rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              {papers.length === 0 ? (
                <>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.2rem", fontStyle: "italic", color: theme.textBright }}>Your library is empty</div>
                  <div style={{ maxWidth: 360, lineHeight: 1.6 }}>
                    Add a paper from the <strong style={{ color: theme.accent }}>+ Add</strong> tab — paste a DOI for a free CrossRef lookup, or drop a PDF for AI extraction. You can also click <strong style={{ color: theme.accent }}>Load examples</strong> above for a sample library.
                  </div>
                </>
              ) : (
                "No papers match your filters."
              )}
            </div>
          )}
          {filtered.map((p) => {
            const sc = statusColors[p.status];
            return (
              <div
                key={p.id}
                className="fade-in"
                onClick={() => onSelectPaper(p)}
                onMouseEnter={(e) => { e.currentTarget.style.background = theme.panelHover; e.currentTarget.style.borderColor = theme.accent + "55"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = theme.panel; e.currentTarget.style.borderColor = theme.panelBorder; }}
                style={{ background: theme.panel, border: "1px solid " + theme.panelBorder, borderRadius: 10, padding: "0.9rem 1rem", cursor: "pointer", transition: "all .2s" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "0.95rem", color: theme.textBright, lineHeight: 1.4, marginBottom: "0.3rem" }}>{p.title}</div>
                    <div style={{ fontSize: "0.72rem", color: theme.textMuted, marginBottom: "0.5rem" }}>{p.authors} · {p.journal} · {p.year}</div>
                  </div>
                  <span style={{ background: sc.bg, color: sc.color, fontSize: "0.62rem", padding: "0.15rem 0.5rem", borderRadius: 4, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{sc.label}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", alignItems: "center" }}>
                  {p.tags.map((t) => (
                    <span key={t} style={{ background: tagColor(t) + "33", color: tagColor(t) + "ee", border: "1px solid " + tagColor(t) + "44", borderRadius: 12, padding: "0.15rem 0.55rem", fontSize: "0.65rem" }}>{t}</span>
                  ))}
                  {p.notes && <span style={{ fontSize: "0.65rem", color: theme.accent, marginLeft: "0.3rem" }}>✎ Notes</span>}
                  {p.highlights?.length > 0 && <span style={{ fontSize: "0.65rem", color: theme.accent }}>◆ {p.highlights.length}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Project sidebar row with hover-revealed rename / delete actions.
function ProjectRow({ project, count, active, theme, onSelect, onRename, onDelete }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", display: "flex", alignItems: "center" }}
    >
      <button
        onClick={onSelect}
        style={{
          display: "block", flex: 1, textAlign: "left",
          padding: "0.3rem 1rem",
          background: active ? theme.chip : "none",
          border: "none",
          color: active ? theme.accent : theme.textSubtle,
          fontSize: "0.74rem",
          cursor: "pointer",
          paddingRight: hover ? "3rem" : "1rem",
          transition: "padding-right .1s",
        }}
      >
        ▸ {project.name} ({count})
      </button>
      {hover && (
        <div style={{ position: "absolute", right: 6, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: "0.15rem" }}>
          <button
            onClick={onRename}
            title="Rename"
            style={{ background: "transparent", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: "0.65rem", padding: "0.15rem 0.3rem", lineHeight: 1 }}
          >✎</button>
          <button
            onClick={onDelete}
            title="Delete project"
            style={{ background: "transparent", border: "none", color: "#c47a6e", cursor: "pointer", fontSize: "0.7rem", padding: "0.15rem 0.3rem", lineHeight: 1 }}
          >×</button>
        </div>
      )}
    </div>
  );
}

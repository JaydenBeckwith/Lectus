import { useEffect, useMemo, useRef, useState } from "react";

import { THEMES } from "./constants/themes";
import { SEED_PAPERS } from "./constants/seedPapers";
import {
  askLibraryStream,
  extractPaperFromPdf,
  generateReviewParagraph,
  generateStructuredReview,
  setRuntimeApiKey,
  suggestTags,
  testConnection,
} from "./api/anthropic";
import { lookupDoi } from "./api/crossref";
import { loadPapers, savePapers, loadPrefs, savePrefs } from "./storage/persistence";
import { getApiKey, setApiKey, clearApiKey } from "./storage/secrets";
import { isElectron, saveLibraryToFile, loadLibraryFromFile } from "./storage/electronFile";
import useDebouncedEffect from "./hooks/useDebouncedEffect";
import { papersToBibtex, parseBibtex } from "./utils/bibtex";

import TopBar from "./components/TopBar";
import LibraryView from "./components/LibraryView";
import GraphView from "./components/GraphView";
import TimelineView from "./components/TimelineView";
import CompareView from "./components/CompareView";
import PaperDetail from "./components/PaperDetail";
import ChatView from "./components/ChatView";
import ReviewView from "./components/ReviewView";
import AddView from "./components/AddView";
import SettingsView from "./components/SettingsView";
import Onboarding from "./components/Onboarding";

const ENV_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

const readAsBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result.split(",")[1]);
  r.onerror = () => reject(new Error("Read failed"));
  r.readAsDataURL(file);
});
const readAsText = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(new Error("Read failed"));
  r.readAsText(file);
});
const downloadString = (filename, content, mime = "text/plain;charset=utf-8") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};
const todayStamp = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [themeKey, setThemeKey] = useState("midnight");
  const [accentColor, setAccentColor] = useState(null);
  const baseTheme = THEMES[themeKey];
  const theme = accentColor ? { ...baseTheme, accent: accentColor } : baseTheme;

  // Start empty. Users add papers via DOI / PDF / import / "Load example
  // library" in Settings. Hydration below replaces this with whatever was
  // last saved to IndexedDB (or the on-disk JSON backup in Electron).
  const [papers, setPapers] = useState([]);
  const [view, setView] = useState("library");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(false);

  const [apiKey, setApiKeyState] = useState("");
  const [apiKeySource, setApiKeySource] = useState("none");

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingSeen, setOnboardingSeen] = useState(false);

  const [saveState, setSaveState] = useState("idle");
  const savedTimerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState("");

  const [reviewSelection, setReviewSelection] = useState([]);
  const [reviewMode, setReviewMode] = useState("paragraph");
  const [reviewOutput, setReviewOutput] = useState("");
  const [reviewStructured, setReviewStructured] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewTopic, setReviewTopic] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedPapers, storedPrefs, storedKey] = await Promise.all([loadPapers(), loadPrefs(), getApiKey()]);
      if (cancelled) return;
      skipNextSave.current = true;
      let papersToUse = storedPapers;
      if (!papersToUse && isElectron()) {
        const fromFile = await loadLibraryFromFile();
        if (fromFile?.length) papersToUse = fromFile;
      }
      if (papersToUse) setPapers(papersToUse);
      if (storedPrefs) {
        if (storedPrefs.themeKey && THEMES[storedPrefs.themeKey]) setThemeKey(storedPrefs.themeKey);
        if (storedPrefs.accentColor !== undefined) setAccentColor(storedPrefs.accentColor);
        if (storedPrefs.onboardingSeen) setOnboardingSeen(true);
      }
      if (storedKey) {
        setRuntimeApiKey(storedKey);
        setApiKeyState(storedKey);
        setApiKeySource("runtime");
      } else if (ENV_KEY) {
        setApiKeyState(ENV_KEY); setApiKeySource("env");
      } else {
        setApiKeyState(""); setApiKeySource("none");
      }
      if (!storedPrefs?.onboardingSeen) setShowOnboarding(true);
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const flashSaved = () => {
    setSaveState("saved");
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveState("idle"), 1400);
  };

  useDebouncedEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    setSaveState("saving");
    (async () => {
      try { await savePapers(papers); if (isElectron()) await saveLibraryToFile(papers); flashSaved(); }
      catch { setSaveState("error"); }
    })();
  }, [papers, hydrated], 400);

  useDebouncedEffect(() => {
    if (!hydrated) return;
    savePrefs({ themeKey, accentColor, onboardingSeen });
  }, [themeKey, accentColor, onboardingSeen, hydrated], 250);

  const openOnboarding = () => setShowOnboarding(true);
  const dismissOnboarding = () => { setShowOnboarding(false); setOnboardingSeen(true); };
  const handleOnboardingSave = async (k) => {
    await setApiKey(k); setRuntimeApiKey(k);
    setApiKeyState(k); setApiKeySource("runtime");
    dismissOnboarding();
  };
  const handleSaveApiKey = async (k) => {
    if (!k) return;
    await setApiKey(k); setRuntimeApiKey(k);
    setApiKeyState(k); setApiKeySource("runtime");
  };
  const handleClearApiKey = async () => {
    await clearApiKey();
    if (ENV_KEY) { setRuntimeApiKey(null); setApiKeyState(ENV_KEY); setApiKeySource("env"); }
    else { setRuntimeApiKey(null); setApiKeyState(""); setApiKeySource("none"); }
  };

  const allTags = useMemo(() => [...new Set(papers.flatMap((p) => p.tags))].sort(), [papers]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return papers.filter((p) => {
      const ms = !q || p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) || p.abstract.toLowerCase().includes(q);
      const mt = !activeTag || p.tags.includes(activeTag);
      const mst = statusFilter === "all" || p.status === statusFilter;
      return ms && mt && mst;
    });
  }, [papers, search, activeTag, statusFilter]);
  const statusColors = useMemo(() => ({
    "to-read": { bg: theme.chip, color: theme.textSubtle, label: "To read" },
    reading: { bg: theme.accent + "22", color: theme.accent, label: "Reading" },
    read: { bg: "#1a2418", color: "#6a9060", label: "Read" },
  }), [theme]);

  const updatePaper = (id, updates) => {
    setPapers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (selected?.id === id) setSelected((prev) => ({ ...prev, ...updates }));
  };
  const openPaper = (p) => { setSelected(p); setView("paper"); };

  // Remove a paper from the library. PaperDetail confirms before calling
  // this, so we just do the work and bounce back to the library list.
  const deletePaper = (id) => {
    setPapers((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) setSelected(null);
    setReviewSelection((prev) => prev.filter((x) => x !== id));
    setView("library");
  };

  // Settings "Load example library" — appends the seed set with dedupe.
  const loadExamples = () => {
    const { next, added } = mergePapers(papers, SEED_PAPERS);
    setPapers(next);
    return added;
  };

  const sendChat = async (override) => {
    const msg = override || chatInput;
    if (!msg.trim()) return;
    const newMsgs = [...messages, { role: "user", content: msg }];
    setMessages([...newMsgs, { role: "assistant", content: "", streaming: true }]);
    setChatInput(""); setLoading(true);
    const replaceLast = (updater) => setMessages((prev) => {
      const out = prev.slice(0, -1);
      out.push(updater(prev[prev.length - 1]));
      return out;
    });
    try {
      await askLibraryStream(papers, newMsgs, (partial) => replaceLast((m) => ({ ...m, content: partial })));
      replaceLast((m) => ({ ...m, streaming: false }));
    } catch (err) {
      replaceLast(() => ({ role: "assistant", content: `Connection error: ${err.message}`, streaming: false }));
    } finally { setLoading(false); }
  };
  const askAIAboutPaper = (prompt) => { setView("chat"); sendChat(prompt); };

  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setPdfStatus("Please upload a PDF file"); return; }
    setPdfLoading(true); setPdfStatus("Reading PDF...");
    try {
      const base64 = await readAsBase64(file);
      setPdfStatus("AI extracting metadata...");
      const parsed = await extractPaperFromPdf(base64);
      const newPaper = { id: `p${Date.now()}`, ...parsed, notes: "", highlights: [], status: "to-read" };
      setPapers((prev) => [newPaper, ...prev]);
      setPdfStatus(`✓ Added "${parsed.title.slice(0, 40)}..."`);
      setTimeout(() => { setPdfStatus(""); setPdfLoading(false); }, 2000);
    } catch (err) {
      setPdfStatus(`Error processing PDF: ${err.message}`);
      setPdfLoading(false);
      setTimeout(() => setPdfStatus(""), 3000);
    }
  };

  const handleDoiLookup = async (doi) => {
    const meta = await lookupDoi(doi);
    if (papers.some((p) => p.doi && p.doi.toLowerCase() === meta.doi.toLowerCase())) {
      throw new Error("DOI already in your library");
    }
    const newPaper = { id: `p${Date.now()}`, ...meta, notes: "", highlights: [], status: "to-read" };
    setPapers((prev) => [newPaper, ...prev]);
    return newPaper;
  };

  const exportBibtex = () => {
    if (!papers.length) return;
    downloadString(`lectus-${todayStamp()}.bib`, papersToBibtex(papers), "application/x-bibtex;charset=utf-8");
  };
  const exportJson = () => {
    const payload = { app: "lectus", version: 1, exportedAt: new Date().toISOString(), papers };
    downloadString(`lectus-backup-${todayStamp()}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  };

  const mergePapers = (existing, incoming) => {
    const byDoi = new Map(); const byTitle = new Map();
    for (const p of existing) {
      if (p.doi) byDoi.set(p.doi.toLowerCase(), true);
      if (p.title) byTitle.set(p.title.toLowerCase(), true);
    }
    let added = 0, skipped = 0;
    const next = [...existing];
    for (const p of incoming) {
      const dKey = p.doi ? p.doi.toLowerCase() : null;
      const tKey = p.title ? p.title.toLowerCase() : null;
      if ((dKey && byDoi.has(dKey)) || (tKey && byTitle.has(tKey))) { skipped++; continue; }
      next.unshift(p);
      if (dKey) byDoi.set(dKey, true);
      if (tKey) byTitle.set(tKey, true);
      added++;
    }
    return { next, added, skipped };
  };
  const handleImportFile = async (file) => {
    const text = await readAsText(file);
    const lower = file.name.toLowerCase();
    let incoming = [];
    if (lower.endsWith(".json") || text.trim().startsWith("{")) {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : parsed.papers;
      if (!Array.isArray(list)) throw new Error("JSON has no `papers` array");
      incoming = list.map((p) => ({
        notes: "", highlights: [], status: "to-read",
        ...p,
        id: p.id || `p${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      }));
    } else { incoming = parseBibtex(text); }
    const { next, added, skipped } = mergePapers(papers, incoming);
    setPapers(next);
    return { added, skipped };
  };

  const generateReview = async () => {
    if (reviewSelection.length < 2) return;
    setReviewLoading(true); setReviewError(""); setReviewOutput(""); setReviewStructured(null);
    const sp = papers.filter((p) => reviewSelection.includes(p.id));
    try {
      if (reviewMode === "structured") setReviewStructured(await generateStructuredReview(sp, reviewTopic));
      else setReviewOutput(await generateReviewParagraph(sp, reviewTopic));
    } catch (err) { setReviewError(`Could not generate review: ${err.message}`); }
    finally { setReviewLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: theme.bg, color: theme.text,
      fontFamily: "'Instrument Sans', sans-serif",
      display: "flex", flexDirection: "column", transition: "background .3s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:${theme.panelBorder}}
        input,textarea{outline:none!important;font-family:inherit}
        li{margin:.2rem 0;padding-left:.75rem}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn .25s ease}
        .typing span{animation:blink 1.2s infinite;display:inline-block;width:5px;height:5px;border-radius:50%;margin:0 2px}
        .typing span:nth-child(2){animation-delay:.2s}.typing span:nth-child(3){animation-delay:.4s}
        @keyframes blink{0%,80%,100%{opacity:.15}40%{opacity:1}}
      `}</style>

      <TopBar view={view} onChangeView={setView} saveState={saveState} theme={theme} />

      {view === "library" && <LibraryView papers={papers} filtered={filtered} search={search} setSearch={setSearch} activeTag={activeTag} setActiveTag={setActiveTag} statusFilter={statusFilter} setStatusFilter={setStatusFilter} allTags={allTags} statusColors={statusColors} onSelectPaper={openPaper} theme={theme} />}
      {view === "graph" && <GraphView papers={papers} onSelectPaper={openPaper} theme={theme} />}
      {view === "timeline" && <TimelineView papers={papers} onSelectPaper={openPaper} theme={theme} />}
      {view === "compare" && <CompareView papers={papers} onSelectPaper={openPaper} theme={theme} />}
      {view === "paper" && selected && <PaperDetail paper={selected} statusColors={statusColors} onUpdate={updatePaper} onDelete={deletePaper} onBack={() => setView("library")} onAskAI={askAIAboutPaper} onSuggestTags={(p) => suggestTags(p, p.tags)} hasKey={Boolean(apiKey)} theme={theme} />}
      {view === "chat" && <ChatView papers={papers} messages={messages} loading={loading} chatInput={chatInput} setChatInput={setChatInput} onSend={sendChat} hasKey={Boolean(apiKey)} onConnect={openOnboarding} theme={theme} />}
      {view === "review" && <ReviewView papers={papers} reviewSelection={reviewSelection} setReviewSelection={setReviewSelection} reviewTopic={reviewTopic} setReviewTopic={setReviewTopic} reviewMode={reviewMode} setReviewMode={setReviewMode} reviewOutput={reviewOutput} reviewStructured={reviewStructured} reviewLoading={reviewLoading} reviewError={reviewError} onGenerate={generateReview} hasKey={Boolean(apiKey)} onConnect={openOnboarding} theme={theme} />}
      {view === "add" && <AddView pdfLoading={pdfLoading} pdfStatus={pdfStatus} onPdfUpload={handlePdfUpload} onDoiLookup={handleDoiLookup} hasKey={Boolean(apiKey)} onConnect={openOnboarding} theme={theme} />}
      {view === "settings" && <SettingsView themeKey={themeKey} setThemeKey={setThemeKey} accentColor={accentColor} setAccentColor={setAccentColor} papers={papers} apiKey={apiKey} apiKeySource={apiKeySource} onSaveApiKey={handleSaveApiKey} onClearApiKey={handleClearApiKey} onTestApiKey={testConnection} onExportBibtex={exportBibtex} onExportJson={exportJson} onImportFile={handleImportFile} onLoadExamples={loadExamples} theme={theme} />}

      {showOnboarding && <Onboarding onSave={handleOnboardingSave} onSkip={dismissOnboarding} theme={theme} />}
    </div>
  );
}


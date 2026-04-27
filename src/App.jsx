import { useState, useMemo } from "react";

import { THEMES } from "./constants/themes";
import { SEED_PAPERS } from "./constants/seedPapers";
import {
  askLibrary,
  extractPaperFromPdf,
  generateReviewParagraph,
} from "./api/anthropic";

import TopBar from "./components/TopBar";
import LibraryView from "./components/LibraryView";
import GraphView from "./components/GraphView";
import TimelineView from "./components/TimelineView";
import PaperDetail from "./components/PaperDetail";
import ChatView from "./components/ChatView";
import ReviewView from "./components/ReviewView";
import AddView from "./components/AddView";
import SettingsView from "./components/SettingsView";

// Read a File as base64 (without the data: prefix).
const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("Read failed"));
    r.readAsDataURL(file);
  });

export default function App() {
  // Theme state — base theme + optional accent override
  const [themeKey, setThemeKey] = useState("midnight");
  const [accentColor, setAccentColor] = useState(null);
  const baseTheme = THEMES[themeKey];
  const theme = accentColor ? { ...baseTheme, accent: accentColor } : baseTheme;

  // Library state
  const [papers, setPapers] = useState(SEED_PAPERS);
  const [view, setView] = useState("library");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);

  // PDF upload state
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState("");

  // Literature review state
  const [reviewSelection, setReviewSelection] = useState([]);
  const [reviewOutput, setReviewOutput] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewTopic, setReviewTopic] = useState("");

  // Derived data
  const allTags = useMemo(
    () => [...new Set(papers.flatMap((p) => p.tags))].sort(),
    [papers]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return papers.filter((p) => {
      const ms =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.abstract.toLowerCase().includes(q);
      const mt = !activeTag || p.tags.includes(activeTag);
      const mst = statusFilter === "all" || p.status === statusFilter;
      return ms && mt && mst;
    });
  }, [papers, search, activeTag, statusFilter]);

  const statusColors = useMemo(
    () => ({
      "to-read": { bg: theme.chip, color: theme.textSubtle, label: "To read" },
      reading: { bg: theme.accent + "22", color: theme.accent, label: "Reading" },
      read: { bg: "#1a2418", color: "#6a9060", label: "Read" },
    }),
    [theme]
  );

  // ── Mutations ────────────────────────────────────────────────────────────
  const updatePaper = (id, updates) => {
    setPapers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (selected?.id === id) setSelected((prev) => ({ ...prev, ...updates }));
  };

  const openPaper = (p) => {
    setSelected(p);
    setView("paper");
  };

  // ── Chat ────────────────────────────────────────────────────────────────
  const sendChat = async (override) => {
    const msg = override || chatInput;
    if (!msg.trim()) return;
    const newMsgs = [...messages, { role: "user", content: msg }];
    setMessages(newMsgs);
    setChatInput("");
    setLoading(true);
    try {
      const reply = await askLibrary(papers, newMsgs);
      setMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([
        ...newMsgs,
        { role: "assistant", content: `Connection error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const askAIAboutPaper = (prompt) => {
    setView("chat");
    sendChat(prompt);
  };

  // ── PDF upload ──────────────────────────────────────────────────────────
  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setPdfStatus("Please upload a PDF file");
      return;
    }
    setPdfLoading(true);
    setPdfStatus("Reading PDF...");
    try {
      const base64 = await readAsBase64(file);
      setPdfStatus("AI extracting metadata...");
      const parsed = await extractPaperFromPdf(base64);
      const newPaper = {
        id: `p${Date.now()}`,
        ...parsed,
        notes: "",
        highlights: [],
        status: "to-read",
      };
      setPapers((prev) => [newPaper, ...prev]);
      setPdfStatus(`✓ Added "${parsed.title.slice(0, 40)}..."`);
      setTimeout(() => {
        setPdfStatus("");
        setPdfLoading(false);
      }, 2000);
    } catch (err) {
      setPdfStatus(`Error processing PDF: ${err.message}`);
      setPdfLoading(false);
      setTimeout(() => setPdfStatus(""), 3000);
    }
  };

  // ── Literature review ───────────────────────────────────────────────────
  const generateReview = async () => {
    if (reviewSelection.length < 2) return;
    setReviewLoading(true);
    setReviewOutput("");
    const sp = papers.filter((p) => reviewSelection.includes(p.id));
    try {
      const out = await generateReviewParagraph(sp, reviewTopic);
      setReviewOutput(out);
    } catch (err) {
      setReviewOutput(`Connection error: ${err.message}`);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        fontFamily: "'Instrument Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        transition: "background .3s",
      }}
    >
      {/* Themed scrollbars + animations injected per render so they pick up
          the current theme colours. */}
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

      <TopBar view={view} onChangeView={setView} theme={theme} />

      {view === "library" && (
        <LibraryView
          papers={papers}
          filtered={filtered}
          search={search}
          setSearch={setSearch}
          activeTag={activeTag}
          setActiveTag={setActiveTag}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          allTags={allTags}
          statusColors={statusColors}
          onSelectPaper={openPaper}
          theme={theme}
        />
      )}

      {view === "graph" && (
        <GraphView papers={papers} onSelectPaper={openPaper} theme={theme} />
      )}

      {view === "timeline" && (
        <TimelineView papers={papers} onSelectPaper={openPaper} theme={theme} />
      )}

      {view === "paper" && selected && (
        <PaperDetail
          paper={selected}
          statusColors={statusColors}
          onUpdate={updatePaper}
          onBack={() => setView("library")}
          onAskAI={askAIAboutPaper}
          theme={theme}
        />
      )}

      {view === "chat" && (
        <ChatView
          papers={papers}
          messages={messages}
          loading={loading}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSend={sendChat}
          theme={theme}
        />
      )}

      {view === "review" && (
        <ReviewView
          papers={papers}
          reviewSelection={reviewSelection}
          setReviewSelection={setReviewSelection}
          reviewTopic={reviewTopic}
          setReviewTopic={setReviewTopic}
          reviewOutput={reviewOutput}
          reviewLoading={reviewLoading}
          onGenerate={generateReview}
          theme={theme}
        />
      )}

      {view === "add" && (
        <AddView
          pdfLoading={pdfLoading}
          pdfStatus={pdfStatus}
          onPdfUpload={handlePdfUpload}
          theme={theme}
        />
      )}

      {view === "settings" && (
        <SettingsView
          themeKey={themeKey}
          setThemeKey={setThemeKey}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          papers={papers}
          theme={theme}
        />
      )}
    </div>
  );
}

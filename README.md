# Lectus

> _Lectus_ - Latin, "having been read."

An AI-assisted research paper library for organising, visualising, and synthesising scientific literature. Built with React + Vite. Uses the Anthropic API to extract metadata from PDFs, answer questions across your library, and draft literature-review paragraphs.

## Features

- **Library** searchable, taggable list of papers with read/reading/to-read status, personal notes, and quote highlights.
- **Graph** force-directed network of papers connected by shared tags.
- **Timeline** chronological view grouped by publication year.
- **Ask** chat with Claude about your library (notes and highlights included as context).
- **Review** pick 2+ papers and get a publication-ready literature-review paragraph.
- **Add** drop a PDF, AI extracts title, authors, journal, year, DOI, tags, abstract, and key findings.
- **Themes** Midnight, Parchment, Ocean, Forest. Custom accent colour.

## Quick start

```bash
npm install
cp .env       # then add your Anthropic API key
npm run dev
```
## Docker

```bash
docker run -it --rm -v "${PWD}:/app" -w /app -p 5173:5173 node:24-slim sh
```

Open http://localhost:5173.

## Environment variables

| Variable                   | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| `VITE_ANTHROPIC_API_KEY`   | Anthropic API key used by all AI features.      |

> **Security note.** Anything prefixed with `VITE_` is bundled into the client JavaScript and visible to anyone who opens devtools. This setup is intended for **local development only**. Before deploying anywhere public, route the Anthropic calls through a server-side proxy and remove the key from the client.

## Project structure

```
src/
├── api/
│   └── anthropic.js         # All HTTP calls to the Anthropic Messages API
├── components/
│   ├── AddView.jsx          # PDF dropzone
│   ├── ChatView.jsx         # Library Q&A
│   ├── GraphView.jsx        # Force-directed tag network
│   ├── LibraryView.jsx      # Searchable list with sidebar filters
│   ├── PaperDetail.jsx      # Single paper: notes, highlights, status
│   ├── ReviewView.jsx       # Multi-paper literature review generator
│   ├── SettingsView.jsx     # Theme + accent picker, library stats
│   ├── TimelineView.jsx     # Year-grouped timeline
│   └── TopBar.jsx           # Logo + view tabs + settings cog
├── constants/
│   ├── prompts.js           # Centralised prompt templates
│   ├── seedPapers.js        # Initial library content
│   ├── tagColors.js         # Stable colour-per-tag mapping
│   └── themes.js            # Midnight / Parchment / Ocean / Forest
├── utils/
│   ├── format.js            # Tiny markdown renderer for chat
│   └── graph.js             # Edge builder + force-directed layout
├── App.jsx                  # State, view routing, AI handlers
├── index.css                # Base reset
└── main.jsx                 # React entry point
```

## Scripts

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start the Vite dev server on port 5173.   |
| `npm run build`   | Produce a production build in `dist/`.    |
| `npm run preview` | Preview the production build locally.     |

## Notes

- Library state lives in React memory refreshing the page resets to the seed library. Persistence (localStorage, file, or backend) is the obvious next step.
- The model is set in `src/api/anthropic.js` (`MODEL` constant). Bump it whenever you want a different Claude version.

## License

See [LICENSE](LICENSE).

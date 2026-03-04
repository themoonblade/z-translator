# Technical Architecture — Z-TRANSLATOR

## Overview

Z-TRANSLATOR is an AI-powered text processing web application (translation, summarization, rewriting). It relies on a classic two-layer **client-server** architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Browser                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Frontend (HTML / CSS / vanilla JS)                   │  │
│  │  index.html · style.css · app.js                      │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │  HTTP / REST (JSON, multipart)
┌─────────────────────────┼───────────────────────────────────┐
│  FastAPI Backend        │  Port 8001                        │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │  main.py  (routes, CORS, static files)                │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  services.py                                          │  │
│  │  ├─ OllamaService    (LLM calls)                      │  │
│  │  ├─ FileParser       (DOCX / PDF / HTML extraction)   │  │
│  │  └─ FileExporter     (DOCX / HTML / PDF generation)   │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │  HTTP (JSON)
┌─────────────────────────┼───────────────────────────────────┐
│  Ollama Server          │                                   │
│  $OLLAMA_BASE_URL (default: localhost:11434)                 │
│  API /api/generate · /api/tags                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer     | Technologies                                                        |
|-----------|---------------------------------------------------------------------|
| Frontend  | HTML5, CSS3 (Outfit font, Font Awesome), vanilla JavaScript         |
| Backend   | Python 3.8+, FastAPI, Uvicorn, httpx                                |
| AI        | Ollama (LLM models, default `llama3`)                               |
| Parsing   | python-docx, pypdf, pdf2docx, BeautifulSoup4, Pillow                |
| Export    | python-docx, reportlab                                              |

---

## File Structure

```
z-translator/
├── backend/
│   ├── __init__.py            # Python package
│   ├── main.py                # FastAPI application, routes, CORS
│   └── services.py            # Business services (Ollama, parsing, export)
├── frontend/
│   ├── index.html             # User interface (SPA)
│   ├── style.css              # Stylesheet (dark theme, glassmorphism)
│   ├── app.js                 # Client logic (fetch API, DOM)
│   ├── logo.png               # Application logo
│   └── gustave.png            # Mascot image
├── docs/                      # Documentation (this directory)
├── requirements.txt           # Python dependencies
└── README.md                  # Landing page
```

---

## Backend — Component Details

### `main.py` — FastAPI Application

| Responsibility          | Details                                                                                 |
|-------------------------|-----------------------------------------------------------------------------------------|
| CORS configuration      | All origins allowed (`*`)                                                               |
| Static files            | Frontend served directly by FastAPI (`StaticFiles`)                                     |
| Task tracking           | `active_tasks` dictionary for cancellation via `POST /cancel/{task_id}`                |
| Pydantic models         | `TranslationRequest`, `SummarizeRequest`, `RewriteRequest`                              |

### `services.py` — Business Services

#### `OllamaService`

Class responsible for communicating with the Ollama server. The server URL is configurable via the **`OLLAMA_BASE_URL`** environment variable (default: `http://localhost:11434`).

| Method                   | Description                                 |
|--------------------------|---------------------------------------------|
| `get_models()`           | Lists available models (`/api/tags`)        |
| `translate()`            | Translation with automatic language detection |
| `summarize()`            | Concise text summarization                  |
| `rewrite()`              | Professional text rewriting                 |

Each method returns **performance metrics**: duration, word count, words/second, compression ratio (for summarization).

#### `FileParser`

Extracts text content from files with **object preservation** (images and tables) using an anchor system (`##IMG001##`, `##TBL001##`).

| Method           | Format | Strategy                                         |
|------------------|--------|--------------------------------------------------|
| `_parse_pdf()`   | PDF    | Conversion to DOCX via `pdf2docx`, then parsing  |
| `_parse_docx()`  | DOCX   | Paragraph-by-paragraph extraction with anchors    |
| `_parse_html()`  | HTML   | Text extraction via BeautifulSoup                 |
| (direct)         | TXT    | UTF-8 decoding                                    |

#### `FileExporter`

Reconstructs translated files by reinserting objects at anchor positions.

| Method             | Format | Details                                            |
|--------------------|--------|----------------------------------------------------|
| `_export_docx()`   | DOCX   | Reconstruction with images and tables              |
| `_export_html()`   | HTML   | `<p>` paragraphs in an HTML5 page                  |
| `_export_pdf()`    | PDF    | Generation via reportlab (A4)                      |

> **Note:** Translated PDFs are exported as DOCX to better preserve objects.

---

## REST API — Endpoints

| Method | Route              | Tag            | Description                             |
|--------|--------------------|----------------|-----------------------------------------|
| GET    | `/models`          | Models         | Lists Ollama models                     |
| POST   | `/cancel/{task_id}`| Control        | Cancels an ongoing task                 |
| POST   | `/translate/text`  | Translation    | Translates text                         |
| POST   | `/translate/file`  | Translation    | Translates a file (multipart)           |
| POST   | `/summarize/text`  | Summarization  | Summarizes text                         |
| POST   | `/summarize/file`  | Summarization  | Summarizes a file (multipart)           |
| POST   | `/rewrite/text`    | Rewriting      | Rewrites text                           |
| POST   | `/rewrite/file`    | Rewriting      | Rewrites a file (multipart)             |

**Interactive Swagger documentation**: `http://localhost:8001/docs`

---

## Frontend — Organization

The frontend is a **SPA (Single Page Application)** organized into 3 tabs:

1. **Text** — Direct text input and processing
2. **File** — File upload and processing (drag & drop)
3. **API** — Built-in endpoint documentation

### Notable UI Features

- Dark theme with **glassmorphism** effects
- **Outfit** Google Font + **Font Awesome 6** icons
- Real-time character counter
- **Stop** buttons to cancel ongoing operations
- Copy to clipboard
- Performance metrics displayed after each processing
- Modal for file summarization/rewriting results
- Configurable timeout selector (1 min → 2 hours)

---

## Data Flows

### Text Translation

```
User → input-text → POST /translate/text (JSON) → OllamaService.translate()
    → Ollama /api/generate → JSON response → output-text + metrics
```

### File Translation

```
User → upload file → POST /translate/file (multipart)
    → FileParser.parse_file() → text + objects (anchors)
    → OllamaService.translate() → translated text
    → FileExporter.export_file() → translated file (with objects reinserted)
    → StreamingResponse → automatic download
```

---

## Supported Languages

| Code | Language   |
|------|------------|
| Auto | Automatic detection (source only) |
| FR   | French     |
| EN   | English    |
| ES   | Spanish    |
| DE   | German     |
| IT   | Italian    |
| PT   | Portuguese |

# User Guide — Z-TRANSLATOR

## Overview

Z-TRANSLATOR is an AI-powered text processing service. It offers three main features:

- 🌐 **Translation** — Translate text between 6 languages
- 📝 **Summarization** — Generate a concise summary of text
- ✍️ **Rewriting** — Improve text clarity and professionalism

Each feature is available in **text** mode (direct input) and **file** mode (document upload).

---

## User Interface

The interface is organized into **3 tabs** at the top of the page:

| Tab      | Icon | Description                              |
|----------|------|------------------------------------------|
| **Text** | 🅰️    | Process directly typed text              |
| **File** | 📄    | Process uploaded files                   |
| **API**  | 💻    | REST endpoint documentation              |

### Global Controls (header bar)

- **Model** — Select the AI model to use (e.g., `llama3`, `qwen3-coder:480b-cloud`)
- **Timeout** — Maximum wait time (1 min to 2 hours), useful for large files

---

## Text Tab — Text Processing

### Translation

1. In the **left** panel, select the **source language** (or leave on "Auto (Detect)")
2. Type or paste your text in the input area
3. In the **right** panel, select the **target language**
4. Click **Translate →**
5. The translated text appears in the right panel with performance metrics

### Summarization

1. Enter your text in the input area
2. Select the **target language** for the summary
3. Click **Summarize**
4. The summary appears in the results panel

### Rewriting

1. Enter your text in the input area
2. Select the **target language**
3. Click **Rewrite**
4. The improved text appears in the results panel

### Additional Actions

- **📋 Copy** — Click the copy icon to copy the result to the clipboard
- **⏹ Stop** — During processing, a Stop button appears to cancel the operation
- **Character counter** — Displayed below the input area

---

## File Tab — File Processing

### Supported Formats

| Format | Extension | Notes                                                    |
|--------|-----------|----------------------------------------------------------|
| DOCX   | `.docx`   | Full support (text, images, tables)                      |
| PDF    | `.pdf`    | Converted to DOCX for processing, exported as DOCX      |
| TXT    | `.txt`    | Plain text UTF-8                                         |
| HTML   | `.html`   | Text extraction, HTML structure ignored                  |

### Uploading a File

Two methods:

1. **Drag & drop** — Drag your file onto the upload area
2. **Click** — Click the upload area to open the file picker

Once selected, the filename is displayed with a ✕ button to remove it.

### Translating a File

1. Upload your file
2. Select the **source** and **target** languages
3. Click **Translate File**
4. The translated file is **automatically downloaded** in the same format

> **Note:** PDF files are exported as DOCX to better preserve images and tables.

### Summarizing a File

1. Upload your file
2. Click **Summarize File**
3. The summary is displayed in a **modal window**

### Rewriting a File

1. Upload your file
2. Click **Rewrite File**
3. The rewritten text is displayed in a **modal window**

### Timeout Management

For large files, increase the **timeout** in the page header:

| Value    | Recommendation                        |
|----------|----------------------------------------|
| 1 min    | Small files (< 1 page)                |
| 5 min    | Standard files (1-10 pages)            |
| 15 min   | Large files (10-50 pages)              |
| 1-2 h    | Very large documents (50+ pages)       |

---

## API Tab — Technical Documentation

This tab lists the available **REST endpoints** for programmatic integration. For the full interactive documentation with examples, visit:

**[http://localhost:8001/docs](http://localhost:8001/docs)** (Swagger UI)

---

## Supported Languages

| Language   | As Source | As Target |
|------------|-----------|-----------|
| Auto (Automatic Detection) | ✅ | ❌ |
| French     | ✅        | ✅        |
| English    | ✅        | ✅        |
| Spanish    | ✅        | ✅        |
| German     | ✅        | ✅        |
| Italian    | ✅        | ✅        |
| Portuguese | ✅        | ✅        |

---

## Displayed Metrics

After each processing, performance metrics are shown:

| Metric             | Available For           | Description                        |
|--------------------|-------------------------|------------------------------------|
| Duration           | All                     | Total processing time              |
| Word count         | All                     | Words in the source text           |
| Words/second       | All                     | Processing speed                   |
| Compression ratio  | Summarization only      | % reduction from original          |

---

## Usage Tips

1. **Auto-detection** — Leave the source language on "Auto" if you're unsure about the text's language
2. **Choose the right model** — Some models are faster, others more accurate. Experiment to find the right balance
3. **Timeout** — Increase the timeout **before** starting a large file processing
4. **Stop** — Don't hesitate to use the Stop button if processing seems stuck
5. **Images and tables** — DOCX files retain their images and tables after translation

# Z-TRANSLATOR

> AI-powered text processing service (Translation, Summarization, Rewriting).

[![Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/Ollama-LLM-orange.svg)](https://ollama.ai/)

---

## ✨ Features

- 🌐 **Translation** between 6 languages (FR, EN, ES, DE, IT, PT) with automatic detection
- 📝 **Summarization** of texts and documents
- ✍️ **Rewriting** for improved clarity and professionalism
- 📄 **File processing** — DOCX, PDF, TXT, HTML (with image and table preservation)
- 🎨 **Premium UI** — Dark theme, glassmorphism, drag & drop
- 🤖 **Local AI** — Powered by Ollama (no data sent to third-party services)

---

For local AI, the following models are recommended for translation:

| Model | Specialty | File Size | RAM Usage | Performance |
|-------|-----------|-----------|-----------|-------------|
| TranslateGemma:4b | Pure translation (55 languages) | ~2.5 GB | ~4.5 GB | ★★★★★ |
| Qwen3.5:4b | Multilingual & Context | ~2.8 GB | ~5.0 GB | ★★★★★ |
| Llama 3.1:8b | Versatility & Nuance | ~4.7 GB | ~7.5 GB | ★★★★★ |
| Ministral-3:8b | French / English | ~5.1 GB | ~7.8 GB | ★★★★★ |

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Start the server
cd backend
python main.py
```

➡️ Open [http://localhost:8001](http://localhost:8001)

> 💡 **Note**: If your Ollama instance is hosted at a different address than `http://localhost:11434`, update the API URL using the `OLLAMA_BASE_URL` environment variable.

### 🐳 Docker

```bash
docker build -t z-translator .
docker run -p 8001:8001 z-translator
```

> By default, the container connects to Ollama at `http://host.docker.internal:11434` (your host machine). Override with `-e OLLAMA_BASE_URL=http://your-server:11434`.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [🏗️ Architecture](docs/architecture.md) | Technical architecture, components, data flows, REST API |
| [📦 Installation](docs/installation.md) | Prerequisites, step-by-step setup, configuration, verification |
| [👤 User Guide](docs/guide-utilisateur.md) | UI walkthrough, tabs, features, tips |
| [⚙️ Operations](docs/operations.md) | Start/stop, logs, monitoring, security, troubleshooting |

---

## 🛠️ Tech Stack

| Layer    | Technologies                                        |
|----------|-----------------------------------------------------|
| Frontend | HTML5, CSS3, vanilla JavaScript, Outfit, Font Awesome |
| Backend  | Python, FastAPI, Uvicorn, httpx                      |
| AI       | Ollama (local LLM)                                  |
| Parsing  | python-docx, pypdf, pdf2docx, BeautifulSoup4        |

---

## 📡 API

Interactive Swagger documentation: **[http://localhost:8001/docs](http://localhost:8001/docs)**

| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| GET    | `/models`           | List available AI models |
| POST   | `/translate/text`   | Translate text           |
| POST   | `/translate/file`   | Translate a file         |
| POST   | `/summarize/text`   | Summarize text           |
| POST   | `/summarize/file`   | Summarize a file         |
| POST   | `/rewrite/text`     | Rewrite text             |
| POST   | `/rewrite/file`     | Rewrite a file           |
| POST   | `/cancel/{task_id}` | Cancel an ongoing task   |

---

## 📄 License

[GPL-3.0](LICENSE)

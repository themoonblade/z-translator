# Installation Guide — Z-TRANSLATOR

## Prerequisites

| Component       | Minimum Version | Notes                                                  |
|-----------------|-----------------|--------------------------------------------------------|
| Python          | 3.8+            | Tested with Python 3.10+                               |
| pip             | 21+             | Python package manager                                 |
| Ollama Server   | —               | Default `http://localhost:11434`                       |
| Web Browser     | Modern          | Chrome, Firefox, Edge (ES6+ required)                  |

---

## Quick Setup

### 1. Clone the project

```bash
git clone <repository-url>
cd z-translator
```

### 2. Create a virtual environment (recommended)

```bash
# Create the environment
python -m venv venv

# Activate the environment
# Windows:
venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

Installed dependencies:

| Package          | Purpose                                    |
|------------------|--------------------------------------------|
| fastapi          | Asynchronous web framework                 |
| uvicorn          | ASGI server                                |
| httpx            | Async HTTP client (Ollama calls)           |
| python-docx      | DOCX file reading / writing               |
| pypdf            | PDF file reading (fallback)                |
| pdf2docx         | PDF → DOCX conversion                     |
| beautifulsoup4   | HTML file parsing                          |
| python-multipart | Multipart upload support                   |
| reportlab        | PDF file generation                        |
| pillow           | Image processing                           |

### 4. Configure environment variables (optional)

```bash
# Windows (PowerShell)
$env:OLLAMA_BASE_URL = "http://localhost:11434"

# Linux / macOS
export OLLAMA_BASE_URL="http://localhost:11434"
```

> If the variable is not set, the default value `http://localhost:11434` is used.

### 5. Start the server

```bash
cd backend
python main.py
```

The server starts on **`http://0.0.0.0:8001`**:

```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

### 6. Access the application

Open your browser at:

- **Application**: [http://localhost:8001](http://localhost:8001)
- **Swagger API Documentation**: [http://localhost:8001/docs](http://localhost:8001/docs)

---

## Configuration

### Ollama Server

The Ollama server URL is configured via the **`OLLAMA_BASE_URL` environment variable**:

```bash
# Default value (used if the variable is not set)
OLLAMA_BASE_URL="http://localhost:11434"
```

To use a different Ollama server:

```bash
# Linux / macOS
export OLLAMA_BASE_URL="http://my-ollama-server:11434"

# Windows (PowerShell)
$env:OLLAMA_BASE_URL = "http://my-ollama-server:11434"
```

### Server Port

The port is defined in `backend/main.py`:

```python
uvicorn.run(app, host="0.0.0.0", port=8001)
```

Change `8001` if the port is already in use.

### Default Model

The default model is `llama3`. It can be changed on the fly via the model selector in the UI or via the `model` API parameter.

---

## Verifying the Installation

### 1. Check that the backend responds

```bash
curl http://localhost:8001/models
```

You should receive a JSON list of available models.

### 2. Check Ollama connectivity

```bash
curl http://localhost:11434/api/tags
```

### 3. Test a translation

```bash
curl -X POST http://localhost:8001/translate/text \
  -H "Content-Type: application/json" \
  -d '{"text": "Bonjour le monde", "source_lang": "French", "target_lang": "English", "model": "llama3"}'
```

---

## Common Issues

| Issue                              | Probable Cause                              | Solution                                         |
|------------------------------------|---------------------------------------------|--------------------------------------------------|
| "Loading models…" in the dropdown  | Backend not started                         | Run `python main.py` in `backend/`               |
| Port already in use                | Another process on port 8001                | `netstat -ano \| findstr :8001` then kill         |
| CORS error                         | Access from an unexpected origin            | Check CORS configuration in `main.py`            |
| File timeout                       | File too large                              | Increase timeout in the UI (max 2h)              |
| Module not found                   | Dependencies not installed                  | Re-run `pip install -r requirements.txt`         |

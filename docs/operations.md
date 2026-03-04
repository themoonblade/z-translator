# Operations Guide — Z-TRANSLATOR

## Starting and Stopping the Service

### Start the server

```bash
cd backend
python main.py
```

The server listens on `http://0.0.0.0:8001` (all network interfaces).

To specify a different Ollama server:

```bash
# Linux / macOS
export OLLAMA_BASE_URL="http://my-server:11434"
python main.py

# Windows (PowerShell)
$env:OLLAMA_BASE_URL = "http://my-server:11434"
python main.py
```

### Stop the server

Press **Ctrl+C** in the terminal where the server is running.

### Background startup (Linux/macOS)

```bash
cd backend
nohup python main.py > ../logs/z-translator.log 2>&1 &
```

### Background startup (Windows)

```powershell
Start-Process -NoNewWindow python -ArgumentList "main.py" -WorkingDirectory "backend"
```

---

## Monitoring and Logs

### Server Logs

The server writes to **standard output** (stdout/stderr). Logged information includes:

| Log Type                     | Example                                                     |
|------------------------------|--------------------------------------------------------------|
| Uvicorn startup              | `INFO: Uvicorn running on http://0.0.0.0:8001`              |
| HTTP requests                | `INFO: 127.0.0.1 - "POST /translate/text HTTP/1.1" 200`     |
| DOCX parsing debug           | `[DEBUG] DOCX Parser: Found 3 images, 1 tables`             |
| Export debug                 | `[DEBUG] DOCX Exporter: Received 4 objects`                  |
| Ollama errors                | `Error translating text: ...`                                |

### Redirect logs to a file

```bash
python main.py > z-translator.log 2>&1
```

### Check that the service is running

```bash
# Quick test
curl -s http://localhost:8001/models | head -c 200

# Full health check
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/models
# Should return 200
```

---

## Process Management

### Identify the process

```bash
# Windows
netstat -ano | findstr :8001

# Linux/macOS
lsof -i :8001
```

### Kill a stuck process

```bash
# Windows (replace <PID> with the process ID)
taskkill /PID <PID> /F

# Linux/macOS
kill -9 <PID>
```

---

## External Dependency: Ollama

### Check Ollama availability

```bash
curl http://localhost:11434/api/tags
```

### List available models

```bash
curl -s http://localhost:11434/api/tags | python -m json.tool
```

### Change the Ollama server

Set the **`OLLAMA_BASE_URL`** environment variable before starting the server:

```bash
# Linux / macOS
export OLLAMA_BASE_URL="http://new-server:port"

# Windows (PowerShell)
$env:OLLAMA_BASE_URL = "http://new-server:port"
```

Default value (if the variable is not set): `http://localhost:11434`

Restart the server after the change.

---

## Performance and Limits

### Known Limits

| Parameter                    | Value                     | Notes                                |
|------------------------------|---------------------------|---------------------------------------|
| Minimum timeout              | 60 seconds                | Configurable per request             |
| Maximum timeout              | 7200 seconds (2 hours)    | Configurable per request             |
| Default timeout              | 300 seconds (5 minutes)   | Via UI or API parameter              |
| Maximum file size            | No fixed limit            | Limited by available RAM             |
| Input formats                | DOCX, PDF, TXT, HTML      |                                       |
| Output formats               | DOCX, TXT, HTML           | PDF input → DOCX output             |

### Performance Factors

- **Model size** — Larger models are slower but often more accurate
- **Text length** — Processing time is proportional to word count
- **Ollama server load** — Concurrent requests share GPU resources
- **PDF conversion** — PDF → DOCX conversion via `pdf2docx` can be slow for large files

---

## Security

### CORS Configuration

The backend allows **all origins** (`allow_origins=["*"]`). For a production environment, restrict origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Production Recommendations

| Topic                | Recommendation                                                   |
|----------------------|------------------------------------------------------------------|
| CORS                 | Restrict `allow_origins` to authorized domains                   |
| HTTPS                | Use a reverse proxy (nginx, Caddy) with a TLS certificate       |
| Rate limiting        | Add a request limiter (e.g., `slowapi`)                          |
| Authentication       | Add an authentication middleware if publicly exposed             |
| Logs                 | Configure log rotation (logrotate or equivalent)                 |
| Monitoring           | Integrate a monitoring tool (Prometheus, Grafana)                |

---

## Backup and Recovery

The application is **stateless**: no database, no persistent server-side files. Uploaded files are processed in memory and are not stored.

**Items to back up:**

- Source code (`backend/`, `frontend/`, `requirements.txt`)
- Ollama configuration (models installed on the Ollama server)

---

## Updating

### Update the application

```bash
git pull origin main
pip install -r requirements.txt
# Restart the server
```

### Update dependencies

```bash
pip install --upgrade -r requirements.txt
```

---

## Quick Troubleshooting

| Symptom                             | Verification                                           | Action                                          |
|-------------------------------------|--------------------------------------------------------|--------------------------------------------------|
| Blank page / 404 error             | Is the frontend in `../frontend/`?                      | Check file structure                             |
| "Loading models…"                   | `curl http://localhost:8001/models`                     | Start the backend                                |
| Translation fails                   | `curl http://localhost:11434/api/tags`                  | Check Ollama connection                          |
| Port busy                           | `netstat -ano \| findstr :8001`                         | Kill the process or change the port              |
| Timeout on large file               | Check the timeout parameter                            | Increase timeout (max 7200s)                     |
| Python import error                 | `pip list`                                             | Re-run `pip install -r requirements.txt`         |

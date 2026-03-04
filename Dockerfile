FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for pdf2docx and reportlab
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Default environment variables
ENV OLLAMA_BASE_URL=http://host.docker.internal:11434

EXPOSE 8001

CMD ["python", "backend/main.py"]

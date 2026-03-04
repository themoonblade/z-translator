from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from services import OllamaService, FileParser, FileExporter
from pydantic import BaseModel
import io
import os
import uuid
from typing import Dict, Set

app = FastAPI(
    title="Z-TRANSLATOR API",
    description="AI-powered text processing service (translation, summarization, rewriting) supporting text and file processing with configurable timeout",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ollama_service = OllamaService()
file_parser = FileParser()
file_exporter = FileExporter()

# Task tracking for cancellation
active_tasks: Dict[str, bool] = {}  # task_id -> is_cancelled

# Mount static files
# Assuming frontend is at ../frontend relative to this file
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

@app.get("/")
async def read_root():
    if os.path.exists(os.path.join(frontend_path, "index.html")):
        return FileResponse(os.path.join(frontend_path, "index.html"))
    return {"message": "Frontend not found"}

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str
    model: str = "llama3"
    task_id: str = None  # Optional task ID for tracking

@app.get("/models", tags=["Models"])
async def list_models():
    """List all available Ollama models for translation"""
    return await ollama_service.get_models()

@app.post("/cancel/{task_id}", tags=["Control"])
async def cancel_task(task_id: str):
    """Cancel an ongoing task"""
    if task_id in active_tasks:
        active_tasks[task_id] = True  # Mark as cancelled
        return {"status": "cancelled", "task_id": task_id}
    return {"status": "not_found", "task_id": task_id}

@app.post("/translate/text", tags=["Translation"])
async def translate_text(request: TranslationRequest):
    """
    Translate text from source language to target language
    
    - **text**: Text to translate
    - **source_lang**: Source language (Auto, French, English, Spanish, German, Italian, Portuguese)
    - **target_lang**: Target language
    - **model**: Ollama model to use (optional, defaults to llama3)
    - **task_id**: Optional task ID for tracking (auto-generated if not provided)
    
    Returns translation with performance metrics (duration, word count, words per second) and task_id
    """
    # Generate task ID if not provided
    task_id = request.task_id or str(uuid.uuid4())
    active_tasks[task_id] = False  # Initialize as not cancelled
    
    try:
        result = await ollama_service.translate(
            request.text, 
            request.source_lang, 
            request.target_lang, 
            request.model
        )
        result["task_id"] = task_id
        return result
    finally:
        # Clean up task tracking
        if task_id in active_tasks:
            del active_tasks[task_id]

@app.post("/translate/file", tags=["Translation"])
async def translate_file(
    file: UploadFile = File(..., description="File to translate (.docx, .pdf, .txt, .html)"),
    source_lang: str = Form(..., description="Source language"),
    target_lang: str = Form(..., description="Target language"),
    model: str = Form("llama3", description="Ollama model to use"),
    timeout: int = Form(300, description="Timeout in seconds (60-7200, default: 300)")
):
    """
    Translate a file and return the translated file in the same format
    
    Supported formats: DOCX, PDF, TXT, HTML
    Configurable timeout: 60s to 7200s (2 hours)
    """
    try:
        # Parse file
        text = await file_parser.parse_file(file)
        print(f"[DEBUG] main.py: Parsed text (first 500 chars): {text[:500]}")
        print(f"[DEBUG] main.py: file_parser.objects = {list(file_parser.objects.keys())}")
        
        # Translate with timeout
        translation = await ollama_service.translate(
            text, 
            source_lang, 
            target_lang, 
            model,
            timeout=timeout
        )
        
        translated_text = translation["translation"] if isinstance(translation, dict) else translation
        print(f"[DEBUG] main.py: Translated text (first 500 chars): {translated_text[:500]}")
        print(f"[DEBUG] main.py: Passing {len(file_parser.objects)} objects to exporter")
        
        # Export to same format with objects
        output_file = await file_exporter.export_file(
            translated_text,
            file.filename,
            file.content_type,
            file_parser.objects  # Pass extracted objects
        )
        
        # For PDF files, change extension to .docx
        output_filename = file.filename
        if file.filename.lower().endswith('.pdf'):
            output_filename = file.filename[:-4] + '.docx'
        
        # Return file
        return StreamingResponse(
            io.BytesIO(output_file),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document" if output_filename.endswith('.docx') else file.content_type,
            headers={
                "Content-Disposition": f"attachment; filename=translated_{output_filename}"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SummarizeRequest(BaseModel):
    text: str
    model: str = "llama3"
    target_lang: str = "English"
    task_id: str = None  # Optional task ID for tracking

@app.post("/summarize/text", tags=["Summarization"])
async def summarize_text(request: SummarizeRequest):
    """
    Summarize text concisely
    
    - **text**: Text to summarize
    - **model**: Ollama model to use (optional, defaults to llama3)
    - **target_lang**: Target language for the summary (default: English)
    - **task_id**: Optional task ID for tracking (auto-generated if not provided)
    
    Returns summary with performance metrics (duration, word counts, compression ratio) and task_id
    """
    # Generate task ID if not provided
    task_id = request.task_id or str(uuid.uuid4())
    active_tasks[task_id] = False  # Initialize as not cancelled
    
    try:
        result = await ollama_service.summarize(
            request.text,
            request.model,
            request.target_lang
        )
        result["task_id"] = task_id
        return result
    finally:
        # Clean up task tracking
        if task_id in active_tasks:
            del active_tasks[task_id]

@app.post("/summarize/file", tags=["Summarization"])
async def summarize_file(
    file: UploadFile = File(..., description="File to summarize (.docx, .pdf, .txt, .html)"),
    model: str = Form("llama3", description="Ollama model to use"),
    target_lang: str = Form("English", description="Target language for summary"),
    timeout: int = Form(300, description="Timeout in seconds (60-7200, default: 300)")
):
    """
    Summarize a file and return the summary as text
    
    Supported formats: DOCX, PDF, TXT, HTML
    Configurable timeout: 60s to 7200s (2 hours)
    """
    try:
        # Parse file
        text = await file_parser.parse_file(file)
        
        # Summarize with timeout
        result = await ollama_service.summarize(
            text,
            model,
            target_lang,
            timeout=timeout
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RewriteRequest(BaseModel):
    text: str
    model: str = "llama3"
    target_lang: str = "English"
    task_id: str = None  # Optional task ID for tracking

@app.post("/rewrite/text", tags=["Rewriting"])
async def rewrite_text(request: RewriteRequest):
    """
    Rewrite text to improve clarity and professionalism
    
    - **text**: Text to rewrite
    - **model**: Ollama model to use (optional, defaults to llama3)
    - **target_lang**: Target language for the rewritten text (default: English)
    - **task_id**: Optional task ID for tracking (auto-generated if not provided)
    
    Returns rewritten text with performance metrics and task_id
    """
    # Generate task ID if not provided
    task_id = request.task_id or str(uuid.uuid4())
    active_tasks[task_id] = False  # Initialize as not cancelled
    
    try:
        result = await ollama_service.rewrite(
            request.text,
            request.model,
            request.target_lang
        )
        result["task_id"] = task_id
        return result
    finally:
        # Clean up task tracking
        if task_id in active_tasks:
            del active_tasks[task_id]


@app.post("/rewrite/file", tags=["Rewriting"])
async def rewrite_file(
    file: UploadFile = File(..., description="File to rewrite (.docx, .pdf, .txt, .html)"),
    model: str = Form("llama3", description="Ollama model to use"),
    target_lang: str = Form("English", description="Target language for rewriting"),
    timeout: int = Form(300, description="Timeout in seconds (60-7200, default: 300)")
):
    """
    Rewrite a file to improve clarity and professionalism
    
    Supported formats: DOCX, PDF, TXT, HTML
    Configurable timeout: 60s to 7200s (2 hours)
    """
    try:
        # Parse file
        text = await file_parser.parse_file(file)
        
        # Rewrite with timeout
        result = await ollama_service.rewrite(
            text,
            model,
            target_lang,
            timeout=timeout
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static files at the root
# This must be done after all other routes to ensure API endpoints take precedence
# Assuming frontend is at ../frontend relative to this file
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

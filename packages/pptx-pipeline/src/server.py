"""FastAPI server for PPTX processing pipeline."""

import os
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .extract import extract_slide_data
from .convert import convert_pptx_to_pdf
from .rasterize import rasterize_pdf_to_images
from .parse_text import extract_text_content

app = FastAPI(
    title="PPTX Pipeline Service",
    description="Processes PPTX files into slide images and metadata",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "./output"))

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class ProcessedSlide(BaseModel):
    index: int
    image_path: str
    text_content: str
    speaker_notes: str
    shapes: list[dict]


class ProcessResult(BaseModel):
    presentation_id: str
    title: str
    slide_count: int
    slides: list[ProcessedSlide]


class TextExtractResult(BaseModel):
    slides: list[dict[str, str]]


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pptx-pipeline"}


@app.post("/process", response_model=ProcessResult)
async def process_pptx(file: UploadFile = File(...)):
    """Process a PPTX file: extract metadata, convert to images."""
    if not file.filename or not file.filename.endswith((".pptx", ".ppt")):
        raise HTTPException(status_code=400, detail="File must be a .pptx or .ppt file")

    presentation_id = str(uuid.uuid4())
    upload_path = UPLOAD_DIR / f"{presentation_id}.pptx"
    output_path = OUTPUT_DIR / presentation_id

    output_path.mkdir(parents=True, exist_ok=True)

    # Save uploaded file
    content = await file.read()
    upload_path.write_bytes(content)

    try:
        # Step 1: Extract slide data using python-pptx
        slide_data = extract_slide_data(upload_path)

        # Step 2: Convert PPTX to PDF via LibreOffice
        pdf_path = convert_pptx_to_pdf(upload_path, output_path)

        # Step 3: Rasterize PDF pages to PNG images
        image_paths = rasterize_pdf_to_images(pdf_path, output_path)

        # Build result
        slides = []
        for i, data in enumerate(slide_data):
            image_path = image_paths[i] if i < len(image_paths) else ""
            slides.append(
                ProcessedSlide(
                    index=i,
                    image_path=str(image_path),
                    text_content=data.get("text", ""),
                    speaker_notes=data.get("notes", ""),
                    shapes=data.get("shapes", []),
                )
            )

        title = slide_data[0].get("title", file.filename or "Untitled") if slide_data else "Untitled"

        return ProcessResult(
            presentation_id=presentation_id,
            title=title,
            slide_count=len(slides),
            slides=slides,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@app.post("/extract-text", response_model=TextExtractResult)
async def extract_text(file: UploadFile = File(...)):
    """Extract text content from PPTX for AI processing."""
    if not file.filename or not file.filename.endswith((".pptx", ".ppt")):
        raise HTTPException(status_code=400, detail="File must be a .pptx or .ppt file")

    temp_id = str(uuid.uuid4())
    temp_path = UPLOAD_DIR / f"{temp_id}_temp.pptx"

    content = await file.read()
    temp_path.write_bytes(content)

    try:
        result = extract_text_content(temp_path)
        return TextExtractResult(slides=result)
    finally:
        temp_path.unlink(missing_ok=True)

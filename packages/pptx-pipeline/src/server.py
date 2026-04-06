"""FastAPI server for PPTX processing pipeline."""

import os
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .extract import extract_slide_data
from .convert import convert_pptx_to_pdf
from .rasterize import rasterize_pdf_to_images
from .parse_text import extract_text_content

app = FastAPI(
    title="PPTX Pipeline Service",
    description="Processes PPTX files into slide images and metadata",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/uploads"))
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "/tmp/output"))
GCS_BUCKET = os.getenv("GCS_BUCKET", "")
GCP_PROJECT = os.getenv("GCP_PROJECT", "")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class ProcessedSlide(BaseModel):
    index: int
    imagePath: str
    textContent: str
    speakerNotes: str
    shapes: list[dict]


class ProcessResult(BaseModel):
    presentationId: str
    title: str
    slideCount: int
    slides: list[ProcessedSlide]


class TextExtractResult(BaseModel):
    slides: list[dict[str, str]]


def upload_to_gcs(local_path: Path, bucket: str, gcs_path: str) -> str:
    """Upload a local file to GCS and return the public URL."""
    from google.cloud import storage as gcs
    client = gcs.Client(project=GCP_PROJECT)
    blob = client.bucket(bucket).blob(gcs_path)
    blob.upload_from_filename(str(local_path), content_type="image/png")
    blob.make_public()
    return blob.public_url


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pptx-pipeline"}


@app.post("/process", response_model=ProcessResult)
async def process_pptx(
    file: UploadFile = File(...),
    presentation_id: str = Form(default=""),
    gcs_bucket: str = Form(default=""),
    gcs_prefix: str = Form(default=""),
):
    """Process a PPTX file: extract metadata, convert to images, optionally upload to GCS."""
    if not file.filename or not file.filename.endswith((".pptx", ".ppt")):
        raise HTTPException(status_code=400, detail="File must be a .pptx or .ppt file")

    pres_id = presentation_id or str(uuid.uuid4())
    upload_path = UPLOAD_DIR / f"{pres_id}.pptx"
    output_path = OUTPUT_DIR / pres_id
    output_path.mkdir(parents=True, exist_ok=True)

    content = await file.read()
    upload_path.write_bytes(content)

    # Determine if we should upload images to GCS
    use_gcs = bool(gcs_bucket or GCS_BUCKET)
    effective_bucket = gcs_bucket or GCS_BUCKET
    effective_prefix = gcs_prefix or f"slides/{pres_id}"

    try:
        # Step 1: Extract slide metadata via python-pptx
        slide_data = extract_slide_data(upload_path)

        # Step 2: Convert PPTX → PDF via LibreOffice
        pdf_path = convert_pptx_to_pdf(upload_path, output_path)

        # Step 3: Rasterize PDF → PNG images
        image_paths = rasterize_pdf_to_images(pdf_path, output_path)

        slides = []
        for i, data in enumerate(slide_data):
            local_img = image_paths[i] if i < len(image_paths) else None

            if local_img and use_gcs:
                gcs_path = f"{effective_prefix}/slide-{i:03d}.png"
                try:
                    image_url = upload_to_gcs(Path(local_img), effective_bucket, gcs_path)
                except Exception as e:
                    print(f"GCS upload failed for slide {i}: {e}")
                    image_url = str(local_img)
            else:
                image_url = str(local_img) if local_img else ""

            slides.append(
                ProcessedSlide(
                    index=i,
                    imagePath=image_url,
                    textContent=data.get("text", ""),
                    speakerNotes=data.get("notes", ""),
                    shapes=data.get("shapes", []),
                )
            )

        title = (
            slide_data[0].get("title", file.filename or "Untitled")
            if slide_data
            else "Untitled"
        )

        return ProcessResult(
            presentationId=pres_id,
            title=title,
            slideCount=len(slides),
            slides=slides,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        upload_path.unlink(missing_ok=True)


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

"""
Pipeline upload router.

Single entry point for all document types:
  POST /pipeline/upload
    - file:          PDF file (multipart)
    - document_type: one of ALLOWED_TYPES
    - department:    Greek department name (optional, defaults to Τμήμα Πληροφορικής)
"""

import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from loguru import logger

from pipeline.pdf_to_images import pdf_to_images
from pipeline.gemini_client import extract_from_images
from pipeline.validator import validate_output
from pipeline.dispatcher import SCHEMA_REGISTRY, ALLOWED_TYPES
from db.pg_client import get_pool

router = APIRouter()


@router.get("/types")
async def list_document_types():
    """Returns all supported document types and their descriptions."""
    return {
        "types": [
            {"id": k, "description": v["description"]}
            for k, v in SCHEMA_REGISTRY.items()
        ]
    }


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(..., description="PDF file to parse"),
    document_type: str = Form(..., description=f"Document type. One of: {ALLOWED_TYPES}"),
    department: str = Form(default="Τμήμα Πληροφορικής", description="Greek department name"),
):
    """
    Full pipeline: PDF → images → Gemini extraction → validation → DB write.
    """
    # ── Guard: document type ───────────────────────────────────────────────
    if document_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown document_type '{document_type}'. Allowed: {ALLOWED_TYPES}",
        )

    # ── Guard: file type ───────────────────────────────────────────────────
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    logger.info(f"Pipeline started | type={document_type} | file={file.filename} | dept={department}")

    schema_def = SCHEMA_REGISTRY[document_type]

    # ── Step 1: Read PDF bytes ─────────────────────────────────────────────
    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── Step 2: PDF → images ───────────────────────────────────────────────
    try:
        images = pdf_to_images(pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"PDF processing failed: {e}")

    logger.info(f"PDF rendered to {len(images)} page image(s)")

    # ── Step 3: Build prompt ───────────────────────────────────────────────
    prompt = schema_def["prompt_builder"](department=department)

    # ── Step 4: Gemini extraction ──────────────────────────────────────────
    try:
        raw_data = await extract_from_images(
            images=images,
            prompt=prompt,
            gemini_schema=schema_def["gemini_schema"],
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=f"Gemini extraction failed: {e}")

    logger.info(f"Gemini extraction complete")

    # ── Step 5: Pydantic validation ────────────────────────────────────────
    validated = validate_output(raw_data, schema_def["pydantic_model"])

    # ── Step 6: Write to PostgreSQL ────────────────────────────────────────
    pool = await get_pool()
    try:
        rows_written = await schema_def["db_writer"](validated, pool)
    except Exception as e:
        logger.exception(f"DB write failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database write failed: {e}")

    logger.info(f"Pipeline complete | rows_written={rows_written} | type={document_type}")

    return {
        "success": True,
        "document_type": document_type,
        "file": file.filename,
        "pages_processed": len(images),
        "rows_written": rows_written,
        "preview": json.loads(validated.model_dump_json()),
    }

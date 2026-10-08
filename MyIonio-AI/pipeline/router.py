"""
Pipeline upload router.

Single entry point for all document types:
  POST /pipeline/upload
    - file:          PDF file (multipart)
    - document_type: one of ALLOWED_TYPES
    - department:    Greek department name (optional, defaults to Τμήμα Πληροφορικής)
"""

import json
import asyncio
from pydantic import BaseModel, HttpUrl
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from loguru import logger

from pipeline.pdf_to_images import pdf_to_images
from pipeline.gemini_client import extract_from_images, is_gemini_configured
from pipeline.validator import validate_output
from pipeline.dispatcher import SCHEMA_REGISTRY, ALLOWED_TYPES
from db.pg_client import get_pool
from pipeline.official_schedule_source import (
    OFFICIAL_SCHEDULE_PAGE,
    OfficialSourceError,
    discover_official_schedules,
    fetch_official_pdf,
    imported_hashes,
    official_pdf_identity,
    record_import,
)

router = APIRouter()


class OfficialImportRequest(BaseModel):
    source_url: HttpUrl
    expected_sha256: str | None = None


async def process_document_bytes(
    *, pdf_bytes: bytes, filename: str, document_type: str, department: str
) -> dict:
    """Run the shared PDF → Gemini → validation → PostgreSQL pipeline."""
    if document_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown document_type '{document_type}'. Allowed: {ALLOWED_TYPES}")
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(status_code=422, detail="File content is not a valid PDF.")
    if not is_gemini_configured():
        raise HTTPException(status_code=503, detail="AI parser is not configured yet. Set GEMINI_API_KEY and restart ai-service.")

    logger.info("Pipeline started | type={} | file={} | dept={}", document_type, filename, department)
    schema_def = SCHEMA_REGISTRY[document_type]
    try:
        images = pdf_to_images(pdf_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"PDF processing failed: {exc}") from exc

    prompt = schema_def["prompt_builder"](department=department)
    try:
        raw_data = await extract_from_images(images=images, prompt=prompt, gemini_schema=schema_def["gemini_schema"])
    except Exception as exc:
        logger.error("AI extraction failed ({})", type(exc).__name__)
        raise HTTPException(status_code=502, detail="AI extraction failed. Check provider quota and billing.") from exc

    validated = validate_output(raw_data, schema_def["pydantic_model"])
    pool = await get_pool()
    try:
        rows_written = await schema_def["db_writer"](validated, pool)
    except Exception as exc:
        logger.exception("DB write failed: {}", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Database write failed.") from exc

    return {
        "success": True,
        "document_type": document_type,
        "file": filename,
        "pages_processed": len(images),
        "rows_written": rows_written,
        "preview": json.loads(validated.model_dump_json()),
    }


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

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    return await process_document_bytes(
        pdf_bytes=pdf_bytes,
        filename=file.filename,
        document_type=document_type,
        department=department,
    )


@router.get("/official/schedules")
async def list_official_schedules():
    """Discover current official PDFs, calculate hashes and mark imported versions."""
    try:
        documents = await discover_official_schedules()
        pool = await get_pool()
        known = await imported_hashes(pool)
        downloads = await asyncio.gather(*(fetch_official_pdf(document.url) for document in documents))
        response = []
        for document, (pdf_bytes, digest) in zip(documents, downloads):
            response.append({
                **document.as_dict(),
                "size_bytes": len(pdf_bytes),
                "sha256": digest,
                "already_imported": (document.url, digest) in known,
            })
        return {"source_page": OFFICIAL_SCHEDULE_PAGE, "documents": response}
    except OfficialSourceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/official/import")
async def import_official_schedule(request: OfficialImportRequest):
    """Import one currently published official timetable through the shared pipeline."""
    try:
        documents = await discover_official_schedules()
        requested_identity = official_pdf_identity(str(request.source_url))
        document = next(
            (item for item in documents if official_pdf_identity(item.url) == requested_identity),
            None,
        )
        if document is None:
            raise HTTPException(status_code=409, detail="This PDF is no longer listed on the official schedule page.")
        pdf_bytes, digest = await fetch_official_pdf(document.url)
    except OfficialSourceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if request.expected_sha256 and request.expected_sha256.lower() != digest:
        raise HTTPException(status_code=409, detail="The official PDF changed since discovery. Refresh before importing.")

    pool = await get_pool()
    if (document.url, digest) in await imported_hashes(pool):
        return {"success": True, "skipped": True, "rows_written": 0, "sha256": digest, "source": document.as_dict()}

    result = await process_document_bytes(
        pdf_bytes=pdf_bytes,
        filename=document.filename,
        document_type=document.document_type,
        department="Τμήμα Πληροφορικής",
    )
    await record_import(pool, document, digest)
    return {**result, "skipped": False, "sha256": digest, "source": document.as_dict()}

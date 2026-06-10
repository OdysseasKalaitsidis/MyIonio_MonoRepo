"""
Gemini client for image-based structured extraction.

Uploads all page images to the Gemini Files API, calls the model
with a document-type-specific prompt and JSON schema, then cleans
up the uploaded files.

Using gemini-2.0-flash for best speed/cost ratio on structured extraction.
"""

import io
import json
import os
import asyncio
from loguru import logger
from google import genai
from google.genai import types

MODEL = "gemini-2.0-flash"


def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set.")
    return genai.Client(api_key=api_key)


async def extract_from_images(
    images: list[bytes],
    prompt: str,
    gemini_schema: types.Schema,
    model: str = MODEL,
) -> dict:
    """
    Upload page images to Gemini and extract structured JSON.

    Args:
        images:        List of PNG image bytes (one per PDF page).
        prompt:        Document-type-specific extraction prompt.
        gemini_schema: Gemini types.Schema for structured output.
        model:         Gemini model ID.

    Returns:
        Parsed dict from Gemini's JSON response.

    Raises:
        RuntimeError: If Gemini returns empty or invalid JSON.
    """
    loop = asyncio.get_event_loop()

    # Run the synchronous Gemini SDK calls in a thread pool so we don't
    # block the asyncio event loop.
    return await loop.run_in_executor(
        None,
        _extract_sync,
        images,
        prompt,
        gemini_schema,
        model,
    )


def _extract_sync(
    images: list[bytes],
    prompt: str,
    gemini_schema: types.Schema,
    model: str,
) -> dict:
    """Synchronous implementation — called from thread pool executor."""
    client = _get_client()
    uploaded_files = []

    try:
        # ── 1. Upload each page image ──────────────────────────────────────
        for i, img_bytes in enumerate(images):
            logger.info(f"Uploading page {i + 1}/{len(images)} to Gemini Files API...")
            uploaded = client.files.upload(
                file=io.BytesIO(img_bytes),
                config=types.UploadFileConfig(
                    mime_type="image/png",
                    display_name=f"page_{i + 1}",
                ),
            )
            uploaded_files.append(uploaded)
            logger.debug(f"Uploaded: {uploaded.name}")

        # ── 2. Build content: all images + prompt ──────────────────────────
        contents = [*uploaded_files, prompt]

        # ── 3. Call Gemini with structured output ──────────────────────────
        logger.info(f"Calling {model} with {len(images)} image(s)...")
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=gemini_schema,
                temperature=0.0,
            ),
        )

        raw_text = response.text
        if not raw_text or not raw_text.strip():
            raise RuntimeError("Gemini returned an empty response.")

        logger.info(f"Gemini response received ({len(raw_text)} chars)")
        result = json.loads(raw_text)
        return result

    except json.JSONDecodeError as e:
        raise RuntimeError(f"Gemini returned non-JSON response: {e}") from e
    except Exception as e:
        logger.exception(f"Gemini extraction failed: {e}")
        raise
    finally:
        # ── 4. Always clean up uploaded files ─────────────────────────────
        for f in uploaded_files:
            try:
                client.files.delete(name=f.name)
                logger.debug(f"Deleted remote file: {f.name}")
            except Exception as cleanup_err:
                logger.warning(f"Could not delete {f.name}: {cleanup_err}")

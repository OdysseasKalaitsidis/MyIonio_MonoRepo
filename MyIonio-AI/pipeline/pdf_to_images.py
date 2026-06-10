"""
PDF to images converter.

Converts every page of a PDF into a PNG image in memory (no disk I/O).
Uses pymupdf (fitz) which is already in requirements.txt.
"""

import fitz  # pymupdf
from loguru import logger


def pdf_to_images(pdf_bytes: bytes, dpi: int = 200) -> list[bytes]:
    """
    Convert each page of a PDF to a PNG image.

    Args:
        pdf_bytes: Raw PDF file bytes.
        dpi: Render resolution. 200 DPI gives good quality for Gemini
             while keeping image sizes manageable (~500KB per page).

    Returns:
        List of PNG image bytes, one per page.

    Raises:
        ValueError: If the PDF cannot be opened or has no pages.
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise ValueError(f"Cannot open PDF: {e}") from e

    if len(doc) == 0:
        raise ValueError("PDF has no pages.")

    scale = dpi / 72.0  # fitz native resolution is 72 DPI
    mat = fitz.Matrix(scale, scale)

    images: list[bytes] = []
    for page_num, page in enumerate(doc):
        try:
            pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
            images.append(pix.tobytes("png"))
            logger.debug(f"Rendered page {page_num + 1}/{len(doc)} ({pix.width}x{pix.height}px)")
        except Exception as e:
            logger.warning(f"Failed to render page {page_num + 1}: {e}")

    doc.close()

    if not images:
        raise ValueError("No pages could be rendered from the PDF.")

    logger.info(f"PDF rendered: {len(images)} page(s) at {dpi} DPI")
    return images

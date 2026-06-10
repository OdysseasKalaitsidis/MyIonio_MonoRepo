"""
Pydantic validation wrapper for Gemini output.

Converts raw dicts from Gemini into validated Python models,
catching and re-raising with useful error messages.
"""

from pydantic import BaseModel, ValidationError
from loguru import logger
from fastapi import HTTPException


def validate_output(raw_data: dict, model_class: type[BaseModel]) -> BaseModel:
    """
    Validate raw Gemini output against a Pydantic model.

    Args:
        raw_data:    Dict parsed from Gemini JSON response.
        model_class: Pydantic model class to validate against.

    Returns:
        Validated Pydantic model instance.

    Raises:
        HTTPException 422: If validation fails (bad AI output).
    """
    try:
        validated = model_class.model_validate(raw_data)
        logger.info(
            f"Validation passed: {model_class.__name__} "
            f"({_count_items(validated)} items)"
        )
        return validated
    except ValidationError as e:
        error_details = e.errors()
        logger.error(f"Pydantic validation failed for {model_class.__name__}: {error_details}")
        raise HTTPException(
            status_code=422,
            detail={
                "error": "AI extraction output failed validation",
                "model": model_class.__name__,
                "issues": error_details,
                "raw_preview": str(raw_data)[:500],
            },
        )


def _count_items(obj: BaseModel) -> int:
    """Best-effort count of the main list field for logging."""
    for field_name in ("exams", "courses"):
        val = getattr(obj, field_name, None)
        if isinstance(val, list):
            return len(val)
    return 0

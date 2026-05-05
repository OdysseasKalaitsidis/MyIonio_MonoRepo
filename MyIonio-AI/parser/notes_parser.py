import os
import json
from google import genai
from google.genai import types
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_ID = "gemini-2.0-flash"

def summarise_pdf_note(pdf_path: str) -> str:
    """
    Summarise a university course note PDF using Gemini 2.0.
    Produces exactly 3 sentences.
    """
    if not API_KEY:
        logger.error("GEMINI_API_KEY is missing from environment variables.")
        return "Summary unavailable: API key missing."

    try:
        client = genai.Client(api_key=API_KEY)
        
        logger.info(f"Uploading note {pdf_path} to Gemini for summarisation...")
        uploaded_file = client.files.upload(file=pdf_path)
        
        prompt = (
            "You are an academic assistant. Summarise this university course note in exactly 3 sentences. "
            "Focus on the core concepts, the main topic, and the intended learning outcome. "
            "Be concise and professional. Respond in the same language as the notes (usually Greek or English)."
        )

        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[uploaded_file, prompt],
            config=types.GenerateContentConfig(
                temperature=0.2,
                top_p=0.9
            )
        )

        summary = response.text.strip()
        
        # Cleanup
        client.files.delete(name=uploaded_file.name)
        
        return summary

    except Exception as e:
        logger.exception(f"Error summarising note with Gemini: {e}")
        return f"Summary unavailable: Error during processing ({str(e)})."

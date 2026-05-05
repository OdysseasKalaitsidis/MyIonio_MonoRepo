import asyncio
import json
import os
import tempfile
import httpx
from loguru import logger
from confluent_kafka import Consumer, Producer, KafkaError, KafkaException

from parser.notes_parser import summarise_pdf_note

# Topics
INPUT_TOPIC = "note-uploaded"
OUTPUT_TOPIC = "note-summarized"
GROUP_ID = "myionio-ai-notes-group"

def _build_consumer() -> Consumer:
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    config = {
        "bootstrap.servers": bootstrap_servers,
        "group.id": GROUP_ID,
        "auto.offset.reset": "earliest",
        "enable.auto.commit": False,
    }
    return Consumer(config)

def _build_producer() -> Producer:
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    return Producer({"bootstrap.servers": bootstrap_servers})

async def run_notes_consumer() -> None:
    """
    Async Kafka consumer for student notes.
    1. Consumes 'note-uploaded'
    2. Downloads PDF from Backend API
    3. Summarises with Gemini
    4. Produces 'note-summarized' back to Backend
    """
    consumer = _build_consumer()
    producer = _build_producer()
    backend_url = os.getenv("BACKEND_URL", "http://localhost:5000")
    
    consumer.subscribe([INPUT_TOPIC])
    logger.info(f"Notes Kafka consumer started. Subscribed to {INPUT_TOPIC}")

    loop = asyncio.get_event_loop()

    try:
        while True:
            msg = await loop.run_in_executor(None, lambda: consumer.poll(timeout=1.0))
            if msg is None: continue
            if msg.error():
                if msg.error().code() != KafkaError._PARTITION_EOF:
                    logger.error(f"Kafka error: {msg.error()}")
                continue

            # --- Processing ---
            try:
                payload = json.loads(msg.value().decode("utf-8"))
                note_id = payload.get("noteId")
                course_name = payload.get("courseName")
                
                logger.info(f"Processing note {note_id} for course {course_name}...")

                # 1. Download file from backend
                file_url = f"{backend_url}/api/notes/{note_id}/file"
                async with httpx.AsyncClient() as client:
                    response = await client.get(file_url)
                    if response.status_code != 200:
                        raise Exception(f"Failed to download file: HTTP {response.status_code}")
                    
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                        tmp.write(response.content)
                        tmp_path = tmp.name

                # 2. Summarise with Gemini
                summary = summarise_pdf_note(tmp_path)
                
                # Cleanup temp file
                os.unlink(tmp_path)

                # 3. Publish result
                result_payload = {
                    "noteId": note_id,
                    "summary": summary,
                    "success": True
                }
                
                producer.produce(
                    OUTPUT_TOPIC, 
                    json.dumps(result_payload).encode("utf-8"),
                    callback=lambda err, msg: logger.info(f"Published result for {note_id}") if err is None else logger.error(f"Publish failed: {err}")
                )
                producer.flush()

                # Commit Kafka offset
                consumer.commit(message=msg)
                logger.info(f"Successfully processed and committed note {note_id}")

            except Exception as e:
                logger.exception(f"Failed to process note event")
                # Publish failure
                failure_payload = {
                    "noteId": payload.get("noteId") if 'payload' in locals() else "unknown",
                    "success": False,
                    "errorMessage": str(e)
                }
                producer.produce(OUTPUT_TOPIC, json.dumps(failure_payload).encode("utf-8"))
                producer.flush()
                consumer.commit(message=msg)

    except asyncio.CancelledError:
        logger.info("Notes consumer task cancelled.")
    finally:
        consumer.close()

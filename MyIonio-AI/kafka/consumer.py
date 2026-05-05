"""
Kafka consumer for the MyIonio AI Service.

Subscribes to the `course-review-submitted` topic and runs sentiment
analysis on every incoming review comment.

Architecture notes (interview talking points):
  - Consumer group `myionio-ai-group`: if multiple AI service replicas
    are running in Kubernetes, Kafka automatically distributes topic
    partitions across them — horizontal scaling out of the box.
  - auto.offset.reset = earliest: on a fresh deployment the consumer
    reads all existing messages. Change to 'latest' in production if
    you only care about new reviews.
  - enable.auto.commit = false + manual commit: we commit the offset
    ONLY after successfully processing the message. If the AI service
    crashes mid-processing, Kafka replays the message on restart —
    at-least-once delivery guarantee.
"""

import asyncio
import json
import os

from loguru import logger
from confluent_kafka import Consumer, KafkaError, KafkaException

from kafka.sentiment import analyse

TOPIC = "course-review-submitted"
GROUP_ID = "myionio-ai-group"


def _build_consumer() -> Consumer:
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    config = {
        "bootstrap.servers": bootstrap_servers,
        "group.id": GROUP_ID,
        # Read from the beginning if no committed offset exists
        "auto.offset.reset": "earliest",
        # Manual commit after successful processing (at-least-once delivery)
        "enable.auto.commit": False,
    }
    logger.info(f"Kafka consumer connecting to {bootstrap_servers} | group={GROUP_ID}")
    return Consumer(config)


async def run_consumer() -> None:
    """
    Long-running async loop that polls Kafka for new review events.
    Designed to be started as a background task in FastAPI's lifespan.
    """
    consumer = _build_consumer()
    consumer.subscribe([TOPIC])
    logger.info(f"Subscribed to Kafka topic: {TOPIC}")

    loop = asyncio.get_event_loop()

    try:
        while True:
            # poll() is blocking, so we run it in a thread-pool executor
            # to avoid blocking the asyncio event loop
            msg = await loop.run_in_executor(None, lambda: consumer.poll(timeout=1.0))

            if msg is None:
                # No message within the poll timeout — keep looping
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    # End of partition — not an error, just no new messages
                    logger.debug(
                        f"Reached end of partition {msg.partition()} for topic {msg.topic()}"
                    )
                else:
                    raise KafkaException(msg.error())
                continue

            # ── Process the message ───────────────────────────────────────
            try:
                payload = json.loads(msg.value().decode("utf-8"))
                review_id = payload.get("reviewId", "unknown")
                course_name = payload.get("courseName", "unknown")
                rating = payload.get("rating", 0)
                comment = payload.get("comment")

                sentiment = analyse(comment)

                logger.info(
                    f"[Kafka] Review processed | "
                    f"review_id={review_id} | "
                    f"course={course_name} | "
                    f"rating={rating}/5 | "
                    f"sentiment={sentiment['label']} (score={sentiment['score']}) | "
                    f"reason={sentiment['reason']}"
                )

                # Commit offset only after successful processing
                consumer.commit(message=msg)

            except (json.JSONDecodeError, KeyError) as parse_err:
                logger.error(f"Failed to parse Kafka message: {parse_err} | raw: {msg.value()}")
                # Still commit to avoid re-processing a permanently malformed message
                consumer.commit(message=msg)

    except asyncio.CancelledError:
        logger.info("Kafka consumer task cancelled — shutting down gracefully.")
    finally:
        consumer.close()
        logger.info("Kafka consumer closed.")

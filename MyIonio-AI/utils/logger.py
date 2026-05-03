from loguru import logger
import sys

def configure_logging():
    logger.remove()
    logger.add(sys.stdout, level="INFO")

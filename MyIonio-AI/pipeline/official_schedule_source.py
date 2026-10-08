"""Safe discovery and download of official Ionian University timetable PDFs."""

from __future__ import annotations

import asyncio
import hashlib
import re
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import PurePosixPath
from typing import Any
from urllib.parse import parse_qs, urljoin, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener


OFFICIAL_SCHEDULE_PAGE = "https://di.ionio.gr/gr/students/schedule/"
MAX_PAGE_BYTES = 2 * 1024 * 1024
MAX_PDF_BYTES = 15 * 1024 * 1024
USER_AGENT = "MyIonio-Admin/1.0 (+https://di.ionio.gr/)"

SEMESTER_IDS = {"Α": 1, "Γ": 3, "Ε": 5, "Ζ": 7}


class OfficialSourceError(RuntimeError):
    pass


@dataclass(frozen=True)
class OfficialScheduleDocument:
    title: str
    semester: str
    semester_id: int
    academic_year: str
    published_date: str | None
    url: str
    filename: str
    document_type: str

    def as_dict(self) -> dict:
        return asdict(self)


class _AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._href: str | None = None
        self._text: list[str] = []
        self.anchors: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        self._href = dict(attrs).get("href")
        self._text = []

    def handle_data(self, data: str) -> None:
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, " ".join(self._text)))
            self._href = None
            self._text = []


def _validate_url(url: str, *, pdf: bool) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.username or parsed.password:
        raise OfficialSourceError("Only HTTPS official-source URLs are allowed.")

    hostname = (parsed.hostname or "").lower()
    if pdf:
        if hostname not in {"ionio.gr", "www.ionio.gr"} or parsed.path != "/download.php":
            raise OfficialSourceError("PDF URL is outside the official Ionian University download endpoint.")
        values = parse_qs(parsed.query).get("f", [])
        if len(values) != 1 or not values[0].lower().endswith(".pdf") or ".." in values[0]:
            raise OfficialSourceError("Official PDF URL has an invalid file parameter.")
    elif hostname != "di.ionio.gr" or parsed.path.rstrip("/") != "/gr/students/schedule":
        raise OfficialSourceError("Schedule page URL is not the configured official source.")


def official_pdf_identity(url: str) -> str:
    """Return the canonical `f` value after enforcing the official URL allowlist."""
    _validate_url(url, pdf=True)
    return parse_qs(urlparse(url).query)["f"][0]


class _SafeRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001
        _validate_url(newurl, pdf="download.php" in newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def _fetch_sync(url: str, *, max_bytes: int, pdf: bool) -> bytes:
    _validate_url(url, pdf=pdf)
    opener = build_opener(_SafeRedirectHandler())
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/pdf,*/*" if pdf else "text/html,*/*"})
    try:
        with opener.open(request, timeout=30) as response:
            _validate_url(response.geturl(), pdf=pdf)
            payload = response.read(max_bytes + 1)
    except OfficialSourceError:
        raise
    except Exception as exc:
        raise OfficialSourceError(f"Official source request failed: {type(exc).__name__}") from exc

    if len(payload) > max_bytes:
        raise OfficialSourceError("Official source response exceeded the allowed size.")
    if pdf and not payload.startswith(b"%PDF-"):
        raise OfficialSourceError("Downloaded file is not a valid PDF.")
    return payload


async def fetch_official_pdf(url: str) -> tuple[bytes, str]:
    payload = await asyncio.to_thread(_fetch_sync, url, max_bytes=MAX_PDF_BYTES, pdf=True)
    return payload, hashlib.sha256(payload).hexdigest()


def parse_schedule_page(html: str, base_url: str = OFFICIAL_SCHEDULE_PAGE) -> list[OfficialScheduleDocument]:
    parser = _AnchorParser()
    parser.feed(html)
    documents: list[OfficialScheduleDocument] = []
    pattern = re.compile(
        r"Ωρολόγιο\s+Πρόγραμμα\s+(Α|Γ|Ε|Ζ)\s+Εξαμήνου.*?(\d{4})\s*[-–]\s*(\d{4})",
        re.IGNORECASE,
    )

    for href, raw_title in parser.anchors:
        title = re.sub(r"\s+", " ", raw_title).strip()
        match = pattern.search(title)
        if not match:
            continue
        semester, year_start, year_end = match.groups()
        date_match = re.search(r"\[(\d{2}\.\d{2}\.\d{4})\]", title)
        published_date = date_match.group(1) if date_match else None
        url = urljoin(base_url, href)
        _validate_url(url, pdf=True)
        file_param = official_pdf_identity(url)
        semester_id = SEMESTER_IDS[semester.upper()]
        documents.append(
            OfficialScheduleDocument(
                title=title,
                semester=semester.upper(),
                semester_id=semester_id,
                academic_year=f"{year_start}-{year_end}",
                published_date=published_date,
                url=url,
                filename=PurePosixPath(file_param).name,
                document_type="class_schedule_simple" if semester_id <= 5 else "class_schedule_split",
            )
        )

    return sorted(documents, key=lambda document: document.semester_id)


async def discover_official_schedules() -> list[OfficialScheduleDocument]:
    payload = await asyncio.to_thread(
        _fetch_sync,
        OFFICIAL_SCHEDULE_PAGE,
        max_bytes=MAX_PAGE_BYTES,
        pdf=False,
    )
    documents = parse_schedule_page(payload.decode("utf-8", errors="replace"))
    if not documents:
        raise OfficialSourceError("No timetable PDFs were found on the official page.")
    return documents


async def ensure_import_table(pool: Any) -> None:
    async with pool.acquire() as connection:
        await connection.execute(
            """
            CREATE TABLE IF NOT EXISTS official_document_imports (
                id BIGSERIAL PRIMARY KEY,
                source_url TEXT NOT NULL,
                content_sha256 CHAR(64) NOT NULL,
                document_type TEXT NOT NULL,
                semester_id INTEGER NOT NULL,
                academic_year TEXT NOT NULL,
                imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (source_url, content_sha256)
            )
            """
        )


async def imported_hashes(pool: Any) -> set[tuple[str, str]]:
    await ensure_import_table(pool)
    async with pool.acquire() as connection:
        rows = await connection.fetch("SELECT source_url, content_sha256 FROM official_document_imports")
    return {(row["source_url"], row["content_sha256"].strip()) for row in rows}


async def record_import(pool: Any, document: OfficialScheduleDocument, content_sha256: str) -> None:
    await ensure_import_table(pool)
    async with pool.acquire() as connection:
        await connection.execute(
            """
            INSERT INTO official_document_imports
                (source_url, content_sha256, document_type, semester_id, academic_year)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (source_url, content_sha256) DO NOTHING
            """,
            document.url,
            content_sha256,
            document.document_type,
            document.semester_id,
            document.academic_year,
        )

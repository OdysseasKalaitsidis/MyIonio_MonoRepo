"""Fail-closed authentication for the public AI administration surface."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from fastapi import Depends, HTTPException, Request, status


ADMIN_COOKIE_NAME = "myionio_admin_session"
SESSION_TTL_SECONDS = 8 * 60 * 60
PASSWORD_SCHEME = "scrypt"
PASSWORD_N = 2**15
PASSWORD_R = 8
PASSWORD_P = 1
PASSWORD_DKLEN = 32
MAX_SCRYPT_MEMORY = 128 * 1024 * 1024


def _b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def hash_admin_password(password: str, *, salt: bytes | None = None) -> str:
    """Return a portable scrypt password hash suitable for an environment secret."""
    if len(password) < 16:
        raise ValueError("Admin passwords must contain at least 16 characters.")
    password_salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"), salt=password_salt, n=PASSWORD_N, r=PASSWORD_R,
        p=PASSWORD_P, dklen=PASSWORD_DKLEN, maxmem=MAX_SCRYPT_MEMORY,
    )
    return "$".join((PASSWORD_SCHEME, str(PASSWORD_N), str(PASSWORD_R), str(PASSWORD_P),
                     _b64url_encode(password_salt), _b64url_encode(digest)))


def verify_admin_password(password: str, encoded_hash: str) -> bool:
    """Verify a password without leaking comparison timing."""
    try:
        scheme, n_raw, r_raw, p_raw, salt_raw, digest_raw = encoded_hash.split("$")
        if scheme != PASSWORD_SCHEME:
            return False
        n, r, p = int(n_raw), int(r_raw), int(p_raw)
        if n != PASSWORD_N or r != PASSWORD_R or p != PASSWORD_P:
            return False
        expected = _b64url_decode(digest_raw)
        candidate = hashlib.scrypt(
            password.encode("utf-8"), salt=_b64url_decode(salt_raw), n=n, r=r, p=p,
            dklen=len(expected), maxmem=MAX_SCRYPT_MEMORY,
        )
        return hmac.compare_digest(candidate, expected)
    except (ValueError, TypeError):
        return False


def _configured_password_hash() -> str:
    encoded = os.getenv("ADMIN_PASSWORD_HASH_B64", "").strip()
    if encoded:
        try:
            return base64.b64decode(encoded, validate=True).decode("utf-8")
        except (ValueError, UnicodeDecodeError):
            return ""
    return os.getenv("ADMIN_PASSWORD_HASH", "").strip()


@dataclass(frozen=True)
class AdminConfig:
    username: str
    password_hash: str
    session_secret: str
    secure_cookie: bool

    @property
    def ready(self) -> bool:
        return bool(self.username) and self.password_hash.startswith(f"{PASSWORD_SCHEME}$") and len(self.session_secret) >= 43


def get_admin_config() -> AdminConfig:
    environment = os.getenv("ENVIRONMENT", "development").strip().lower()
    return AdminConfig(
        username=os.getenv("ADMIN_USERNAME", "").strip(), password_hash=_configured_password_hash(),
        session_secret=os.getenv("ADMIN_SESSION_SECRET", "").strip(),
        secure_cookie=environment in {"production", "prod"},
    )


def ensure_admin_configured() -> AdminConfig:
    config = get_admin_config()
    if not config.ready:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Admin access is disabled until secure credentials are configured.")
    return config


def create_admin_session(config: AdminConfig, *, now: int | None = None) -> tuple[str, str]:
    issued_at = int(time.time() if now is None else now)
    csrf_token = secrets.token_urlsafe(32)
    payload = {"sub": config.username, "iat": issued_at, "exp": issued_at + SESSION_TTL_SECONDS,
               "csrf": csrf_token, "nonce": secrets.token_urlsafe(16)}
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    signature = hmac.new(config.session_secret.encode(), encoded_payload.encode("ascii"), hashlib.sha256).digest()
    return f"{encoded_payload}.{_b64url_encode(signature)}", csrf_token


def decode_admin_session(token: str, config: AdminConfig, *, now: int | None = None) -> dict[str, Any] | None:
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        expected_signature = hmac.new(config.session_secret.encode(), encoded_payload.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_decode(encoded_signature), expected_signature):
            return None
        payload = json.loads(_b64url_decode(encoded_payload))
        current_time = int(time.time() if now is None else now)
        if payload.get("sub") != config.username:
            return None
        if not isinstance(payload.get("iat"), int) or not isinstance(payload.get("exp"), int):
            return None
        if payload["iat"] > current_time + 60 or payload["exp"] <= current_time:
            return None
        if payload["exp"] - payload["iat"] != SESSION_TTL_SECONDS:
            return None
        if not isinstance(payload.get("csrf"), str) or len(payload["csrf"]) < 32:
            return None
        return payload
    except (ValueError, TypeError, KeyError, json.JSONDecodeError):
        return None


def session_from_request(request: Request) -> dict[str, Any] | None:
    config = get_admin_config()
    if not config.ready:
        return None
    token = request.cookies.get(ADMIN_COOKIE_NAME, "")
    return decode_admin_session(token, config) if token else None


async def require_admin_session(request: Request) -> dict[str, Any]:
    ensure_admin_configured()
    session = session_from_request(request)
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authentication required.",
                            headers={"Cache-Control": "no-store"})
    return session


async def require_admin_csrf(request: Request, session: dict[str, Any] = Depends(require_admin_session)) -> None:
    supplied = request.headers.get("x-csrf-token", "")
    if not supplied or not hmac.compare_digest(supplied, session["csrf"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid CSRF token.")


def request_has_allowed_origin(request: Request) -> bool:
    """Require browser state-changing requests to come from an explicitly allowed origin."""
    allowed = {origin.strip().rstrip("/").lower() for origin in os.getenv(
        "ADMIN_ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000"
    ).split(",") if origin.strip()}
    origin = request.headers.get("origin", "").strip().rstrip("/").lower()
    if origin:
        return origin in allowed
    referer = request.headers.get("referer", "").strip().lower()
    return any(referer == item or referer.startswith(f"{item}/") for item in allowed)


class LoginRateLimiter:
    """Small in-process limiter that makes online password guessing impractical."""

    def __init__(self, attempts: int = 5, window_seconds: int = 15 * 60):
        self.attempts = attempts
        self.window_seconds = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str, *, now: float | None = None) -> bool:
        current = time.monotonic() if now is None else now
        cutoff = current - self.window_seconds
        with self._lock:
            events = self._events[key]
            while events and events[0] <= cutoff:
                events.popleft()
            return len(events) < self.attempts

    def record_failure(self, key: str, *, now: float | None = None) -> None:
        with self._lock:
            self._events[key].append(time.monotonic() if now is None else now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._events.pop(key, None)


login_rate_limiter = LoginRateLimiter()


def render_login_page(*, invalid: bool = False, unavailable: bool = False) -> str:
    template = (Path(__file__).resolve().parents[1] / "admin" / "login.html").read_text(encoding="utf-8")
    if unavailable:
        message = "Η πρόσβαση διαχειριστή δεν έχει ρυθμιστεί ακόμη."
    elif invalid:
        message = "Λάθος στοιχεία ή προσωρινό κλείδωμα. Δοκίμασε ξανά αργότερα."
    else:
        message = ""
    return template.replace("{{ERROR_MESSAGE}}", message)


if __name__ == "__main__":
    import getpass
    import sys

    if len(sys.argv) != 2 or sys.argv[1] != "hash":
        raise SystemExit("Usage: python -m security.admin_auth hash")
    generated = hash_admin_password(getpass.getpass("New admin password (16+ characters): "))
    print(base64.b64encode(generated.encode("utf-8")).decode("ascii"))

import asyncio
import hmac
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from pipeline.router import router as pipeline_router
from db.pg_client import get_pool, close_pool
from utils.logger import configure_logging
from security.admin_auth import (
    ADMIN_COOKIE_NAME,
    SESSION_TTL_SECONDS,
    create_admin_session,
    ensure_admin_configured,
    get_admin_config,
    login_rate_limiter,
    render_login_page,
    request_has_allowed_origin,
    require_admin_csrf,
    require_admin_session,
    session_from_request,
    verify_admin_password,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.

    On startup:
      - Initialises the PostgreSQL connection pool
      - Opens the PostgreSQL connection pool

    On shutdown:
      - Closes database connections cleanly
      - Closes the PostgreSQL pool
    """
    # Warm up the PG pool so the first request isn't slow
    await get_pool()


    yield  # Application runs here


    await close_pool()


IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").strip().lower() in {"production", "prod"}
ADMIN_DIR = Path(__file__).resolve().parent / "admin"

app = FastAPI(
    title="MyIonio AI Service",
    lifespan=lifespan,
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip().rstrip("/") for origin in os.getenv("AI_ALLOWED_ORIGINS", "http://localhost:5173").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)


@app.middleware("http")
async def harden_responses(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
        "connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
    )
    if request.url.path.startswith(("/admin", "/pipeline", "/schedule", "/menu")):
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response

configure_logging()

# New unified document ingestion pipeline
app.include_router(
    pipeline_router,
    prefix="/pipeline",
    tags=["Pipeline"],
    dependencies=[Depends(require_admin_session)],
)


@app.get("/admin/login", response_class=HTMLResponse, include_in_schema=False)
async def admin_login_page(request: Request, error: str | None = None):
    if session_from_request(request):
        return RedirectResponse("/admin", status_code=303)
    config_ready = get_admin_config().ready
    return HTMLResponse(
        render_login_page(invalid=error == "invalid", unavailable=not config_ready),
        status_code=200 if config_ready else 503,
    )


@app.post("/admin/login", include_in_schema=False)
async def admin_login(request: Request):
    config = ensure_admin_configured()
    if not request_has_allowed_origin(request):
        return JSONResponse({"detail": "Invalid request origin."}, status_code=403)

    client_ip = request.client.host if request.client else "unknown"
    if not login_rate_limiter.allow(client_ip):
        return HTMLResponse(render_login_page(invalid=True), status_code=429, headers={"Retry-After": "900"})

    form = await request.form()
    username = str(form.get("username", ""))[:256]
    password = str(form.get("password", ""))[:1024]
    valid_username = hmac.compare_digest(username.encode("utf-8"), config.username.encode("utf-8"))
    valid_password = verify_admin_password(password, config.password_hash)
    if not (valid_username and valid_password):
        login_rate_limiter.record_failure(client_ip)
        await asyncio.sleep(0.35)
        return HTMLResponse(render_login_page(invalid=True), status_code=401)

    login_rate_limiter.reset(client_ip)
    token, _ = create_admin_session(config)
    response = RedirectResponse("/admin", status_code=303)
    response.set_cookie(
        ADMIN_COOKIE_NAME,
        token,
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        secure=config.secure_cookie,
        samesite="strict",
        path="/",
    )
    return response


@app.get("/admin", include_in_schema=False)
async def admin_page(request: Request):
    if session_from_request(request) is None:
        return RedirectResponse("/admin/login", status_code=303)
    return FileResponse(ADMIN_DIR / "index.html", media_type="text/html")


@app.get("/admin/assets/{filename}", include_in_schema=False)
async def admin_asset(filename: str):
    if filename not in {"admin.css", "admin.js"}:
        return JSONResponse({"detail": "Not found."}, status_code=404)
    media_type = "text/css" if filename.endswith(".css") else "application/javascript"
    return FileResponse(ADMIN_DIR / filename, media_type=media_type)


@app.get("/admin/session", include_in_schema=False)
async def admin_session(session=Depends(require_admin_session)):
    return {"username": session["sub"], "csrf_token": session["csrf"], "expires_at": session["exp"]}


@app.post("/admin/logout", include_in_schema=False, dependencies=[Depends(require_admin_csrf)])
async def admin_logout():
    response = RedirectResponse("/admin/login", status_code=303)
    response.delete_cookie(
        ADMIN_COOKIE_NAME, path="/", secure=get_admin_config().secure_cookie, samesite="strict"
    )
    return response



@app.get("/")
def root():
    return {"status": "ok"}

# backend/main.py
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# CORS (loosen for dev; tighten for prod as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ---- API routes (must come before SPA fallback) ----
@app.get("/api/ping")
async def ping():
    return {"message": "pong"}

@app.get("/healthz")
async def healthz():
    return {"ok": True}

# ---- Static / SPA fallback ----
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
INDEX_FILE = os.path.join(STATIC_DIR, "index.html")

if not os.path.isfile(INDEX_FILE):
    print(f"⚠️  {INDEX_FILE} is missing. Build your frontend and copy to backend/static.")

# 1) Serve Vite assets exactly where index.html expects them: /assets/*
app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets"), html=False), name="assets")

# 2) If Vite produced any top-level files in static (rare), serve them explicitly as needed:
# For example:
# if os.path.isfile(os.path.join(STATIC_DIR, "vite.svg")):
#     app.mount("/vite.svg", StaticFiles(directory=STATIC_DIR, html=False), name="vite_svg")

# 3) Serve index.html at root
@app.get("/", include_in_schema=False)
def spa_root():
    return FileResponse(INDEX_FILE)

# 4) Catch-all for client-side routes (anything that's not /api/* or /assets/*)
@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("assets/"):
        # Let real API/asset 404s propagate
        raise HTTPException(status_code=404)
    return FileResponse(INDEX_FILE)

# backend/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# CORS (loosen for dev; tighten for prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Your API routes go here ----
@app.get("/api/ping")
async def ping():
    return {"message": "pong"}

# ---- Serve the built frontend from backend/static ----
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Optional: warn in logs if the folder is missing (e.g., before first build)
if not os.path.isdir(STATIC_DIR):
    print(f"⚠️  Warning: {STATIC_DIR} does not exist yet. "
          f"Run 'make deploy' (or build + copy) to create it.")

# Mount the SPA at root. With html=True, unknown routes fall back to index.html.
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="spa")

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# CORS (for local frontend dev, not needed in production if hosted together)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample API route
@app.get("/api/ping")
async def ping():
    return {"message": "pong"}

# Serve React static files from /frontend/dist
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

# Catch-all for React SPA routing
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    return FileResponse(os.path.join(frontend_path, "index.html"))

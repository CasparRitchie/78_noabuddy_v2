from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()

# Serve the built Vite frontend
app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="frontend")


@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI!"}


@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    return FileResponse("../frontend/dist/index.html")

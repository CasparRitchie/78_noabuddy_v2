# from fastapi import FastAPI
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse
# from fastapi.middleware.cors import CORSMiddleware
# import os

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.get("/api/ping")
# async def ping():
#     return {"message": "pong"}

# # Serve React static files
# frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
# if os.path.exists(frontend_path):
#     app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")
# else:
#     print(f"⚠️ Warning: Static directory '{frontend_path}' does not exist. Frontend not mounted.")

# @app.get("/{full_path:path}")
# async def catch_all(full_path: str):
#     return FileResponse(os.path.join(frontend_path, "index.html"))


from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()

# 1) path to your built React app
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

# 2) mount all the static files (js/css/assets) at “/”
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

# 3) your API routes
@app.get("/api/ping")
async def ping():
    return {"message": "pong"}

# 4) catch-all for everything else → return index.html
@app.get("/{full_path:path}")
async def spa_fallback(request: Request, full_path: str):
    index_file = os.path.join(frontend_dir, "index.html")
    return FileResponse(index_file)

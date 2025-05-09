# # # # from fastapi import FastAPI
# # # # from fastapi.staticfiles import StaticFiles
# # # # from fastapi.responses import FileResponse
# # # # from fastapi.middleware.cors import CORSMiddleware
# # # # import os

# # # # app = FastAPI()

# # # # app.add_middleware(
# # # #     CORSMiddleware,
# # # #     allow_origins=["*"],
# # # #     allow_credentials=True,
# # # #     allow_methods=["*"],
# # # #     allow_headers=["*"],
# # # # )

# # # # @app.get("/api/ping")
# # # # async def ping():
# # # #     return {"message": "pong"}

# # # # # Serve React static files
# # # # frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
# # # # if os.path.exists(frontend_path):
# # # #     app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")
# # # # else:
# # # #     print(f"⚠️ Warning: Static directory '{frontend_path}' does not exist. Frontend not mounted.")

# # # # @app.get("/{full_path:path}")
# # # # async def catch_all(full_path: str):
# # # #     return FileResponse(os.path.join(frontend_path, "index.html"))


# # # from fastapi import FastAPI, Request
# # # from fastapi.staticfiles import StaticFiles
# # # from fastapi.responses import FileResponse
# # # import os

# # # app = FastAPI()

# # # # 1) path to your built React app
# # # frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

# # # # 2) mount all the static files (js/css/assets) at “/”
# # # app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

# # # # 3) your API routes
# # # @app.get("/api/ping")
# # # async def ping():
# # #     return {"message": "pong"}

# # # # 4) catch-all for everything else → return index.html
# # # @app.get("/{full_path:path}")
# # # async def spa_fallback(request: Request, full_path: str):
# # #     index_file = os.path.join(frontend_dir, "index.html")
# # #     return FileResponse(index_file)


# # # backend/main.py
# # from fastapi import FastAPI, Request
# # from fastapi.staticfiles import StaticFiles
# # from fastapi.responses import FileResponse, JSONResponse
# # from fastapi.middleware.cors import CORSMiddleware
# # import os

# # app = FastAPI()

# # # (your CORS, API endpoints, etc.)

# # # 1) Serve your API:
# # @app.get("/api/ping")
# # async def ping():
# #     return {"message": "pong"}

# # # 2) Serve all the compiled JS/CSS/images, etc. under /assets
# # frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
# # app.mount(
# #     "/assets",
# #     StaticFiles(directory=os.path.join(frontend_dist, "assets")),
# #     name="assets"
# # )

# # # 3) Serve the other top‐level files (index‐*.js, index‐*.css, vite.svg, etc.)
# # app.mount(
# #     "/",
# #     StaticFiles(directory=frontend_dist, html=False),
# #     name="static_root"
# # )

# # # 4) Finally, catch *all* other routes and serve index.html
# # @app.get("/{full_path:path}", include_in_schema=False)
# # async def serve_spa(full_path: str, request: Request):
# #     # don't intercept API requests
# #     if full_path.startswith("api"):
# #         return JSONResponse({"detail": "Not Found"}, status_code=404)
# #     return FileResponse(os.path.join(frontend_dist, "index.html"))


# import os
# from fastapi import FastAPI
# from fastapi.staticfiles import StaticFiles
# from fastapi.middleware.cors import CORSMiddleware

# app = FastAPI()

# # (your CORS / API routes here)
# @app.get("/api/ping")
# async def ping():
#     return {"message": "pong"}

# # point this at your /frontend/dist
# frontend_dist = os.path.abspath(
#     os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
# )

# # mount *everything* at root, with html=True
# app.mount(
#     "/",
#     StaticFiles(directory=frontend_dist, html=True),
#     name="spa",
# )


# backend/main.py
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS middleware (if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample API route
@app.get("/api/ping")
async def ping():
    return {"message": "pong"}

# Path to your React build
frontend_dist = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
)

# 1) Serve all the files in dist (JS/CSS/assets)
app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
app.mount("/favicon.svg", StaticFiles(directory=frontend_dist), name="favicon")  # if you have a favicon

# 2) Serve index.html for the root
@app.get("/")
async def root():
    return FileResponse(os.path.join(frontend_dist, "index.html"))

# 3) Catch-all for client-side routes
@app.get("/{full_path:path}")
async def spa_catch_all(full_path: str):
    return FileResponse(os.path.join(frontend_dist, "index.html"))

# backend/main.py
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
import os
import httpx

app = FastAPI()

# CORS (loosen for dev; tighten for prod as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


class Turn(BaseModel):
    speaker: Literal["s1","s2"]
    text: str
    ts: float  # epoch seconds

class CoachRequest(BaseModel):
    turns: List[Turn] = Field(..., description="Most recent turns, oldest first")
    flags: List[str] = Field(default_factory=list, description="Heuristic flags e.g. negativity, dominance, interruptions")
    speaker_labels: dict = Field(default_factory=dict)  # {"s1":"Speaker 1","s2":"Speaker 2"}

class CoachResponse(BaseModel):
    should_intervene: bool
    type: Literal["micro-coach","reframe","timeout","skill-practice","encouragement"]
    message: Optional[str] = None
    confidence: float = 0.5

def build_prompt(req: CoachRequest) -> str:
    # System-style prompt: short, concrete, safe
    speaker1 = req.speaker_labels.get("s1","Speaker 1")
    speaker2 = req.speaker_labels.get("s2","Speaker 2")
    convo_lines = []
    for t in req.turns[-16:]:
        name = speaker1 if t.speaker=="s1" else speaker2
        convo_lines.append(f"{name}: {t.text.strip()}")
    convo = "\n".join(convo_lines)

    flags = ", ".join(req.flags) if req.flags else "none"

    return f"""You are NoaBuddy, a brief, kind relationship coach.
Goal: help both speakers feel heard and improve communication. Keep interventions concise (1-2 sentences), neutral, and actionable.

Safety & tone:
- Never give medical, legal, or abuse advice. If you suspect harm or abuse, suggest seeking professional support.
- Use inclusive, non-judgmental language ("might", "could").
- Avoid taking sides; reflect both perspectives.

When to intervene:
- Only if helpful. Prefer prompts that improve listening, turn-taking, or clarity.
- If flags like negativity, 'you'-statements, dominance, or interruptions are present.

Available intervention types:
- "micro-coach": tiny nudge to rephrase or summarize.
- "reframe": reflect and reframe feelings/needs.
- "timeout": suggest a short pause/deep breath.
- "skill-practice": quick exercise (e.g., 'Can each of you summarize the other's point in one sentence?').
- "encouragement": reinforce constructive moves.

Conversation (latest last):
{convo}

Detected flags: {flags}

Return JUST a JSON object with fields:
- should_intervene: true/false
- type: one of the listed types
- message: string, <= 2 short sentences (omit if should_intervene=false)
- confidence: 0..1
"""

def _extract_first_json_obj(text: str):
    """
    Finds the first {...} block and parses it as JSON.
    Returns dict or None.
    """
    if not text:
        return None
    m = re.search(r"\{.*\}", text, flags=re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None

async def call_llm(prompt: str) -> str:
    """
    Calls local Ollama. Returns raw text (model response).
    """
    model = os.getenv("OLLAMA_MODEL", "mistral")
    url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    payload = {"model": model, "prompt": prompt, "stream": False}

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(url, json=payload)
        r.raise_for_status()
        data = r.json()
        return (data.get("response") or "").strip()

@app.post("/api/coach", response_model=CoachResponse)
async def coach(req: CoachRequest):
    prompt = build_prompt(req)
    try:
        raw = await call_llm(prompt)
        data = _extract_first_json_obj(raw)
        if not data:
            # graceful fallback if the model didn't return valid JSON
            return CoachResponse(should_intervene=False, type="encouragement", message=None, confidence=0.0)

        return CoachResponse(
            should_intervene=bool(data.get("should_intervene", False)),
            type=data.get("type", "micro-coach"),
            message=data.get("message"),
            confidence=float(data.get("confidence", 0.5)),
        )
    except Exception as e:
        print("coach error:", e)
        return CoachResponse(should_intervene=False, type="encouragement", message=None, confidence=0.0)

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

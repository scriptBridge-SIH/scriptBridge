# backend/main.py
import logging
logging.basicConfig(level=logging.INFO)


from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

class TranslitRequest(BaseModel):
    text: str
    to_script: str
    from_script: str = None

app = FastAPI(title="ScriptBridge API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # narrow this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
async def root():
    return {"message": "Welcome to ScriptBridge API"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/transliterate")
async def transliterate(req: TranslitRequest):
    # TODO: integrate Aksharamukha/Bhashini here.
    # Day-1: use a mock response (return same text or mark as mock)
    mock = f"{req.text}"   # keep original for now
    logging.info(f"Request: {req}")
    return {"original": req.text, "transliteration": mock, "to_script": req.to_script}

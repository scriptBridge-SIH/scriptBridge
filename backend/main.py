from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from aksharamukha import transliterate
import cv2
import numpy as np
import pytesseract
import logging
import httpx
import os
from dotenv import load_dotenv

logging.basicConfig(
    filename="transliteration.log",
    level=logging.ERROR,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Load environment variables
load_dotenv()
BHASHINI_API_KEY = os.getenv("BHASHINI_API_KEY")
BHASHINI_ENDPOINT = os.getenv("BHASHINI_ENDPOINT")

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class TranslitRequest(BaseModel):
    text: str
    to_script: str
    from_script: str | None = None
    pre_options: list[str] | None = None
    post_options: list[str] | None = None

# Get all supported scripts
@app.get("/scripts")
async def get_scripts():
    try:
        scripts = list(transliterate.Scripts.keys())
        return {"supported_scripts": sorted(scripts)}
    except Exception as e:
        logging.error(f"Script fetch error: {e}")
        return {"supported_scripts": []}

# Bhashini fallback
async def call_bhashini_transliterate(text, source_script, target_script):
    headers = {
        "Authorization": f"Bearer {BHASHINI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "sourceLanguage": source_script,
        "targetLanguage": target_script
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(BHASHINI_ENDPOINT, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data.get("translatedText") or data.get("result") or ""
    except Exception as e:
        logging.error(f"Bhashini fallback failed: {e}")
        return ""

# Transliterate text
@app.post("/transliterate")
async def transliterate_text(req: TranslitRequest):
    from_script = req.from_script or "autodetect"
    if from_script.lower() == "auto":
        from_script = "autodetect"

    try:
        result = transliterate.process(
            from_script,
            req.to_script,
            req.text,
            False,
            pre_options=req.pre_options or [],
            post_options=req.post_options or []
        )
        return {"transliteration": result}
    except Exception as e:
        logging.error(f"Aksharamukha error: {e}")
        fallback = await call_bhashini_transliterate(req.text, from_script, req.to_script)
        return {"transliteration": fallback or req.text}

# OCR from image
@app.post("/ocr")
async def ocr_image(file: UploadFile = File(...)):
    try:
        img = np.frombuffer(await file.read(), np.uint8)
        image = cv2.imdecode(img, cv2.IMREAD_COLOR)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        text = pytesseract.image_to_string(gray, lang="eng+hin+kan+tel+tam")
        return {"text": text.strip()}
    except Exception as e:
        logging.error(f"OCR error: {e}")
        return {"text": ""}
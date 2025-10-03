import re

def guess_script(text):
    if re.search(r'[\u0900-\u097F]', text):
        return "Devanagari"
    elif re.search(r'[\u0C00-\u0C7F]', text):
        return "Telugu"
    elif re.search(r'[\u0B80-\u0BFF]', text):
        return "Tamil"
    elif re.search(r'[\u0D00-\u0D7F]', text):
        return "Malayalam"
    elif re.search(r'[\u0A00-\u0A7F]', text):
        return "Gurmukhi"
    elif re.search(r'[\u0980-\u09FF]', text):
        return "Bengali"
    else:
        return "Devanagari"  # fallback


import io
import logging
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import pytesseract
from aksharamukha.transliterate import process

# 🔧 Tesseract setup
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

SUPPORTED_SCRIPTS = [
    "Devanagari", "Telugu", "Kannada", "Gujarati", "Malayalam",
    "Tamil", "Bengali", "Oriya", "Gurmukhi", "Sinhala", "Grantha"
]

class TranslitRequest(BaseModel):
    text: str
    to_script: str
    from_script: str = None

app = FastAPI(title="ScriptBridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        try:
            image = Image.open(io.BytesIO(contents))
        except Exception as e:
            logging.error(f"Image open failed: {e}")
            return {"error": "Invalid image format"}

        text = pytesseract.image_to_string(image, lang="hin+tel+tam").strip()
        if not text:
            return {"error": "No text detected"}

        return {"text": text}
    except Exception as e:
        logging.error(f"OCR failed: {e}")
        return {"error": str(e)}

@app.post("/transliterate")
async def transliterate(req: TranslitRequest):
    try:
        from_script = req.from_script or guess_script(req.text)
        to_script = req.to_script

        if from_script not in SUPPORTED_SCRIPTS or to_script not in SUPPORTED_SCRIPTS:
            return {"error": f"Unsupported script. Supported: {SUPPORTED_SCRIPTS}"}

        result = process(from_script, to_script, req.text, nativize=True)

        return {
            "original": req.text,
            "transliteration": result,
            "from_script": from_script,
            "to_script": to_script  
        }

    except Exception as e:
        logging.error(f"Transliteration failed: {e}")
        return {"error": "Transliteration error"}


@app.get("/scripts")
async def get_scripts():
    return {"supported_scripts": SUPPORTED_SCRIPTS}

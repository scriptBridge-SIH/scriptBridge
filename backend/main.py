import io
import logging
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from aksharamukha.transliterate import process

import pytesseract
from PIL import Image

# Logging setup
logging.basicConfig(
    filename="transliteration.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

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
    allow_origins=["*"],  # Dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/transliterate")
async def transliterate(req: TranslitRequest):
    try:
        from_script = req.from_script or "Devanagari"
        to_script = req.to_script

        logging.info(f"Request: {req.text} | From: {from_script} → To: {to_script}")

        # Validate script names
        if from_script not in SUPPORTED_SCRIPTS or to_script not in SUPPORTED_SCRIPTS:
            error_msg = f"Unsupported script. Supported: {SUPPORTED_SCRIPTS}"
            logging.warning(error_msg)
            return {"error": error_msg}

        # Transliterate using Aksharamukha
        result = process(from_script, to_script, req.text)

        return {
            "original": req.text,
            "transliteration": result,
            "from_script": from_script,
            "to_script": to_script
        }

    except Exception as e:
        logging.error(f"Unhandled error: {e}")
        return {"error": "Internal server error"}

@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        text = pytesseract.image_to_string(image)
        return {"text": text}
    except Exception as e:
        logging.error(f"OCR failed: {e}")
        return {"error": "OCR error"}

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from aksharamukha import transliterate
import cv2
import numpy as np
import pytesseract
import logging

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
    return {"supported_scripts": transliterate.getAvailableScripts()}

# Transliterate text
@app.post("/transliterate")
async def transliterate_text(req: TranslitRequest):
    from_script = req.from_script or "autodetect"
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
        logging.error(f"Transliteration error: {e}")
        return {"original": req.text}

# OCR from image
@app.post("/ocr")
async def ocr_image(file: UploadFile = File(...)):
    try:
        img = np.frombuffer(await file.read(), np.uint8)
        image = cv2.imdecode(img, cv2.IMREAD_COLOR)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        text = pytesseract.image_to_string(gray, lang="eng+hin+kan+tel+tam")
        return {"text": text.strip()}
    except Exception as e:
        logging.error(f"OCR error: {e}")
        return {"text": ""}
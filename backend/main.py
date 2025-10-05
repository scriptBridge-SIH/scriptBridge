from typing import Optional
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pytesseract
import numpy as np
import cv2
from aksharamukha import transliterate

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_PATH", "tesseract")

# 🎯 Script list for dropdown
@app.get("/getScripts")
def get_scripts():
    scripts = [
        "Ahom", "Arabic", "Assamese", "Balinese", "Bengali (Bangla)", "Brahmi", "Burmese (Myanmar)",
        "Chakma", "Cham", "Devanagari", "Dogra", "Grantha", "Gujarati", "Hebrew", "Javanese", "Kaithi",
        "Kannada", "Kharoshthi", "Khmer (Cambodian)", "Lao", "Lepcha", "Limbu", "Malayalam", "Modi",
        "Mongolian (Ali Gali)", "Meetei Mayek (Manipuri)", "Multani", "Nandinagari", "Newa (Nepal Bhasa)",
        "Oriya (Odia)", "Punjabi (Gurmukhi)", "Ranjana (Lantsa)", "Rejang", "Saurashtra", "Sharada",
        "Siddham", "Sinhala", "Syloti Nagari", "Syriac (Estrangela)", "Tagalog", "Takri", "Tamil",
        "Tamil Brahmi", "Telugu", "Thai", "Tibetan", "Tirhuta (Maithili)", "Urdu", "Vatteluttu", "Wancho"
    ]
    return {"supported_scripts": sorted(scripts)}

# 📷 OCR endpoint
@app.post("/ocr_image")
async def ocr_image(file: UploadFile = File(...)):
    try:
        img_bytes = await file.read()
        img_array = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if image is None:
            print("❌ Failed to decode image")
            return {"text": "", "error": "Invalid image format"}

        print("✅ Image decoded:", image.shape)

        # Preprocessing: grayscale + thresholding
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

        # OCR with expanded language support
        text = pytesseract.image_to_string(
            thresh,
            lang="eng+hin+kan+tel+tam+mal+guj+ben+pan+ori+urd"
        )
        print("🧠 OCR output:", repr(text))

        clean_text = text.strip()
        if not clean_text:
            return {"text": "", "error": "OCR returned empty text"}

        return {"text": clean_text}

    except Exception as e:
        print("🔥 OCR error:", str(e))
        return {"text": "", "error": str(e)}
      

# 🔡 Transliteration model
class TransliterationRequest(BaseModel):
    text: str
    to_script: str
    from_script: Optional[str] = "autodetect"


# 🔁 Transliteration endpoint (local Aksharamukha)
@app.post("/transliterate")
async def transliterate_local(req: TransliterationRequest):
    try:
        output = transliterate.process(
            src="autodetect",
            tgt=req.to_script,
            txt=req.text,
            nativize=True
        )
        return {"transliteration": output}
    except Exception as e:
        return {"transliteration": "", "error": str(e)}
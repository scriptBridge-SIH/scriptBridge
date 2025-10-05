#!/bin/bash
apt-get update && apt-get install -y tesseract-ocr-hin tesseract-ocr-kan tesseract-ocr-tel tesseract-ocr-tam tesseract-ocr-eng tesseract-ocr-script-devanagari tesseract-ocr-script-malayalam tesseract-ocr-script-tamil tesseract-ocr-script-telugu

uvicorn main:app --host 0.0.0.0 --port 10000

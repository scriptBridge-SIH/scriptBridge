📘 ScriptBridge: Indian Language Transliteration API
ScriptBridge is a multilingual transliteration pipeline that converts text between Indian scripts using Aksharamukha and Bhashini. It powers inclusive access to local information for travelers, migrants, and native speakers across India.

🚀 Features
🔁 Transliteration between major Indian scripts (e.g., Hindi → Telugu)

🧠 Aksharamukha integration (local Python module)

🌐 Bhashini fallback (government-backed API)

🧪 End-to-end testing with frontend + backend

🧾 Logging of all requests and errors

🔐 Environment-based config via .env

🎨 Unicode font rendering with Noto Sans Indic

🛠️ Tech Stack
Layer	Tech
Frontend	Vite + React (Port 5173)
Backend	FastAPI + Uvicorn (Port 8000)
Transliteration	Aksharamukha + Bhashini API
Fonts	Noto Sans Indic (Google Fonts)
Logging	Python logging to transliteration.log

import { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE =
  "http://localhost:8000" ||
  "https://d2lr0kbn-8000.inc1.devtunnels.ms/" ||
  import.meta.env.VITE_API_URL;

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [text, setText] = useState("");
  const [toScript, setToScript] = useState("Devanagari");
  const [scriptList, setScriptList] = useState([
    "Devanagari",
    "Telugu",
    "Tamil",
    "Malayalam",
    "Gurmukhi",
    "Bengali",
  ]);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    fetch(`${API_BASE}/getScripts`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...(data.supported_scripts || [])].sort();
        if (sorted.length > 0) setScriptList(sorted);
      })
      .catch(() => console.log("Script fetch failed"));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOut("");
    const payload = { text, to_script: toScript };

    try {
      const res = await fetch(`${API_BASE}/transliterate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      setOut(j.transliteration || j.original);
    } catch (err) {
      setError("Backend error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setOcrLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/ocr_image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const j = await res.json();

      if (!j.text) {
        throw new Error(j.error || "No text returned from OCR");
      }

      setText(j.text);
    } catch (err) {
      console.error("OCR error:", err);
      setError(
        "OCR failed. If you're using Brave or an ad blocker, try disabling shields or whitelisting this site."
      );
    } finally {
      setOcrLoading(false);
    }
  }
  
  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
      </button>

      <h1>🧾 ScriptBridge — Version 1.0</h1>

      <div
        className="dropzone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile({ target: { files: [file] } });
        }}
      >
        <p>Drag & drop an image here, or click to upload</p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
      </div>

      {ocrLoading && (
        <div className="spinner">
          <div className="loader"></div>
          <p>Extracting text from image…</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>Input text</label>
        <textarea
          className="text-input"
          placeholder="Enter text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              document.getElementById("transliterate-btn").click();
            }
          }}
        />

        <div className="controls">
          <div>
            <label>Target script</label>
            <select
              className="script-select"
              value={toScript}
              onChange={(e) => setToScript(e.target.value)}
            >
              {scriptList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="buttons">
            <button id="transliterate-btn" type="submit" disabled={loading}>
              {loading ? "Processing…" : "Transliterate"}
            </button>
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setText("");
                setOut("");
                setError("");
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {out && (
        <div className="output">
          <h3>Output</h3>
          <div className="output-text">{out}</div>
          <button onClick={() => navigator.clipboard.writeText(out)}>
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

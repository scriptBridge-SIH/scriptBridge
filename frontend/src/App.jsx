import { useState, useEffect } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [text, setText] = useState("");
  const [toScript, setToScript] = useState("Devanagari");
  const [scriptList, setScriptList] = useState([
    "Devanagari", "Telugu", "Tamil", "Malayalam", "Gurmukhi", "Bengali"
  ]);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔄 Apply dark class to <body>
  useEffect(() => {
    document.body.className = darkMode ? "dark" : "";
  }, [darkMode]);

  useEffect(() => {
    fetch(`${API_BASE}/scripts`)
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
        body: JSON.stringify(payload)
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

    try {
      const res = await fetch(`${API_BASE}/ocr`, {
        method: "POST",
        body: formData
      });
      const j = await res.json();
      setText(j.text || "");
    } catch (err) {
      setError("OCR error: " + err.message);
    }
  }

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <button
        className="dark-toggle"
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
      </button>

      <h1>🪶 ScriptBridge — Prototype</h1>

      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile({ target: { files: [file] } });
        }}
      >
        <p>Drag & drop an image here, or click to upload</p>
        <input type="file" accept="image/*" onChange={handleFile} />
      </div>

      <form onSubmit={handleSubmit}>
        <label>Input text</label>
        <textarea
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
              value={toScript}
              onChange={(e) => setToScript(e.target.value)}
            >
              {scriptList.map((s) => (
                <option key={s} value={s}>{s}</option>
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
import { useState } from "react";

const SCRIPTS = ["Devanagari", "Telugu", "Tamil", "Malayalam", "Gurmukhi", "Bengali"];

export default function App() {
  const [text, setText] = useState("");
  const [toScript, setToScript] = useState("Devanagari");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function callBackend(baseUrl, payload) {
    const res = await fetch(`${baseUrl}/transliterate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("API error");
    return res.json();
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    setOut("");

    const payload = { text, to_script: toScript };

    try {
      let j;
      try {
        j = await callBackend("http://localhost:8000", payload);
      } catch {
        j = await callBackend("http://127.0.0.1:8000", payload);
      }
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
      const res = await fetch("http://localhost:8000/ocr", {
        method: "POST",
        body: formData,
      });
      const j = await res.json();
      setText(j.text || "");
    } catch (err) {
      setError("OCR error: " + err.message);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "32px auto", fontFamily: "sans-serif" }}>
      <h1>ScriptBridge — Prototype</h1>

      {/* Drag-and-drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile({ target: { files: [file] } });
        }}
        style={{
          border: "2px dashed #ccc",
          padding: "16px",
          marginBottom: "16px",
          textAlign: "center",
          cursor: "pointer"
        }}
      >
        <p>Drag & drop an image here, or click to upload</p>
        <input type="file" accept="image/*" onChange={handleFile} />
      </div>

      <form onSubmit={handleSubmit}>
        <label>Input text (any script)</label><br />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={{ width: "100%" }}
        />
        <div style={{ marginTop: 8 }}>
          <label>Target script</label>
          <select
            value={toScript}
            onChange={(e) => setToScript(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {SCRIPTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" style={{ marginLeft: 16 }} disabled={loading}>
            Transliterate
          </button>
          <button
            type="button"
            onClick={() => {
              setText("");
              setOut("");
              setError("");
            }}
            style={{ marginLeft: 8 }}
          >
            Clear
          </button>
        </div>
      </form>

      {loading && <p>Processing…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {out && (
        <div style={{ marginTop: 24, padding: 12, border: "1px solid #ddd" }}>
          <h3>Output</h3>
          <div style={{ fontSize: 24 }}>{out}</div>
          <button
            onClick={() => navigator.clipboard.writeText(out)}
            style={{ marginTop: 8 }}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";

export default function App() {
  const [text, setText] = useState("");
  const [toScript, setToScript] = useState("Devanagari");
  const [scriptList, setScriptList] = useState([
    "Devanagari", "Telugu", "Tamil", "Malayalam", "Gurmukhi", "Bengali"
  ]);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

useEffect(() => {
  fetch("http://localhost:8000/scripts")
    .then((res) => res.json())
    .then((data) => {
      console.log("Fetched scripts:", data.supported_scripts);
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
      const res = await fetch("http://localhost:8000/transliterate", {
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
      const res = await fetch("http://localhost:8000/ocr", {
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
    <div style={{ maxWidth: 800, margin: "32px auto", fontFamily: "sans-serif" }}>
      <h1>ScriptBridge — Prototype</h1>

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
          >
            {scriptList.map((s) => (
              <option key={s} value={s}>{s}</option>
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
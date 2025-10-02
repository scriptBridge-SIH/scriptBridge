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
      // Try localhost first
      let j;
      try {
        j = await callBackend("http://localhost:8000", payload);
      } catch {
        // If fails, fallback to 127.0.0.1
        j = await callBackend("http://127.0.0.1:8000", payload);
      }
      setOut(j.transliteration || j.original);
    } catch (err) {
      setError("Backend error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "32px auto", fontFamily: "sans-serif" }}>
      <h1>ScriptBridge — Prototype</h1>
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

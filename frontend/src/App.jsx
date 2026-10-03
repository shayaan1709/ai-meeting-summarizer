import { useRef, useState } from "react";

export default function App() {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const recorder = useRef(null);
  const chunks = useRef([]);

  async function send(blob, filename) {
    setLoading(true);
    setResult(null);
    const form = new FormData();
    form.append("audio", blob, filename);
    try {
      const res = await fetch("http://localhost:5001/process", {
        method: "POST",
        body: form,
      });
      setResult(await res.json());
    } catch {
      setResult({ error: "Something went wrong. Is Flask running?" });
    }
    setLoading(false);
  }

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder.current = new MediaRecorder(stream);
    chunks.current = [];
    recorder.current.ondataavailable = (e) => chunks.current.push(e.data);
    recorder.current.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      send(new Blob(chunks.current, { type: "audio/webm" }), "recording.webm");
    };
    recorder.current.start();
    setRecording(true);
  }

  function stop() {
    recorder.current.stop();
    setRecording(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>🎙️ Voice Notes</h1>

      <button onClick={recording ? stop : start} disabled={loading}
        style={{ padding: "12px 24px", fontSize: 18, cursor: "pointer" }}>
        {recording ? "⏹ Stop" : "⏺ Record"}
      </button>

      <p>or upload a file:</p>
      <input type="file" accept="audio/*" disabled={loading}
        onChange={(e) => e.target.files[0] && send(e.target.files[0], e.target.files[0].name)} />

      {loading && <p>⏳ Listening and thinking... (first run is slow)</p>}

      {result?.error && <p style={{ color: "red" }}>{result.error}</p>}

      {result?.summary && (
        <>
          <h2>Summary</h2>
          <div style={{ whiteSpace: "pre-wrap" }}>{result.summary}</div>
          <h2>Full transcript</h2>
          <div style={{ whiteSpace: "pre-wrap", color: "#555" }}>{result.transcript}</div>
        </>
      )}
    </div>
  );
}

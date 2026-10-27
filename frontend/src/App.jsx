import React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000"
).replace(/\/$/, "");

const TRANSCRIBE_URL = `${API_BASE}/api/transcribe-audio`;
const HISTORY_URL = `${API_BASE}/api/transcriptions`;

async function readResponse(response) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body.error || `Request failed (HTTP ${response.status})`
    );
  }

  return body;
}

export default function App() {
  const [text, setText] = useState("");
  const [history, setHistory] = useState([]);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(HISTORY_URL);
      const data = await readResponse(response);
      setHistory(data);
    } catch (err) {
      setError(`Cannot load transcription history: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    loadHistory();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [loadHistory]);

  const startRecording = async () => {
    setError("");
    setMessage("");

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        "Your browser does not support audio recording. Try the latest Chrome."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      console.log(
        "Microphone tracks:",
        stream.getAudioTracks().map((track) => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        }))
      );

      const preferredType = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType: preferredType,
      });

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        console.log("Audio chunk received:", event.data?.size || 0, "bytes");

        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error || event);
        setError("The browser could not record audio. Please try again.");
        setRecording(false);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        console.log("Recorded audio size:", blob.size, "bytes");
        console.log("Audio type:", blob.type);
        console.log("Audio chunks:", chunksRef.current.length);

        if (!blob.size) {
          setError(
            "No audio data was captured. Check microphone access and try again."
          );
          setMessage("");
          return;
        }

        const extension = blob.type.includes("mp4") ? "m4a" : "webm";
        const formData = new FormData();

        // Whisper automatically detects the spoken language.
        formData.append("audio", blob, `recording.${extension}`);

        setBusy(true);
        setMessage("Transcribing Hindi and English speech...");
        setError("");

        try {
          console.log("Sending audio to backend:", TRANSCRIBE_URL);

          const response = await fetch(TRANSCRIBE_URL, {
            method: "POST",
            body: formData,
          });

          const result = await readResponse(response);

          if (!result.text?.trim()) {
            throw new Error("No transcription was returned.");
          }

          setText((previous) =>
            previous.trim()
              ? `${previous.trim()} ${result.text.trim()}`
              : result.text.trim()
          );

          setMessage(
            result.detected_language
              ? `Transcription complete. Detected language: ${result.detected_language}.`
              : "Transcription complete."
          );
        } catch (err) {
          console.error("Transcription request failed:", err);
          setError(err.message || "Transcription failed.");
          setMessage("");
        } finally {
          setBusy(false);
        }
      };

      recorder.start();
      setRecording(true);
      setMessage("Recording... speak in Hindi, English, or both.");

      console.log("Recording started. Speak now.");
    } catch (err) {
      console.error("Could not start recording:", err);

      setError(
        err.name === "NotAllowedError"
          ? "Microphone permission was denied. Allow microphone access in your browser."
          : `Could not start the microphone: ${err.message}`
      );
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      setRecording(false);
      recorderRef.current.stop();
    }
  };

  const saveText = async () => {
    setError("");
    setMessage("");

    if (!text.trim()) {
      setError("Record something or type a transcript before saving.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        editingId ? `${HISTORY_URL}/${editingId}` : HISTORY_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        }
      );

      await readResponse(response);

      setMessage(editingId ? "Transcript updated." : "Transcript saved.");
      setEditingId(null);
      await loadHistory();
    } catch (err) {
      setError(`Could not save transcript: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const editItem = (item) => {
    setText(item.text);
    setEditingId(item.id);
    setMessage(`Editing transcript #${item.id}.`);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this transcript?")) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${HISTORY_URL}/${id}`, {
        method: "DELETE",
      });

      await readResponse(response);

      if (editingId === id) setEditingId(null);

      setMessage("Transcript deleted.");
      await loadHistory();
    } catch (err) {
      setError(`Could not delete transcript: ${err.message}`);
    }
  };

  const clearEditor = () => {
    setText("");
    setEditingId(null);
    setError("");
    setMessage("");
  };

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">OFFLINE MULTILINGUAL VOICE TOOL</p>
        <h1>Speech to Text</h1>
        <p className="subtitle">
          Transcribe Hindi, English, and mixed-language speech.
        </p>
      </header>

      <section className="panel">
        <div className="section-heading">
          <span className="mic-icon" aria-hidden="true">
            🎙️
          </span>
          <div>
            <h2>Your transcription</h2>
            <p>Speak naturally in Hindi, English, or both.</p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Your transcribed words will appear here. You can also type or edit text..."
          aria-label="Transcription text"
        />

        <div className="controls">
          <button
            className="primary"
            onClick={startRecording}
            disabled={recording || busy}
          >
            {recording ? "Recording..." : "🎙 Start recording"}
          </button>

          <button
            className="stop"
            onClick={stopRecording}
            disabled={!recording}
          >
            ■ Stop recording
          </button>

          <button
            className="primary"
            onClick={saveText}
            disabled={busy || recording}
          >
            {editingId ? "Update transcript" : "Save transcription"}
          </button>

          <button
            className="light"
            onClick={clearEditor}
            disabled={recording || busy}
          >
            Clear
          </button>
        </div>

        <p className="hint">
          Press Stop when you finish speaking. Keep this page open while the
          recording is processed.
        </p>

        {busy && (
          <div className="progress" role="status">
            <span className="spinner" />
            {message || "Working..."}
          </div>
        )}

        {!busy && message && (
          <div className="notice success" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
      </section>

      <section className="panel history-panel">
        <div className="history-header">
          <div>
            <h2>Transcription history</h2>
            <p>Your saved transcripts are stored in the local database.</p>
          </div>

          <button className="light" onClick={loadHistory} disabled={busy}>
            Refresh
          </button>
        </div>

        {history.length === 0 ? (
          <div className="empty">
            <span aria-hidden="true">🗒️</span>
            <p>No saved transcriptions yet.</p>
            <small>Record and save a transcript to see it here.</small>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <article className="history-item" key={item.id}>
                <div className="history-meta">
                  <strong>Transcript #{item.id}</strong>
                  <time>
                    {item.created_at
                      ? new Date(
                          `${item.created_at.replace(" ", "T")}Z`
                        ).toLocaleString()
                      : ""}
                  </time>
                </div>

                <p className="history-text">{item.text}</p>

                <div className="item-actions">
                  <button
                    className="light small"
                    onClick={() => editItem(item)}
                    disabled={busy}
                  >
                    Edit
                  </button>

                  <button
                    className="danger small"
                    onClick={() => deleteItem(item.id)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>
        Built with React, Flask, SQLite, and Whisper multilingual speech recognition.
      </footer>
    </main>
  );
}
import json
import os
import sqlite3
import subprocess
import tempfile
import wave
from pathlib import Path

import imageio_ffmpeg
from faster_whisper import WhisperModel
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "transcriptions.db"

app = Flask(__name__)
CORS(app)

# Multilingual model: Hindi, English and other languages.
# The model downloads on first launch and is cached locally.
print("Loading multilingual speech model...")
speech_model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8",
)
print("Multilingual speech model loaded.")


def get_db():
    conn = sqlite3.connect(DATABASE, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transcriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


init_db()


@app.get("/")
def home():
    return "Offline multilingual Speech-to-Text API is running!"


@app.get("/api/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "transcription_engine": "Whisper multilingual (offline)",
            "model_loaded": True,
            "languages": ["Hindi", "English", "mixed Hindi-English"],
        }
    )


@app.post("/api/transcribe-audio")
def transcribe_audio():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file received."}), 400

    audio = request.files["audio"]

    if not audio.filename:
        return jsonify({"error": "Audio filename is missing."}), 400

    input_path = None
    output_path = None

    try:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as input_file:
            input_path = input_file.name
            audio.save(input_path)

        output_path = input_path + ".wav"
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

        # Convert browser audio to mono, 16 kHz WAV.
        subprocess.run(
            [
                ffmpeg_path,
                "-y",
                "-i",
                input_path,
                "-vn",
                "-ar",
                "16000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                output_path,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            timeout=120,
        )

        with wave.open(output_path, "rb") as wav_file:
            if wav_file.getnframes() == 0:
                return jsonify({"error": "The recording is empty."}), 400

        # Auto-detect the main language; do not force English or Hindi.
        segments, info = speech_model.transcribe(
            output_path,
            task="transcribe",
            language=None,
            beam_size=5,
            vad_filter=True,
        )

        # Transcription runs while iterating over the segments.
        transcript = " ".join(
            segment.text.strip() for segment in segments if segment.text.strip()
        ).strip()

        if not transcript:
            return jsonify(
                {"error": "No speech was recognized. Please try again."}
            ), 422

        return jsonify(
            {
                "text": transcript,
                "detected_language": info.language,
            }
        )

    except subprocess.TimeoutExpired:
        app.logger.exception("Audio conversion timed out")
        return jsonify({"error": "Audio conversion took too long."}), 504

    except subprocess.CalledProcessError as exc:
        details = (
            exc.stderr.decode("utf-8", errors="replace")[-1000:]
            if exc.stderr
            else "Unknown FFmpeg error"
        )
        app.logger.error("FFmpeg failed: %s", details)
        return jsonify({"error": "Could not convert the recording."}), 500

    except Exception:
        app.logger.exception("Transcription failed")
        return jsonify(
            {"error": "Transcription failed. Check the backend terminal."}
        ), 500

    finally:
        for path in (input_path, output_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    app.logger.warning("Could not remove temporary file: %s", path)


@app.get("/api/transcriptions")
def list_transcriptions():
    with get_db() as conn:
        rows = conn.execute("""
            SELECT id, text, created_at
            FROM transcriptions
            ORDER BY id DESC
        """).fetchall()

    return jsonify([dict(row) for row in rows])


@app.post("/api/transcriptions")
def create_transcription():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")

    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "Transcription text is required."}), 400

    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO transcriptions (text) VALUES (?)",
            (text.strip(),),
        )

    return jsonify(
        {
            "id": cursor.lastrowid,
            "text": text.strip(),
        }
    ), 201


@app.put("/api/transcriptions/<int:transcription_id>")
def edit_transcription(transcription_id):
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")

    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "Transcription text is required."}), 400

    with get_db() as conn:
        cursor = conn.execute(
            "UPDATE transcriptions SET text = ? WHERE id = ?",
            (text.strip(), transcription_id),
        )

        if cursor.rowcount == 0:
            return jsonify({"error": "Transcription not found."}), 404

    return jsonify({"message": "Transcript updated."})


@app.delete("/api/transcriptions/<int:transcription_id>")
def remove_transcription(transcription_id):
    with get_db() as conn:
        cursor = conn.execute(
            "DELETE FROM transcriptions WHERE id = ?",
            (transcription_id,),
        )

        if cursor.rowcount == 0:
            return jsonify({"error": "Transcription not found."}), 404

    return jsonify({"message": "Transcription deleted."})


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )

# 🎙️ Voice Notes

Record or upload audio, get a transcript and a short summary. Runs fully locally.

**Stack:** React (Vite) · Flask · faster-whisper · Ollama (llama3.2) · MinIO

## Requirements (macOS)

```bash
brew install ollama minio/stable/minio ffmpeg node python@3.11
ollama pull llama3.2
```

## Setup

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../frontend
npm install
```

## Run

```bash
./start.sh
```

Opens http://localhost:5173. Press Ctrl+C in the terminal to stop everything.

## How it works

1. React records audio in the browser and sends it to Flask
2. Flask saves the audio to MinIO
3. faster-whisper transcribes it
4. Ollama summarizes the transcript
5. React shows the summary and transcript

> Note: the MinIO credentials in `backend/app.py` are the local defaults (`minioadmin`). Change them before exposing this to the internet.

import io, os, tempfile, uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from minio import Minio
from faster_whisper import WhisperModel
import ollama

app = Flask(__name__)
CORS(app)

store = Minio("localhost:9000", access_key="minioadmin",
              secret_key="minioadmin", secure=False)
BUCKET = "audio"
if not store.bucket_exists(BUCKET):
    store.make_bucket(BUCKET)

whisper = WhisperModel("base", compute_type="int8")

@app.post("/process")
def process():
    f = request.files["audio"]
    data = f.read()
    name = f"{uuid.uuid4()}-{f.filename}"

    store.put_object(BUCKET, name, io.BytesIO(data), len(data))

    suffix = os.path.splitext(f.filename)[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix) as tmp:
        tmp.write(data)
        tmp.flush()
        segments, _ = whisper.transcribe(tmp.name)
        transcript = " ".join(s.text.strip() for s in segments)

    reply = ollama.chat(model="llama3.2", messages=[{
        "role": "user",
        "content": f"Summarize this in 3 short bullet points:\n\n{transcript}"
    }])

    return jsonify(transcript=transcript,
                   summary=reply["message"]["content"],
                   file=name)

if __name__ == "__main__":
    app.run(port=5001)

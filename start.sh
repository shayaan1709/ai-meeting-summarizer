#!/bin/bash
cd "$(dirname "$0")"
mkdir -p logs
PIDS=""

cleanup() {
  echo
  echo "Stopping everything..."
  kill $PIDS 2>/dev/null
  lsof -ti :5173,:5001,:9000 | xargs kill 2>/dev/null
  exit
}
trap cleanup INT TERM

echo "Starting MinIO..."
MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin \
  minio server ~/minio-data --console-address ":9001" > logs/minio.log 2>&1 &
PIDS="$PIDS $!"

if ! curl -s localhost:11434 > /dev/null; then
  echo "Starting Ollama..."
  ollama serve > logs/ollama.log 2>&1 &
  PIDS="$PIDS $!"
else
  echo "Ollama already running."
fi

sleep 3

echo "Starting Flask (first start can take a minute)..."
(cd backend && source venv/bin/activate && exec python app.py) > logs/flask.log 2>&1 &
PIDS="$PIDS $!"

echo "Starting React..."
(cd frontend && exec npm run dev) > logs/react.log 2>&1 &
PIDS="$PIDS $!"

until curl -s localhost:5001 > /dev/null; do sleep 2; done

echo
echo "✅ All running! Opening http://localhost:5173"
echo "Press Ctrl+C here to stop everything."
open -a "Google Chrome" http://localhost:5173
wait

#!/bin/sh
# Startup script for Railway deployment

# Get port from environment or use default
if [ -z "$PORT" ]; then
    PORT=8080
fi

echo "Starting Beforest Brand Voice Transformer on port $PORT"

# Start Gunicorn with the PORT
exec gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 120 --log-level info app:app
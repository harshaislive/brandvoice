#!/bin/bash
# Startup script for Railway deployment

# Set default port if not provided
PORT=${PORT:-8080}

echo "Starting Beforest Brand Voice Transformer on port $PORT"

# Start Gunicorn with the PORT
exec gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 120 --log-level info app:app
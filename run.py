#!/usr/bin/env python3
"""
Railway startup script - handles PORT environment variable properly
"""
import os
import sys
import subprocess

# Get port from environment
port = os.environ.get('PORT', '8080')

print(f"Starting Beforest Brand Voice Transformer on port {port}")

# Build the gunicorn command
cmd = [
    'gunicorn',
    '-w', '4',
    '-b', f'0.0.0.0:{port}',
    '--timeout', '120',
    '--log-level', 'info',
    'app:app'
]

# Execute gunicorn
subprocess.run(cmd)
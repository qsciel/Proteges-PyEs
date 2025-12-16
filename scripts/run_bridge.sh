#!/bin/bash
set -e

# Go to project root
cd "$(dirname "$0")/.."

# Create venv if not exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install requirements
pip install -q pyserial requests

# Determine what to run
PROGRAM="scripts/arduino_bridge.py" # Default

# If the first argument is a python file that exists (e.g. scripts/writer_tool.py), run that
if [ -n "$1" ] && [ -f "$1" ] && [[ "$1" == *.py ]]; then
    PROGRAM="$1"
    shift
fi

echo "Running $PROGRAM..."
python3 "$PROGRAM" "$@"

#!/usr/bin/env bash
set -euo pipefail
pip install --upgrade pip
pip install torch==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cpu
pip install -r backend/requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

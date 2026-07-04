# Crop & Weed Detection

A polished demo application for detecting crops and weeds in images and video using a Roboflow model. Built with a Python Flask backend (OpenCV + Roboflow) and a React + Vite frontend. This repository contains a lightweight, production-minded demo you can run locally or deploy for demos.

This project is ideal for showcasing practical ML integrations, CV pipelines, and full-stack delivery to hiring managers and engineering interviewers.

---

## Highlights

- Clean, presentation-ready UI with a focused upload + preview workflow.
- Supports image and video inference (sampled frames) via Roboflow API.
- Annotated results returned as PNG (images) or MP4 (videos).
- Small, easy-to-run Python backend and modern React frontend (Vite).

---

## Demo

Run the app locally (development) and open the frontend to interact with the demo.

### Quick Start (Windows PowerShell)

1. Backend (Python):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

2. Frontend (Node):

```powershell
cd frontend
npm install
npm run dev
# Open the URL shown by Vite (e.g. http://localhost:5175/)
```

### Quick Start (macOS / Linux)

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm run dev
```

---

## Project Structure

- `backend/` — Flask API, image/video processing, Roboflow integration.
  - `app.py` — main Flask app & inference routes
  - `requirements.txt` — Python dependencies
  - `.env` — environment variables (not committed; see `.gitignore`)
- `frontend/` — React + Vite app
  - `src/` — components and app code
  - `package.json` — node manifest

---

## Environment Variables

Create a `.env` file in `backend/` or set environment variables in your host:

- `ROBOFLOW_API_KEY` — your Roboflow API key (required for model inference)
- `ROBOFLOW_MODEL_ID` — the Roboflow model id (format: `<project>/<version>`)
- `HOST` — default `127.0.0.1`
- `PORT` — default `5000`
- `VIDEO_SAMPLE_RATE` — default `3`

Important: Never commit secrets or `.env` to git. The repository's `.gitignore` already excludes `.env` and related files.

---

## How it works (brief)

- Frontend uploads a file to `/api/infer/image` or `/api/infer/video`.
- Backend forwards frames or the full image to Roboflow's detection API.
- Backend draws bounding boxes using OpenCV and returns an annotated image/video.

---

## Troubleshooting & Notes

- If Roboflow returns errors about malformed images or base64, confirm your `ROBOFLOW_API_KEY` and `ROBOFLOW_MODEL_ID` are correct and the model is enabled for detection calls.
- `opencv-python` installs platform wheels on most systems. If pip fails, ensure you have the appropriate system build tools (rare on Windows with official wheels).
- Vite dev server proxies `/api` to `http://127.0.0.1:5000` by default using `frontend/vite.config.js`.

---

## Deployment Suggestions

- Backend: Serve behind a WSGI server (Gunicorn or Waitress on Windows) and use Nginx or a reverse proxy for TLS.
- Frontend: Build with `npm run build` and serve static files (Netlify, Vercel, or any static host). Or host both together on platforms like Render or Railway.

---

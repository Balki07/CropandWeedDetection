import os, io, tempfile
import cv2, requests, numpy as np
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

load_dotenv()

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL_ID  = os.getenv("ROBOFLOW_MODEL_ID", "weeds-nxe1w/1")  # <project>/<version>
HOST               = os.getenv("HOST", "127.0.0.1")
PORT               = int(os.getenv("PORT", "5000"))
VIDEO_SAMPLE_RATE  = int(os.getenv("VIDEO_SAMPLE_RATE", "3"))

if not ROBOFLOW_API_KEY:
    raise RuntimeError(
        "ROBOFLOW_API_KEY not found. Create a backend/.env file and add:\n"
        "ROBOFLOW_API_KEY=your_api_key_here"
    )

INFER_URL = f"https://detect.roboflow.com/{ROBOFLOW_MODEL_ID}"

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def draw_detections(frame, predictions):
    """Draw Roboflow predictions (x,y as center; width/height in px)."""
    h, w = frame.shape[:2]
    for p in predictions:
        cx, cy = p.get("x", 0), p.get("y", 0)
        bw, bh = p.get("width", 0), p.get("height", 0)
        x1 = int(max(cx - bw/2, 0)); y1 = int(max(cy - bh/2, 0))
        x2 = int(min(cx + bw/2, w - 1)); y2 = int(min(cy + bh/2, h - 1))
        cls = p.get("class", "obj"); conf = p.get("confidence", 0.0)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
        label = f"{cls} {conf:.2f}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        box_top = max(y1 - th - 6, 0)
        cv2.rectangle(frame, (x1, box_top), (x1 + tw + 6, box_top + th + 6), (0,0,0), -1)
        cv2.putText(frame, label, (x1 + 3, box_top + th + 3),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)
    return frame

@app.get("/")
def root():
    return "Crop & Weed Detection API is running. Use /api/infer/image or /api/infer/video."

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/infer/image")
def infer_image():
    if "file" not in request.files:
        return jsonify({"error":"No file field 'file'"}), 400
    f = request.files["file"]
    img_bytes = f.read()

    # Send to Roboflow
    rf = requests.post(
        INFER_URL,
        params={"api_key": ROBOFLOW_API_KEY},
        files={"file": (f.filename or "image.jpg", img_bytes, f.mimetype or "image/jpeg")}
    )

    # If Roboflow rejects the multipart upload (some accounts/APIs expect
    # a base64 image payload), retry by sending a base64-encoded image.
    if rf.status_code != 200:
        try:
            import base64
            b64 = base64.b64encode(img_bytes).decode()
            prefix = f"data:{f.mimetype or 'image/jpeg'};base64,"
            rf2 = requests.post(
                INFER_URL,
                params={"api_key": ROBOFLOW_API_KEY},
                json={"image": prefix + b64}
            )
            if rf2.status_code == 200:
                rf = rf2
        except Exception:
            pass

    if rf.status_code != 200:
        return jsonify({"error":"Roboflow error", "details": rf.text}), 502

    preds = rf.json().get("predictions", [])

    # Draw and return annotated image
    arr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    frame = draw_detections(frame, preds)
    ok, png = cv2.imencode(".png", frame)
    if not ok:
        return jsonify({"error":"Failed to encode image"}), 500

    return send_file(io.BytesIO(png.tobytes()), mimetype="image/png", download_name="result.png")

@app.post("/api/infer/video")
def infer_video():
    if "file" not in request.files:
        return jsonify({"error":"No video file"}), 400
    sample_rate = int(request.form.get("sample_rate", VIDEO_SAMPLE_RATE))

    # Save uploaded video to a temp file
    in_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4"); in_tmp.close()
    out_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4"); out_tmp.close()
    request.files["file"].save(in_tmp.name)

    cap = cv2.VideoCapture(in_tmp.name)
    if not cap.isOpened():
        os.remove(in_tmp.name)
        return jsonify({"error":"Could not open video"}), 400

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(out_tmp.name, fourcc, fps, (width, height))

    frame_idx = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_rate == 0:
                ok, buf = cv2.imencode(".jpg", frame)
                if ok:
                    rf = requests.post(
                        INFER_URL,
                        params={"api_key": ROBOFLOW_API_KEY},
                        files={"file": (f"frame{frame_idx}.jpg", buf.tobytes(), "image/jpeg")}
                    )
                    if rf.status_code == 200:
                        preds = rf.json().get("predictions", [])
                        frame = draw_detections(frame, preds)
                    else:
                        # Retry with base64 payload for this frame if multipart failed
                        try:
                            import base64
                            b64 = base64.b64encode(buf.tobytes()).decode()
                            prefix = f"data:image/jpeg;base64,"
                            rf2 = requests.post(
                                INFER_URL,
                                params={"api_key": ROBOFLOW_API_KEY},
                                json={"image": prefix + b64}
                            )
                            if rf2.status_code == 200:
                                preds = rf2.json().get("predictions", [])
                                frame = draw_detections(frame, preds)
                        except Exception:
                            pass

            out.write(frame)
            frame_idx += 1
    finally:
        cap.release()
        out.release()
        try: os.remove(in_tmp.name)
        except: pass

    with open(out_tmp.name, "rb") as fh:
        video_bytes = fh.read()
    try: os.remove(out_tmp.name)
    except: pass

    return send_file(io.BytesIO(video_bytes), mimetype="video/mp4", download_name="result.mp4")

if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=True)

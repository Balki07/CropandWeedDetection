import React, { useEffect, useMemo, useState } from "react";

const modeMeta = {
  image: {
    title: "Image analysis",
    hint: "Upload a field photo and get an annotated preview in seconds.",
    icon: "◌",
  },
  video: {
    title: "Video analysis",
    hint: "Process footage frame-by-frame and sample detections along the timeline.",
    icon: "▣",
  },
};

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function App() {
  const [mode, setMode] = useState("image");
  const [file, setFile] = useState(null);
  const [sampleRate, setSampleRate] = useState(3);
  const [imageURL, setImageURL] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [previewURL, setPreviewURL] = useState("");

  const fileDetails = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      type: file.type || (mode === "video" ? "video" : "image"),
      size: formatFileSize(file.size),
    };
  }, [file, mode]);

  useEffect(() => {
    if (!file) {
      setPreviewURL("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewURL(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    return () => {
      if (imageURL) URL.revokeObjectURL(imageURL);
      if (videoURL) URL.revokeObjectURL(videoURL);
    };
  }, [imageURL, videoURL]);

  const handleFileChange = (nextFile) => {
    setErr("");
    setImageURL("");
    setVideoURL("");
    setFile(nextFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setImageURL("");
    setVideoURL("");

    if (!file) {
      setErr("Choose a file first.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (mode === "video") fd.append("sample_rate", String(sampleRate));

      const endpoint = mode === "image" ? "/api/infer/image" : "/api/infer/video";
      const res = await fetch(endpoint, { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (mode === "image") setImageURL(url);
      else setVideoURL(url);
    } catch (error) {
      setErr(error?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const meta = modeMeta[mode];
  const canSubmit = Boolean(file) && !loading;

  return (
    <div className="app-shell">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="mesh" />

      <main className="page-shell">
        <section className="hero-card glass-card">
          <div className="hero-topline">
            <span className="chip chip-accent">Crop & Weed Detection</span>
            <span className="chip">Roboflow-powered</span>
          </div>

          <div className="hero-copy">
            <div className="hero-badge">{meta.icon}</div>
            <div>
              <p className="eyebrow">Fast field inspection</p>
              <h1>Upload a photo or clip and see crop detection in a clean, presentation-ready layout.</h1>
              <p className="hero-text">
                A polished upload experience with live previews, gentle motion, and a results panel designed for
                sharing on GitHub or demoing to a client.
              </p>
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <strong>Image</strong>
              <span>Single-frame analysis</span>
            </div>
            <div className="stat-card">
              <strong>Video</strong>
              <span>Sampled inference flow</span>
            </div>
            <div className="stat-card">
              <strong>UX</strong>
              <span>Responsive and decorative</span>
            </div>
          </div>
        </section>

        <section className="workspace-grid">
          <article className="panel glass-card">
            <div className="panel-header">
              <div>
                <p className="panel-label">Workspace</p>
                <h2>Upload controls</h2>
              </div>
              <span className="pill pill-muted">{meta.title}</span>
            </div>

            <div className="mode-switch" role="tablist" aria-label="Detection mode">
              <button
                type="button"
                className={mode === "image" ? "mode-button active" : "mode-button"}
                onClick={() => setMode("image")}
              >
                <span>Image</span>
                <small>Best for still frames</small>
              </button>
              <button
                type="button"
                className={mode === "video" ? "mode-button active" : "mode-button"}
                onClick={() => setMode("video")}
              >
                <span>Video</span>
                <small>Sample over time</small>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form-stack">
              <label className="dropzone">
                <input
                  type="file"
                  accept={mode === "image" ? "image/*" : "video/*"}
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
                <div className="dropzone-copy">
                  <span className="dropzone-icon">⬆</span>
                  <div>
                    <strong>Drop a file here or browse</strong>
                    <p>Accepted: {mode === "image" ? "JPEG, PNG, WebP" : "MP4, MOV, WebM"}</p>
                  </div>
                </div>
                {fileDetails ? (
                  <div className="file-pill">
                    <span>{fileDetails.name}</span>
                    <small>{fileDetails.size}</small>
                  </div>
                ) : (
                  <span className="file-hint">No file selected yet</span>
                )}
              </label>

              {mode === "video" && (
                <div className="field-card">
                  <div>
                    <label className="field-label" htmlFor="sampleRate">
                      Sampling rate
                    </label>
                    <p className="field-help">How many frames to skip between each detection request.</p>
                  </div>
                  <div className="field-inline">
                    <input
                      id="sampleRate"
                      type="range"
                      min="1"
                      max="12"
                      value={sampleRate}
                      onChange={(e) => setSampleRate(Number(e.target.value))}
                    />
                    <span className="range-value">Every {sampleRate} frame(s)</span>
                  </div>
                </div>
              )}

              <button type="submit" className="primary-button" disabled={!canSubmit}>
                {loading ? (
                  <>
                    <span className="spinner" /> Processing
                  </>
                ) : (
                  "Run detection"
                )}
              </button>

              {err && <div className="alert alert-error">{err}</div>}
              <div className="field-note">{meta.hint}</div>
            </form>
          </article>

          <aside className="panel glass-card preview-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Preview</p>
                <h2>Before and after</h2>
              </div>
              <span className="pill">Live state</span>
            </div>

            <div className="preview-stack">
              <section className="preview-box">
                <div className="preview-title-row">
                  <strong>Input</strong>
                  <span>{fileDetails ? fileDetails.type : "Waiting"}</span>
                </div>
                {previewURL ? (
                  mode === "image" ? (
                    <img src={previewURL} alt="Selected preview" className="preview-media" />
                  ) : (
                    <video src={previewURL} controls className="preview-media" />
                  )
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">◌</span>
                    <p>Choose a file to preview it here.</p>
                  </div>
                )}
              </section>

              <section className="result-box">
                <div className="preview-title-row">
                  <strong>Result</strong>
                  <span>{loading ? "Analyzing" : imageURL || videoURL ? "Ready" : "Pending"}</span>
                </div>
                {imageURL && <img src={imageURL} alt="Annotated result" className="preview-media" />}
                {videoURL && <video src={videoURL} controls className="preview-media" />}
                {!imageURL && !videoURL && (
                  <div className="empty-state muted">
                    <span className="empty-icon">▣</span>
                    <p>Annotated output will appear here after detection.</p>
                  </div>
                )}
              </section>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

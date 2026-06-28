import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Car, Cpu, Activity, ArrowRight, Loader2 } from 'lucide-react';

export default function Home({ onAnalysisComplete, settings }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStr, setErrorStr] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorStr('');
    } else {
      setErrorStr('Please select a valid image file (.jpg, .png, .jpeg)');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setErrorStr('');

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('filename', selectedFile.name);
    formData.append('yolo_conf', settings.yolo_conf.toString());
    formData.append('motion_threshold', settings.motion_threshold.toString());
    formData.append('padding_percent', settings.padding_percent.toString());
    formData.append('min_crop_px', settings.min_crop_px.toString());

    try {
      const backendHost = window.location.hostname || 'localhost';
      const res = await fetch(`http://${backendHost}:5000/api/detect`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Backend server returned an error.');
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      onAnalysisComplete(data);
      navigate('/results');
    } catch (err) {
      setErrorStr(err.message || 'Failed to connect to Java backend on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="hero-section">
        <h1 className="hero-title">🚗 Intelligent Traffic Pipeline</h1>
        <p className="hero-subtitle">
          Real-time AI vehicle detection with YOLOv8 & Laplacian edge-sharpness motion classification.
          Upload CCTV or highway surveillance imagery to instantly detect moving and standing vehicles.
        </p>
      </div>

      <div className="upload-container">
        <div 
          className={`dropzone ${dragActive ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput').click()}
        >
          <input 
            type="file" 
            id="fileInput" 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={(e) => e.target.files[0] && handleFileChange(e.target.files[0])}
          />
          <div className="dropzone-icon">
            <UploadCloud size={36} />
          </div>
          <div className="dropzone-text">
            {selectedFile ? selectedFile.name : 'Click or Drag & Drop Traffic Image Here'}
          </div>
          <div className="dropzone-subtext">
            Supports High-Resolution Surveillance JPEGs, PNGs up to 20MB
          </div>
        </div>

        {previewUrl && (
          <div className="glass-card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Selected Image Preview</h3>
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ maxHeight: '350px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} 
            />
          </div>
        )}

        {errorStr && (
          <div style={{ color: 'var(--moving-red)', background: 'rgba(255,71,87,0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid var(--moving-red)' }}>
            ⚠️ {errorStr}
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button 
            className="btn-primary" 
            onClick={handleAnalyze} 
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Processing YOLOv8 & Edge Pipeline...
              </>
            ) : (
              <>
                Run Motion Detection Pipeline <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
        <div className="glass-card">
          <Car size={32} style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }} />
          <h3>YOLOv8 Detection</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Multi-class vehicle detection identifying cars, buses, trucks, motorcycles, and bicycles with high precision.
          </p>
        </div>

        <div className="glass-card">
          <Activity size={32} style={{ color: 'var(--standing-green)', marginBottom: '1rem' }} />
          <h3>Edge Sharpness Analysis</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Triple-signal classification (Laplacian variance, Canny density, Sobel mean) to differentiate stationary vs moving motion blur.
          </p>
        </div>

        <div className="glass-card">
          <Cpu size={32} style={{ color: 'var(--moving-red)', marginBottom: '1rem' }} />
          <h3>High-Quality Upscaling</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Enforces minimum crop dimensions with INTER_CUBIC interpolation to eliminate hazy, pixelated vehicle inspects.
          </p>
        </div>
      </div>
    </div>
  );
}

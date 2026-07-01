import React from 'react';
import { Info, Cpu, Layers, Activity, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function About() {
  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      <div className="hero-section" style={{ paddingBottom: '1.5rem' }}>
        <h1 className="hero-title">About Traffic AI Pipeline</h1>
        <p className="hero-subtitle">
          Advanced Computer Vision architecture combining Deep Learning object detection with classical image sharpness algorithms for intelligent surveillance analytics.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Architecture Overview */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Layers className="text-cyan-400" size={24} style={{ color: 'var(--accent-cyan)' }} /> 
            Dual-Stage Pipeline Architecture
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
            Traditional motion detection in CCTV surveillance relies heavily on video frame differencing or optical flow, which requires sequential frames and is sensitive to camera shaking. Our system introduces a single-image <strong>Edge-Sharpness Classifier</strong> operating on isolated vehicle crops.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--accent-cyan)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Core System Workflow:</h4>
            <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <li><strong>Stage 1 (Detection):</strong> YOLOv8 (Medium model) scans the traffic scene and extracts bounding boxes for vehicle classes (cars, buses, trucks, motorcycles, bicycles).</li>
              <li><strong>Stage 2 (Cropping & Upscaling):</strong> Crops are extracted with 15% context padding and upscaled via INTER_CUBIC interpolation if below 120px.</li>
              <li><strong>Stage 3 (Edge Sharpness Scoring):</strong> Three independent mathematical edge signals assess motion blur versus stationary sharpness.</li>
            </ol>
          </div>
        </div>

        {/* Mathematical Formulation */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Activity size={24} style={{ color: 'var(--moving-red)' }} /> 
            Mathematical Formulation of Edge Sharpness
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            Stationary vehicles captured by surveillance cameras possess sharp structural outlines, high contrast edges, and crisp high-frequency details. In contrast, moving vehicles suffer from directional motion blur, smoothing out high frequencies and reducing edge density.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>1. Laplacian Variance</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Measures total high-frequency content. A second-order derivative operator highlights rapid intensity changes. Higher variance corresponds to crisp focus.
              </p>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--standing-green)', marginBottom: '0.5rem' }}>2. Canny Edge Density</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Calculates the ratio of edge pixels after Gaussian smoothing (5x5 kernel) and hysteresis thresholding (30, 100), capturing structural vehicle outlines.
              </p>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--moving-red)', marginBottom: '0.5rem' }}>3. Sobel Gradient Mean</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Computes first-order spatial gradients in horizontal and vertical directions ($G = \sqrt{G_x^2 + G_y^2}$), acting as a reliable tiebreaker for contrast.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,210,255,0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', textAlign: 'center' }}>
            Score = (0.5 * min(LapVar/300, 1.0)) + (0.3 * min(CannyDensity/0.10, 1.0)) + (0.2 * min(SobelMean/40, 1.0))
          </div>
        </div>

        {/* System Tech Stack Specs */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Cpu size={24} style={{ color: 'var(--standing-green)' }} /> 
            System Architecture & Network Ports
          </h3>
          <div className="grid-responsive-about" style={{ fontSize: '0.95rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>💻 React Frontend</h4>
              <p style={{ color: 'var(--text-secondary)' }}>• Environment: React.js (Vite Engine)</p>
              <p style={{ color: 'var(--text-secondary)' }}>• Active Port: <strong>Port 4000</strong></p>
              <p style={{ color: 'var(--text-secondary)' }}>• Styling: Custom Dark Glassmorphism CSS</p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <h4 style={{ color: 'var(--standing-green)', marginBottom: '0.5rem' }}>☕ Java Backend Service</h4>
              <p style={{ color: 'var(--text-secondary)' }}>• Environment: Java HTTP REST API (JDK 17+)</p>
              <p style={{ color: 'var(--text-secondary)' }}>• Active Port: <strong>Port 5000</strong></p>
              <p style={{ color: 'var(--text-secondary)' }}>• Python Bridge: Ultralytics YOLOv8 + OpenCV</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

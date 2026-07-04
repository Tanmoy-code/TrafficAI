import React from 'react';
import { Sliders, RotateCcw, Save } from 'lucide-react';

export default function Settings({ settings, onUpdateSettings }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onUpdateSettings({
      ...settings,
      [name]: parseFloat(value)
    });
  };

  const handleReset = () => {
    onUpdateSettings({
      yolo_conf: 0.30,
      motion_threshold: 0.90,
      padding_percent: 0.15,
      min_crop_px: 120
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2>⚙️ Pipeline Configuration & Tuner</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Adjust detection confidence, motion sharpness threshold, and crop sizing parameters.
        </p>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Setting 1: YOLO Confidence */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>🎯 YOLOv8 Confidence Threshold (conf)</label>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{settings.yolo_conf.toFixed(2)}</span>
          </div>
          <input 
            type="range" 
            name="yolo_conf" 
            min="0.10" 
            max="0.90" 
            step="0.05" 
            value={settings.yolo_conf} 
            onChange={handleChange}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
          />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Lower values detect more vehicles (may increase false positives). Higher values increase detection strictness.
          </p>
        </div>

        {/* Setting 2: Motion Threshold */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>⚡ Motion Sharpness Threshold (MOTION_THRESHOLD)</label>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--moving-red)' }}>{settings.motion_threshold.toFixed(2)}</span>
          </div>
          <input 
            type="range" 
            name="motion_threshold" 
            min="0.30" 
            max="0.95" 
            step="0.01" 
            value={settings.motion_threshold} 
            onChange={handleChange}
            style={{ width: '100%', accentColor: 'var(--moving-red)' }}
          />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Scores BELOW this threshold = 🔴 MOVING (blurry crop). Scores ABOVE = 🟢 STANDING (sharp crop). Default: 0.90.
          </p>
        </div>

        {/* Setting 3: Padding Percent */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>🖼️ Crop Context Padding Percentage</label>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--standing-green)' }}>{(settings.padding_percent * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" 
            name="padding_percent" 
            min="0.00" 
            max="0.40" 
            step="0.05" 
            value={settings.padding_percent} 
            onChange={handleChange}
            style={{ width: '100%', accentColor: 'var(--standing-green)' }}
          />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Background context around each cropped vehicle bounding box.
          </p>
        </div>

        {/* Setting 4: Min Crop Size */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>📏 Minimum Crop Size (Pixels)</label>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{settings.min_crop_px} px</span>
          </div>
          <input 
            type="range" 
            name="min_crop_px" 
            min="60" 
            max="250" 
            step="10" 
            value={settings.min_crop_px} 
            onChange={handleChange}
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Small vehicle bounding boxes are upscaled using INTER_CUBIC interpolation to avoid pixelation.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <button className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', boxShadow: 'none' }} onClick={handleReset}>
            <RotateCcw size={18} /> Reset Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

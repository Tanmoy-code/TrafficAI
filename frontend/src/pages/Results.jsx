import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, AlertTriangle, CheckCircle2, Eye, X, Sliders, ArrowLeft } from 'lucide-react';

export default function Results({ analysisData }) {
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  if (!analysisData) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <h2>No Active Analysis Data</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem 0' }}>
          Please upload a traffic image on the home page first.
        </p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Go to Upload Page
        </button>
      </div>
    );
  }

  const { total_vehicles, moving_count, standing_count, annotated_image, vehicles } = analysisData;

  return (
    <div>
      <div className="flex-responsive" style={{ marginBottom: '2rem' }}>
        <div>
          <h2>🚦 Traffic Motion Analytics Results</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            YOLOv8 & Edge Sharpness Classification Breakdown
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Analyze Another Image
        </button>
      </div>

      {/* Summary Statistics Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0, 210, 255, 0.15)', color: 'var(--accent-cyan)' }}>
            <Car size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{total_vehicles}</div>
            <div className="stat-label">Total Vehicles Detected</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 71, 87, 0.15)', color: 'var(--moving-red)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--moving-red)' }}>{moving_count}</div>
            <div className="stat-label">🔴 MOVING (Blurry Edges)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(46, 213, 115, 0.15)', color: 'var(--standing-green)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--standing-green)' }}>{standing_count}</div>
            <div className="stat-label">🟢 STANDING (Sharp Edges)</div>
          </div>
        </div>
      </div>

      <div className="results-grid">
        {/* Left Column: Annotated Original Image */}
        <div className="glass-card">
          <h3>📸 Annotated Traffic Overview</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Bounding boxes: 🔴 Red = Moving | 🟢 Green = Standing
          </p>
          <div style={{ background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden', textAlign: 'center' }}>
            <img 
              src={`data:image/jpeg;base64,${annotated_image}`} 
              alt="Annotated Traffic" 
              style={{ width: '100%', maxHeight: '550px', objectFit: 'contain' }} 
            />
          </div>
        </div>

        {/* Right Column: Vehicle Breakdown & Insights */}
        <div>
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h3>📊 Detection Summary</h3>
            <div style={{ marginTop: '1rem' }}>
              {vehicles && vehicles.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem' }}>#</th>
                      <th style={{ padding: '0.5rem' }}>Type</th>
                      <th style={{ padding: '0.5rem' }}>Motion</th>
                      <th style={{ padding: '0.5rem' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)' }}>#{v.id}</td>
                        <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{v.vehicle}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <span className={`crop-badge ${v.motion}`}>
                            {v.motion}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)' }}>{v.score.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No vehicles detected in image.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cropped Vehicles Grid */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <div className="flex-responsive" style={{ marginBottom: '1rem' }}>
          <h3>🔍 Isolated Vehicle Crops ({vehicles.length})</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click any vehicle crop to open Edge Sharpness Debug Strip</span>
        </div>

        <div className="crops-grid">
          {vehicles.map((v) => (
            <div 
              key={v.id} 
              className={`crop-card ${v.motion}`}
              onClick={() => setSelectedVehicle(v)}
            >
              <div className="crop-img-wrapper">
                <img src={`data:image/jpeg;base64,${v.crop_base64}`} alt={v.vehicle} />
              </div>
              <div className="crop-details">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <strong>#{v.id} {v.vehicle}</strong>
                  <span className={`crop-badge ${v.motion}`}>{v.motion}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  Score: {v.score.toFixed(3)} | Conf: {(v.det_conf * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Strip Modal */}
      {selectedVehicle && (
        <div className="modal-overlay" onClick={() => setSelectedVehicle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVehicle(null)}>
              <X size={24} />
            </button>

            <h3>
              🔍 Per-Crop Debug Strip: #{selectedVehicle.id} {selectedVehicle.vehicle.toUpperCase()}
            </h3>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <span className={`crop-badge ${selectedVehicle.motion}`}>
                STATUS: {selectedVehicle.motion.toUpperCase()}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Combined Score: <strong>{selectedVehicle.score.toFixed(4)}</strong>
              </span>
            </div>

            <div className="debug-strip">
              <div className="debug-panel">
                <img src={`data:image/jpeg;base64,${selectedVehicle.crop_base64}`} alt="RGB Crop" />
                <div className="debug-title">1. RGB Crop (Upscaled)</div>
              </div>

              <div className="debug-panel">
                <img src={`data:image/jpeg;base64,${selectedVehicle.gray_base64}`} alt="Grayscale" />
                <div className="debug-title">2. Grayscale View</div>
              </div>

              <div className="debug-panel">
                <img src={`data:image/jpeg;base64,${selectedVehicle.edges_base64}`} alt="Canny Edges" />
                <div className="debug-title">3. Canny Edges Map</div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-main)' }}>📐 Edge Sharpness Metrics:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div>• Laplacian Variance: <strong>{selectedVehicle.lap_var}</strong></div>
                <div>• Canny Edge Density: <strong>{selectedVehicle.edge_density}</strong></div>
                <div>• Sobel Gradient Mean: <strong>{selectedVehicle.sobel_mean}</strong></div>
              </div>
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-main)' }}>
                * Note: High edge density and Laplacian variance indicate a stationary vehicle (STANDING). Low metrics indicate motion blur (MOVING).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

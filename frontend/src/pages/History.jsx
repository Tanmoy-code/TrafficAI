import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Car, AlertTriangle, CheckCircle2, Trash2, Eye, RefreshCw, X, ArrowLeft } from 'lucide-react';

export default function History({ onSelectAnalysis }) {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorStr, setErrorStr] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setErrorStr('');
    try {
      const backendHost = window.location.hostname || 'localhost';
      const res = await fetch(`http://${backendHost}:5000/api/history`);
      if (!res.ok) {
        throw new Error('Failed to fetch history from server.');
      }
      const data = await res.json();
      setHistoryItems(data);
      if (data.length > 0 && !expandedId) {
        setExpandedId(data[0].run_id);
      }
    } catch (err) {
      setErrorStr(err.message || 'Could not load history from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteItem = async (runId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this detection record from the server?')) return;
    try {
      const backendHost = window.location.hostname || 'localhost';
      await fetch(`http://${backendHost}:5000/api/history?id=${runId}`, { method: 'DELETE' });
      setHistoryItems(prev => prev.filter(item => item.run_id !== runId));
      if (expandedId === runId) setExpandedId(null);
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete ALL historical records from the server?')) return;
    try {
      const backendHost = window.location.hostname || 'localhost';
      await fetch(`http://${backendHost}:5000/api/history`, { method: 'DELETE' });
      setHistoryItems([]);
      setExpandedId(null);
    } catch (err) {
      alert('Failed to clear history.');
    }
  };

  const handleViewInAnalytics = (item) => {
    if (onSelectAnalysis) {
      onSelectAnalysis(item);
      navigate('/results');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>📜 Historical Detection Runs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Permanent server-side archives of all surveillance analyses performed to date.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" style={{ background: 'rgba(255,255,255,0.08)', boxShadow: 'none' }} onClick={fetchHistory}>
            <RefreshCw size={18} /> Refresh
          </button>
          {historyItems.length > 0 && (
            <button className="btn-primary" style={{ background: 'rgba(255, 71, 87, 0.2)', color: 'var(--moving-red)', border: '1px solid var(--moving-red)', boxShadow: 'none' }} onClick={handleClearAll}>
              <Trash2 size={18} /> Clear All History
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }} />
          <h3>Retrieving Analysis Archives...</h3>
        </div>
      ) : errorStr ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px solid var(--moving-red)' }}>
          <AlertTriangle size={36} style={{ color: 'var(--moving-red)', marginBottom: '1rem' }} />
          <h3>Error Loading Archives</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem 0' }}>{errorStr}</p>
          <button className="btn-primary" onClick={fetchHistory}>Try Again</button>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h2>No Past Detections Found</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem 0' }}>
            Upload and analyze traffic surveillance imagery on the home page to begin building your detection history archive.
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            <ArrowLeft size={18} /> Go to Upload Page
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {historyItems.map((item) => {
            const isExpanded = expandedId === item.run_id;
            const { total_vehicles = 0, moving_count = 0, standing_count = 0, annotated_image, vehicles = [] } = item;

            return (
              <div key={item.run_id} className="glass-card" style={{ borderLeft: isExpanded ? '4px solid var(--accent-cyan)' : '1px solid var(--border-color)' }}>
                {/* Header bar for card */}
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : item.run_id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(0,210,255,0.1)', color: 'var(--accent-cyan)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <Car size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                        {item.filename || 'Traffic_Analysis.jpg'}
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        🕒 {item.timestamp || 'Recorded'} | ID: {item.run_id ? item.run_id.substring(0, 8) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <span className="crop-badge" style={{ background: 'rgba(0,210,255,0.15)', color: 'var(--accent-cyan)' }}>
                        Total: {total_vehicles}
                      </span>
                      <span className="crop-badge moving">
                        Moving: {moving_count}
                      </span>
                      <span className="crop-badge standing">
                        Standing: {standing_count}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={(e) => { e.stopPropagation(); handleViewInAnalytics(item); }}
                        title="Open in Analytics tab"
                      >
                        <Eye size={16} /> Load Analytics
                      </button>
                      <button 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}
                        onClick={(e) => handleDeleteItem(item.run_id, e)}
                        title="Delete Record"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div className="results-grid">
                      <div>
                        <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>📸 Annotated Surveillance Image</h4>
                        <div style={{ background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden', textAlign: 'center' }}>
                          <img 
                            src={`data:image/jpeg;base64,${annotated_image}`} 
                            alt="Annotated Traffic Archive" 
                            style={{ width: '100%', maxHeight: '450px', objectFit: 'contain' }} 
                          />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>📊 Detected Vehicles ({vehicles.length})</h4>
                        {vehicles.length > 0 ? (
                          <div style={{ maxHeight: '450px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                  <th style={{ padding: '0.4rem' }}>#</th>
                                  <th style={{ padding: '0.4rem' }}>Class</th>
                                  <th style={{ padding: '0.4rem' }}>State</th>
                                  <th style={{ padding: '0.4rem' }}>Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vehicles.map((v) => (
                                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '0.4rem', fontFamily: 'var(--font-mono)' }}>#{v.id}</td>
                                    <td style={{ padding: '0.4rem', textTransform: 'capitalize' }}>{v.vehicle}</td>
                                    <td style={{ padding: '0.4rem' }}><span className={`crop-badge ${v.motion}`}>{v.motion}</span></td>
                                    <td style={{ padding: '0.4rem', fontFamily: 'var(--font-mono)' }}>{v.score ? v.score.toFixed(3) : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-muted)' }}>No vehicles detected.</p>
                        )}
                      </div>
                    </div>

                    {/* Crops breakdown */}
                    <div style={{ marginTop: '1.5rem' }}>
                      <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>🔍 Vehicle Crops & Edge Diagnostics</h4>
                      <div className="crops-grid">
                        {vehicles.map((v) => (
                          <div key={v.id} className={`crop-card ${v.motion}`} onClick={() => setSelectedVehicle(v)}>
                            <div className="crop-img-wrapper">
                              <img src={`data:image/jpeg;base64,${v.crop_base64}`} alt={v.vehicle} />
                            </div>
                            <div className="crop-details">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>#{v.id} {v.vehicle}</strong>
                                <span className={`crop-badge ${v.motion}`}>{v.motion}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vehicle Debug Strip Modal */}
      {selectedVehicle && (
        <div className="modal-overlay" onClick={() => setSelectedVehicle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVehicle(null)}>
              <X size={24} />
            </button>

            <h3>
              🔍 Historical Crop Analysis: #{selectedVehicle.id} {selectedVehicle.vehicle.toUpperCase()}
            </h3>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <span className={`crop-badge ${selectedVehicle.motion}`}>
                STATUS: {selectedVehicle.motion.toUpperCase()}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Combined Score: <strong>{selectedVehicle.score ? selectedVehicle.score.toFixed(4) : '-'}</strong>
              </span>
            </div>

            <div className="debug-strip">
              <div className="debug-panel">
                <img src={`data:image/jpeg;base64,${selectedVehicle.crop_base64}`} alt="RGB Crop" />
                <div className="debug-title">1. RGB Crop</div>
              </div>

              <div className="debug-panel">
                <img src={`data:image/jpeg;base64,${selectedVehicle.gray_base64}`} alt="Grayscale" />
                <div className="debug-title">2. Grayscale</div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

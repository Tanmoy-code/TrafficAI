import React from 'react';
import { Layers, FileCode, Server, Monitor, Cloud, Award, Users, BookOpen } from 'lucide-react';

export default function About() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Project Title Hero */}
      <div className="hero-section" style={{ paddingBottom: '2rem' }}>
        <h1 className="hero-title">Traffic Motion AI</h1>
        <p className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
          YOLOv8 & Classical Edge-Sharpness Surveillance Classification Pipeline
        </p>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
          An advanced, dual-stage computer vision system designed to detect vehicles and classify their motion states (moving vs. standing) from individual surveillance images.
        </p>
      </div>

      {/* Development Journey / Timeline */}
      <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Layers size={24} style={{ color: 'var(--accent-cyan)' }} /> 
          Project Evolution & Creation Guide
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'rgba(0, 210, 255, 0.15)', color: 'var(--accent-cyan)', padding: '0.6rem', borderRadius: '50%', display: 'flex' }}>
                <FileCode size={20} />
              </div>
              <div style={{ width: '2px', flex: 1, background: 'var(--border-color)', marginTop: '0.5rem' }}></div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Step 1: Model Prototyping (`.ipynb` research)</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Developed the core logic in a Jupyter Notebook (`detection.ipynb`). Explored classical image processing filters (Laplacian Variance, Canny Edge Density, and Sobel Gradients) to identify directional motion blur and contrast variance on cropped bounding boxes.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'rgba(46, 213, 115, 0.15)', color: 'var(--standing-green)', padding: '0.6rem', borderRadius: '50%', display: 'flex' }}>
                <Server size={20} />
              </div>
              <div style={{ width: '2px', flex: 1, background: 'var(--border-color)', marginTop: '0.5rem' }}></div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Step 2: Backend Development (Java HTTP API)</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Built a high-performance Java REST API using JDK 17 standard libraries. Handles surveillance image uploads, maintains history archives, and provides robust configuration management for the pipeline parameters.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'rgba(255, 71, 87, 0.15)', color: 'var(--moving-red)', padding: '0.6rem', borderRadius: '50%', display: 'flex' }}>
                <Layers size={20} />
              </div>
              <div style={{ width: '2px', flex: 1, background: 'var(--border-color)', marginTop: '0.5rem' }}></div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Step 3: Python Pipeline & Java Integration</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Integrated the Java server with the Python pipeline (`pipeline.py`). Java spawns a subprocess execution to run YOLOv8 object detection, crop vehicles with context padding, evaluate metrics, and translate complex binary analysis results into JSON arrays.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'rgba(0, 210, 255, 0.15)', color: 'var(--accent-cyan)', padding: '0.6rem', borderRadius: '50%', display: 'flex' }}>
                <Monitor size={20} />
              </div>
              <div style={{ width: '2px', flex: 1, background: 'var(--border-color)', marginTop: '0.5rem' }}></div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Step 4: Frontend Development (React & CSS)</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Designed a beautiful dark glassmorphic user interface using React.js and CSS. Features dropzones, custom interactive slider widgets, real-time analytics graphs, isolated crop viewers, and full mobile-first responsiveness.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: '50%', display: 'flex' }}>
                <Cloud size={20} />
              </div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Step 5: AWS EC2 Cloud Hosting & DB Setup</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Hosted the services on an AWS EC2 instance. Configured MySQL for user database management, and set up systemd and PM2 process persistence. Created `setup_ec2.sh` to automate environment builds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Contributors Section */}
      <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Users size={24} style={{ color: 'var(--accent-cyan)' }} /> 
          Project Contributors
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Contributor 1 */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Tanmoy Mondal</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>Roll No: 13030822078</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>8th Sem, 4th Year | CSE AIML (Student)</p>
          </div>

          {/* Contributor 2 */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Soumyadip Dutta</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>Roll No: 13030822077</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>8th Sem, 4th Year | CSE AIML (Student)</p>
          </div>

          {/* Contributor 3 */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Swarnali Pramanik</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>Roll No: 13030823136</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>8th Sem, 4th Year | CSE AIML (Student)</p>
          </div>

          {/* Contributor 4 */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Sayan Pramanick</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>Roll No: 13030823133</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>8th Sem, 4th Year | CSE AIML (Student)</p>
          </div>

          {/* Contributor 5 */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Subhrajit Ghosh</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>Roll No: 130308220917</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>8th Sem, 4th Year | CSE AIML (Student)</p>
          </div>
        </div>
      </div>

      {/* Mentor Section */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--standing-green)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Award size={24} style={{ color: 'var(--standing-green)' }} /> 
          Under the Guidance of
        </h3>
        <div style={{ padding: '0.5rem 0.75rem' }}>
          <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Prof. Poojarini Mitra</h4>
          <p style={{ color: 'var(--accent-cyan)', fontWeight: 500, fontSize: '0.95rem', marginBottom: '0.2rem' }}>Designation: Assistant Professor</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>CSE AIML Department</p>
        </div>
      </div>
    </div>
  );
}

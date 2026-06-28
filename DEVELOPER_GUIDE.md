# 📘 Comprehensive Developer Guide: Traffic AI Motion Detection System

Welcome to the **Traffic AI Motion Detection & Analytics System** codebase! This guide is written for engineers and developers who are completely new to this project. It provides an end-to-end breakdown of the system architecture, mathematical computer vision algorithms, backend process orchestration, frontend reactive UI, setup instructions, and troubleshooting guides.

---

## 📑 Table of Contents
1. [Project Overview & Problem Statement](#-project-overview--problem-statement)
2. [High-Level System Architecture](#-high-level-system-architecture)
3. [Deep-Dive: Computer Vision Engine (Python)](#-deep-dive-computer-vision-engine-python)
4. [Deep-Dive: Backend REST API (Java)](#-deep-dive-backend-rest-api-java)
5. [Deep-Dive: Reactive Frontend (React + Vite)](#-deep-dive-reactive-frontend-react--vite)
6. [Directory & File Anatomy](#-directory--file-anatomy)
7. [Developer Setup & Execution Guide](#-developer-setup--execution-guide)
8. [API Reference & Data Contracts](#-api-reference--data-contracts)
9. [Troubleshooting & Common Edge Cases](#-troubleshooting--common-edge-cases)

---

## 🎯 Project Overview & Problem Statement

### The Problem
Traditional traffic surveillance motion detection relies on video frame differencing or optical flow across sequential video frames. However, in real-world CCTV deployments:
1. Cameras shake due to wind or high-vibration poles, causing false motion alarms.
2. Sequential video streams require high bandwidth and cloud processing power.
3. Analyzing static snapshot images (e.g., from red-light cameras or highway sensors) was previously impossible with frame-differencing.

### The Solution
This application introduces a **Single-Image Motion Classifier** operating on individual surveillance photographs. It uses a dual-stage AI architecture:
1. **Object Detection**: Uses **YOLOv8** (You Only Look Once v8) to detect and bound vehicles (`car`, `bus`, `truck`, `motorcycle`, `bicycle`).
2. **Edge Sharpness Motion Classification**: Operates on isolated vehicle crops. Because stationary vehicles have crisp, sharp structural edges while moving vehicles suffer from directional motion blur, we combine three mathematical edge signals (**Laplacian Variance**, **Canny Edge Density**, and **Sobel Gradient Mean**) into a unified motion score ($0.0$ to $1.0$).

---

## 🏗️ High-Level System Architecture

The application is structured as a decoupled, multi-tier system:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           REACT FRONTEND SPA                             │
│                         http://localhost:4000                            │
│  - Reactive Dashboard (Home, Results, Settings, About)                   │
│  - Modern Dark Glassmorphism UI (Outfit font, CSS variables)             │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     │ HTTP POST /api/detect (Multipart Form)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         JAVA REST BACKEND SERVICE                        │
│                         http://localhost:5000                            │
│  - Multi-threaded HttpServer (com.sun.net.httpserver)                    │
│  - Multipart Parser & Binary File Stream Extractor                       │
│  - ProcessBuilder Orchestrator (Executes Python CLI)                     │
│  - Robust JSON Sanitizer & Escape Stream Handler                         │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     │ ProcessBuilder (stdout / stderr)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         PYTHON CV PIPELINE ENGINE                        │
│                         backend/python_pipeline/pipeline.py              │
│  - Ultralytics YOLOv8m Object Detector                                   │
│  - OpenCV Image Operations & INTER_CUBIC Upscaling                        │
│  - Laplacian + Canny + Sobel Edge Sharpness Calculator                   │
│  - Base64 JPEG Image Encoder & JSON Output Generator                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Deep-Dive: Computer Vision Engine (Python)

File: `backend/python_pipeline/pipeline.py`

### 1. Object Detection (YOLOv8)
When an image is passed to `run_pipeline()`, YOLOv8 detects objects. We filter detections using `VEHICLE_CLASSES`:
```python
VEHICLE_CLASSES = {1: "bicycle", 2: "car", 3: "motorcycle", 5: "bus", 6: "train", 7: "truck"}
```
Detections are extracted as bounding box coordinates `[x1, y1, x2, y2]` along with confidence scores.

### 2. Crop Sizing & Upscaling
To prevent tiny or distant vehicles from returning noisy sharpness metrics, crops are processed with two rules:
- **Padding Context**: Extends the bounding box by 15% (`padding_percent=0.15`) to capture surrounding roadway contrast.
- **Minimum Resolution Enforcement**: If `min(crop_height, crop_width) < 120px`, the crop is upscaled using `cv2.INTER_CUBIC` interpolation.

### 3. Edge Sharpness Scoring Algorithm (`compute_edge_sharpness`)
The core classifier converts the BGR crop to Grayscale and computes three mathematical signals:

1. **Laplacian Variance ($\sigma^2_{Lap}$)**:
   Measures high-frequency changes using a 2nd-order derivative operator.
   ```python
   lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
   ```
   *Normalizer*: 300.0 (Tuned for surveillance optics).

2. **Canny Edge Density ($D_{Canny}$)**:
   Smoothes image with a 5x5 Gaussian blur, applies Canny edge detection (thresholds 30, 100), and calculates edge pixel ratio:
   ```python
   blurred = cv2.GaussianBlur(gray, (5, 5), 1.0)
   edges = cv2.Canny(blurred, 30, 100)
   edge_density = edges.sum() / (255.0 * edges.size)
   ```
   *Normalizer*: 0.10.

3. **Sobel Gradient Mean ($\mu_{Sobel}$)**:
   Computes first-order spatial gradients ($G = \sqrt{G_x^2 + G_y^2}$):
   ```python
   sx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
   sy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
   mag = np.sqrt(sx**2 + sy**2).mean()
   ```
   *Normalizer*: 40.0.

#### Combined Formula:
$$\text{Score} = 0.5 \cdot \min\left(\frac{\sigma^2_{Lap}}{300}, 1.0\right) + 0.3 \cdot \min\left(\frac{D_{Canny}}{0.10}, 1.0\right) + 0.2 \cdot \min\left(\frac{\mu_{Sobel}}{40}, 1.0\right)$$

- If $\text{Score} \ge \text{MOTION\_THRESHOLD}$ (default `0.90`) $\rightarrow$ **🟢 STANDING** (Sharp)
- If $\text{Score} < \text{MOTION\_THRESHOLD}$ $\rightarrow$ **🔴 MOVING** (Motion Blur)

---

## ☕ Deep-Dive: Backend REST API (Java)

File: `backend/src/main/java/com/traffic/backend/TrafficDetectionServer.java`

### Key Highlights
- Built using Java's zero-dependency `com.sun.net.httpserver.HttpServer` listening on **Port 5000**.
- Uses a thread pool executor (`Executors.newFixedThreadPool(10)`) for multi-threaded request processing.
- Handles CORS pre-flight `OPTIONS` requests across all endpoints.

### Process Isolation & JSON Sanitization
To prevent library logging (e.g., download progress bars or PyTorch warnings) from corrupting the JSON API response:
1. `pipeline.py` redirects all logging to `sys.stderr` during execution, reserving `sys.stdout` exclusively for JSON output.
2. `TrafficDetectionServer.java` includes a substring filter that locates the first `{` and last `}` in stdout.
3. All error payloads pass through `escapeJson()`, which replaces control characters (`\n`, `\r`, `\t`, `\"`) with safe escape sequences to guarantee valid JSON responses.

---

## 🎨 Deep-Dive: Reactive Frontend (React + Vite)

Location: `frontend/`

### Page Responsibilities
1. **`Home.jsx`**: Manages file selection, drag-and-drop state, and dispatches multipart HTTP POST requests to `http://localhost:5000/api/detect`.
2. **`Results.jsx`**: Renders summary statistics (Total Vehicles, Moving vs Standing), annotated image overlay, vehicle breakdown table, interactive crop grid, and a **Per-Crop Debug Strip Modal** showing RGB crop, Grayscale, and Canny heatmap views.
3. **`Settings.jsx`**: Provides interactive range sliders to dynamically adjust `yolo_conf`, `motion_threshold`, `padding_percent`, and `min_crop_px`.
4. **`About.jsx`**: Provides educational material on algorithm mathematics and architecture.

### Design System (`src/index.css`)
Uses modern CSS variables (`--bg-dark`, `--accent-cyan`, `--moving-red`, `--standing-green`), glassmorphism cards (`backdrop-filter: blur(16px)`), and Google Font **Outfit**.

---

## 📂 Directory & File Anatomy

```
Website/
├── DEVELOPER_GUIDE.md               # Developer onboarding guide
├── README.md                        # User execution guide & quickstart
├── detection.ipynb                  # Original research notebook
│
├── backend/                         # Java REST Backend
│   ├── src/main/java/com/traffic/backend/
│   │   └── TrafficDetectionServer.java  # Main Java HttpServer & Process Builder
│   ├── python_pipeline/
│   │   └── pipeline.py              # YOLOv8 & Edge Sharpness script
│   ├── pom.xml                      # Maven configuration
│   └── run.bat                      # Windows startup script (detects JDK 17)
│
└── frontend/                        # React Single Page Application
    ├── index.html                   # HTML template & SEO metadata
    ├── vite.config.js               # Vite config locked to Port 4000
    ├── package.json                 # React dependencies (lucide-react, react-router-dom)
    └── src/
        ├── main.jsx                 # Entry point
        ├── App.jsx                  # Navigation router & top-level state
        ├── index.css                # Glassmorphism CSS design system
        └── pages/
            ├── Home.jsx             # File upload dashboard
            ├── Results.jsx          # Motion analytics & debug modal
            ├── Settings.jsx         # Parameter tuner
            └── About.jsx            # Documentation page
```

---

## 💻 Developer Setup & Execution Guide

### Prerequisites
1. **Node.js** (v18+) & **npm**
2. **Java JDK 17+** (Ensure `javac` and `java` are available or located in `C:\Program Files\Java\jdk-17\bin`)
3. **Python 3.10+** with required computer vision packages:
   ```bash
   pip install ultralytics opencv-python numpy Pillow
   ```

### Running the Application Localhost

#### 1. Start the Java Backend (Port 5000)
Open terminal 1:
```bash
cd backend
run.bat
```
*Verification*: Visit `http://localhost:5000/api/health` (Should return `{"status":"UP","port":5000}`).

#### 2. Start the React Frontend (Port 4000)
Open terminal 2:
```bash
cd frontend
npm install
npm run dev
```
*Access App*: Navigate to **[http://localhost:4000](http://localhost:4000)** in your browser.

---

## 📡 API Reference & Data Contracts

### Endpoint 1: Health Check
- **URL**: `/api/health`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "UP",
    "port": 5000,
    "service": "Traffic Detection Java API"
  }
  ```

### Endpoint 2: Detect & Classify Motion
- **URL**: `/api/detect`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `image` (File, Required): Binary traffic surveillance image.
  - `yolo_conf` (Float, Optional, Default: `0.30`): YOLO confidence threshold.
  - `motion_threshold` (Float, Optional, Default: `0.90`): Edge sharpness threshold.
  - `padding_percent` (Float, Optional, Default: `0.15`): Crop padding percentage.
  - `min_crop_px` (Int, Optional, Default: `120`): Min crop size in pixels.
- **Sample Success Response**:
  ```json
  {
    "success": true,
    "total_vehicles": 3,
    "moving_count": 1,
    "standing_count": 2,
    "annotated_image": "/9j/4AAQSkZJRg...",  // Base64 encoded JPEG
    "vehicles": [
      {
        "id": 1,
        "vehicle": "car",
        "det_conf": 0.89,
        "bbox": [120, 240, 310, 400],
        "motion": "standing",
        "mot_conf": 0.82,
        "score": 0.845,
        "lap_var": 320.5,
        "edge_density": 0.112,
        "sobel_mean": 42.1,
        "crop_base64": "/9j/4AAQSk...",
        "gray_base64": "/9j/4AAQSk...",
        "edges_base64": "/9j/4AAQSk..."
      }
    ]
  }
  ```

---

## 🛠️ Troubleshooting & Common Edge Cases

### 1. `Unexpected token '...', "...[KDownload..." is not valid JSON`
- **Cause**: Ultralytics downloading weights (`yolov8m.pt`) for the first time and outputting ANSI escape sequences to stdout.
- **Solution**: Handled in `pipeline.py` by redirecting stdout to stderr during execution and extracting JSON braces in `TrafficDetectionServer.java`.

### 2. `Bad control character in string literal in JSON`
- **Cause**: Unescaped newlines (`\n`) in Python stacktraces returned by the server.
- **Solution**: Handled by `escapeJson()` in `TrafficDetectionServer.java`.

### 3. Tuning Motion Classification Sensitivity
If vehicles are being misclassified:
- **Too many blurry vehicles labeled STANDING?** $\rightarrow$ Lower `MOTION_THRESHOLD` (e.g., to `0.65`).
- **Too many sharp vehicles labeled MOVING?** $\rightarrow$ Raise `MOTION_THRESHOLD` (e.g., to `0.85`).

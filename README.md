# 🚗 Traffic Motion Detection & Analytics Web Application

An intelligent, reactive, and responsive full-stack computer vision web application designed for traffic surveillance imagery analysis. It combines **YOLOv8** deep learning vehicle detection with a multi-signal **Edge-Sharpness Classifier** (Laplacian variance, Canny edge density, and Sobel gradient mean) to accurately distinguish between moving vehicles (directional motion blur) and standing vehicles (stationary sharp edges).

> 📘 **New to this codebase?** Check out our comprehensive [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for architectural deep-dives, algorithm mathematical formulas, and component walkthroughs.

---

## 🏗️ System Architecture

```
                               ┌────────────────────────────────────────┐
                               │   http://localhost:4000 (With Auth)    │
                               │   http://localhost:6000 (Without Auth) │
                               └───────────────────┬────────────────────┘
                                                   │
                                         POST /api/detect (Multipart)
                                                   │
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │      Java REST Backend Service         │
                               │         http://localhost:5000          │
                               └───────────────────┬────────────────────┘
                                                   │
                                        Executes Process Builder
                                                   │
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │   Python ML Pipeline (pipeline.py)     │
                               │  • YOLOv8 Vehicle Detection            │
                               │  • Laplacian + Canny + Sobel Scoring   │
                               └────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack & Ports

- **Auth Frontend (`/frontend`)**: React.js, Vite. Running on **Port 4000**.
- **No-Auth Frontend (`/frontend-without-authentication`)**: React.js, Vite. Running on **Port 6000**.
- **Backend (`/backend`)**: Java REST HTTP Service (JDK 17+), Gson / Standard HTTP Handler. Running on **Port 5000**.
- **ML Engine (`/backend/python_pipeline`)**: Python 3.11, Ultralytics YOLOv8 (`yolov8m.pt`), OpenCV (`cv2`), NumPy, PIL.

---

## 🚀 Step-by-Step Guide to Run in Localhost

### 📋 Prerequisites
Ensure you have the following installed on your machine:
1. **Node.js** (v18+ recommended) & **npm**
2. **Java JDK** (v17 or higher) in your system PATH
3. **Python** (v3.10+ recommended) with required packages:
   ```bash
   pip install ultralytics opencv-python numpy Pillow
   ```

---

### 1️⃣ Step 1: Start the Java Backend (Port 5000)

Open a terminal or command prompt and navigate to the `backend` directory:

```bash
cd backend
```

#### Option A: Using the 1-Click Batch Script (Windows)
Simply double-click or run:
```cmd
run.bat
```

#### Option B: Using Standard Java Commands
```bash
# Compile Java server files
javac -d bin src/main/java/com/traffic/backend/TrafficDetectionServer.java

# Run Java server
java -cp bin com.traffic.backend.TrafficDetectionServer
```

#### Option C: Using Maven
```bash
mvn compile exec:java
```

> ⚙️ **Verification**: Once started, verify the backend health check by visiting `http://localhost:5000/api/health` in your browser.

---

### 2️⃣ Step 2: Start the React Frontend (Port 4000 or Port 6000)

Depending on whether you want authentication enabled or bypassed, run one of the following:

#### Option A: With User Authentication (Port 4000)
Open a **new** terminal window and navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
> 🌐 **Access Website**: Open your browser and navigate to **[http://localhost:4000](http://localhost:4000)**.

#### Option B: Without User Authentication (Port 6000)
Open a **new** terminal window and navigate to the `frontend-without-authentication` directory:
```bash
cd frontend-without-authentication
npm install
npm run dev
```
> 🌐 **Access Website**: Open your browser and navigate to **[http://localhost:6000](http://localhost:6000)**.

---

## 📡 REST API Documentation (Port 5000)

| Endpoint | Method | Description | Payload / Response |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | System health check & active service status | `{"status":"UP","port":5000}` |
| `/api/settings` | `GET` | Fetches default pipeline threshold configuration | `{"yolo_conf":0.30,"motion_threshold":0.90}` |
| `/api/detect` | `POST` | Processes traffic image & returns detection JSON | **Form-data**: `image` (File), `yolo_conf`, `motion_threshold` |

---

## 📁 Project Directory Structure

```
Website/
├── backend/                        # Java REST Backend
│   ├── src/main/java/com/traffic/  # Java Server Source Code
│   ├── python_pipeline/            # YOLOv8 & OpenCV Python Scripts
│   │   └── pipeline.py             # Core Computer Vision Pipeline
│   ├── pom.xml                     # Maven Configuration
│   └── run.bat                     # Windows Startup Batch Script
├── frontend/                       # React.js SPA Frontend (With Auth, Port 4000)
│   ├── src/
│   │   ├── App.jsx                 # Configured with Auth context & ProtectedRoutes
│   │   └── ...
│   ├── vite.config.js              # Configured for Port 4000
│   └── package.json
├── frontend-without-authentication/# React.js SPA Frontend (No Auth, Port 6000)
│   ├── src/
│   │   ├── App.jsx                 # Direct rendering without Auth
│   │   └── ...
│   ├── vite.config.js              # Configured for Port 6000
│   └── package.json
├── detection.ipynb                 # Original Research Jupyter Notebook
└── README.md                       # Local Execution Guide & System Docs
```

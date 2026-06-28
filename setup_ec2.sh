#!/bin/bash

# ==============================================================================
# TrafficAI - AWS EC2 Automated Setup & Deployment Script
# ==============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "=============================================================================="
echo "🚀 Starting TrafficAI AWS EC2 Build & PM2 Deployment..."
echo "=============================================================================="

# 1. System Updates & Prerequisites
if [ "$1" != "--skip-install" ]; then
    echo "📦 [1/4] Updating APT package repositories & dependencies..."
    sudo apt-get update -y
    sudo apt-get install -y curl wget git build-essential openjdk-17-jdk maven nodejs python3 python3-pip python3-venv ffmpeg libsm6 libxext6 || true
    sudo npm install -g pm2 serve || true
    pip3 install ultralytics opencv-python-headless numpy pillow torch torchvision || true
fi

# 2. Build Backend & Frontend
echo "🔨 [2/4] Building Backend and Frontend production packages..."

# Build Java Backend
if [ -d "backend" ]; then
    echo "  -> Compiling Java backend..."
    cd "$SCRIPT_DIR/backend"
    mvn clean compile || true
    cd "$SCRIPT_DIR"
fi

# Build React Frontend
if [ -d "frontend" ]; then
    echo "  -> Building React frontend..."
    cd "$SCRIPT_DIR/frontend"
    npm install
    npm run build
    cd "$SCRIPT_DIR"
fi

# 3. Start Services under PM2 Process Supervisor
echo "⚡ [3/4] Launching Services under PM2 Process Supervisor..."

# Stop any existing PM2 managed processes
pm2 delete all 2>/dev/null || true

# Start Java Backend on Port 5000
if [ -d "backend" ]; then
    echo "  -> Starting traffic-backend service on port 5000..."
    cd "$SCRIPT_DIR/backend"
    pm2 start "mvn exec:java" --name "traffic-backend" || pm2 start "java -cp target/classes:bin com.traffic.backend.TrafficDetectionServer" --name "traffic-backend"
    cd "$SCRIPT_DIR"
fi

# Start React Frontend on Port 4000
if [ -d "frontend/dist" ]; then
    echo "  -> Starting traffic-frontend service on port 4000..."
    cd "$SCRIPT_DIR/frontend"
    pm2 start "npx serve -s dist -l 4000" --name "traffic-frontend"
    cd "$SCRIPT_DIR"
elif [ -d "frontend" ]; then
    cd "$SCRIPT_DIR/frontend"
    pm2 start "npm run dev -- --host 0.0.0.0 --port 4000" --name "traffic-frontend"
    cd "$SCRIPT_DIR"
fi

# 4. Persist PM2 configuration across reboots
echo "💾 [4/4] Saving PM2 state and configuring system startup..."
pm2 save --force || true

CURRENT_USER=$(whoami)
if [ "$CURRENT_USER" = "root" ] && [ -n "$SUDO_USER" ]; then
    CURRENT_USER="$SUDO_USER"
fi
PM2_HOME_DIR=$(eval echo ~"$CURRENT_USER")

env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u "$CURRENT_USER" --hp "$PM2_HOME_DIR" 2>/dev/null || true

echo "=============================================================================="
echo "🎉 TrafficAI EC2 Deployment Completed Successfully!"
echo "------------------------------------------------------------------------------"
echo "🌐 Frontend Access  : http://13.127.118.27:4000"
echo "⚙️ Backend API      : http://13.127.118.27:5000/api/health"
echo "=============================================================================="

#!/bin/bash

# ==============================================================================
# TrafficAI - AWS EC2 Automated Setup & Deployment Script
# Installs: Java 17, Node.js 20, Maven, Python3, MySQL Server, PM2 & All AI Pipeline Libs
# ==============================================================================

set -e

echo "=============================================================================="
echo "🚀 Starting TrafficAI AWS EC2 System Setup..."
echo "=============================================================================="

# 1. System Updates & Prerequisites
echo "📦 [1/7] Updating APT package repositories..."
sudo apt-get update -y
sudo apt-get install -y curl wget git build-essential software-properties-common

# 2. Install Java 17 & Maven
echo "☕ [2/7] Installing Java 17 OpenJDK and Maven..."
sudo apt-get install -y openjdk-17-jdk maven
java -version

# 3. Install Node.js 20 & PM2
echo "🟢 [3/7] Installing Node.js 20 and Global PM2 process manager..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2 serve
node -v
npm -v

# 4. Install Python3 & AI Pipeline Dependencies
echo "🐍 [4/7] Installing Python3, Pip and AI Vision dependencies..."
sudo apt-get install -y python3 python3-pip python3-venv ffmpeg libsm6 libxext6
pip3 install --upgrade pip
pip3 install ultralytics opencv-python-headless numpy pillow torch torchvision

# 5. Install & Configure MySQL Database
echo "🐬 [5/7] Installing MySQL Server and setting up database..."
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Configure Database & User Tables
echo "🔐 Setting up MySQL database 'traffic_ai' and seeding credentials..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS traffic_ai;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'traffic_user'@'localhost' IDENTIFIED BY 'Traffic#2420';"
sudo mysql -e "GRANT ALL PRIVILEGES ON traffic_ai.* TO 'traffic_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

sudo mysql traffic_ai -e "
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at VARCHAR(30) NOT NULL
);
"

# Seed Admin & Standard User if table is empty
sudo mysql traffic_ai -e "
INSERT IGNORE INTO users (id, username, password, role, created_at) 
VALUES 
(1, 'admin', 'Colon#2420', 'admin', NOW()),
(2, 'user', 'user123', 'user', NOW());
"

# 6. Build Backend & Frontend
echo "🔨 [6/7] Building Backend and Frontend production packages..."

# Build Java Backend
if [ -d "backend" ]; then
    cd backend
    mvn clean package -DskipTests
    cd ..
fi

# Build React Frontend
if [ -d "frontend" ]; then
    cd frontend
    npm install
    npm run build
    cd ..
fi

# 7. Start Services under PM2
echo "⚡ [7/7] Launching Services under PM2 Process Supervisor..."

# Set environment variables for MySQL connection
export DB_URL="jdbc:mysql://localhost:3306/traffic_ai"
export DB_USER="traffic_user"
export DB_PASS="Traffic#2420"

# Stop existing PM2 processes if running
pm2 delete all || true

# Start Backend Service on Port 5000
if [ -f "backend/target/traffic-backend-1.0.0.jar" ]; then
    pm2 start "java -cp backend/target/traffic-backend-1.0.0.jar com.traffic.backend.TrafficDetectionServer" --name "traffic-backend"
elif [ -d "backend" ]; then
    pm2 start "bash -c 'cd backend && java -cp target/*:lib/* com.traffic.backend.TrafficDetectionServer'" --name "traffic-backend"
fi

# Start Frontend Service on Port 4000
if [ -d "frontend/dist" ]; then
    pm2 start "npx serve -s frontend/dist -l 4000" --name "traffic-frontend"
fi

# Persist PM2 configuration across server reboots
pm2 save
sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u \$USER --hp \$HOME || true

echo "=============================================================================="
echo "🎉 TrafficAI EC2 Deployment Completed Successfully!"
echo "------------------------------------------------------------------------------"
echo "🌐 Frontend Access  : http://13.127.118.27:4000"
echo "=============================================================================="

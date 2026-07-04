#!/bin/bash
# ==============================================================================
# TrafficAI - Backend Deploy Script (Target Server)
# ==============================================================================

set -e

# Configuration & Defaults
DEPLOY_DIR="/var/www/traffic-ai/backend"
BACKEND_NAME="traffic-backend"
JAR_NAME="traffic-backend-1.0.0.jar"

# Load database credentials from arguments or environment variables
DB_URL="${DB_URL:-jdbc:mysql://localhost:3306/traffic_ai}"
DB_USER="${DB_USER:-traffic_user}"
DB_PASS="${DB_PASS:-Traffic#2420}"

echo "=============================================================================="
echo "🚀 Deploying TrafficAI Java Backend Service..."
echo "📂 Target Directory: $DEPLOY_DIR"
echo "=============================================================================="

# 1. Create directory structures if not exists
mkdir -p "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/libs"
cd "$DEPLOY_DIR"

# 2. Check if a new build is supplied via pipeline or needs downloading from Nexus
if [ -f "/tmp/$JAR_NAME" ]; then
    echo "📦 Using JAR artifact supplied by Jenkins..."
    mv "/tmp/$JAR_NAME" "$DEPLOY_DIR/$JAR_NAME"
    if [ -d "/tmp/libs" ]; then
        cp -r /tmp/libs/* "$DEPLOY_DIR/libs/"
        rm -rf /tmp/libs
    fi
else
    # Fallback to downloading from Nexus if Nexus credentials and URLs are provided
    if [ -n "$NEXUS_URL" ] && [ -n "$NEXUS_USER" ] && [ -n "$NEXUS_PASS" ]; then
        VERSION="${VERSION:-1.0.0}"
        echo "🌐 Downloading version $VERSION from Nexus Repository Manager..."
        DOWNLOAD_URL="$NEXUS_URL/repository/maven-releases/com/traffic/traffic-backend/$VERSION/traffic-backend-$VERSION.jar"
        curl -u "$NEXUS_USER:$NEXUS_PASS" -L -o "$DEPLOY_DIR/$JAR_NAME" "$DOWNLOAD_URL"
    else
        echo "⚠️ Warning: No local JAR found at /tmp/$JAR_NAME and no Nexus credentials supplied."
        echo "Searching for existing JAR..."
        if [ ! -f "$DEPLOY_DIR/$JAR_NAME" ]; then
            echo "❌ Error: $JAR_NAME not found. Deployment aborted."
            exit 1
        fi
    fi
fi

# 3. Stop running PM2 backend instances
echo "🛑 Stopping existing backend service..."
pm2 delete "$BACKEND_NAME" 2>/dev/null || true

# 4. Inject Environment Variables for Database Connections
echo "🔑 Exporting Database variables..."
export DB_URL="$DB_URL"
export DB_USER="$DB_USER"
export DB_PASS="$DB_PASS"

# Ensure we have class path files (database drivers, etc.)
# If they are in libs/ we append them, otherwise default to target/classes
CLASSPATH="$JAR_NAME:libs/*:bin:target/classes"

# 5. Launch Backend Server under PM2 Process Supervisor
echo "⚡ Starting Java Backend Server on Port 5000 under PM2..."
pm2 start "java -cp $CLASSPATH com.traffic.backend.TrafficDetectionServer" --name "$BACKEND_NAME"

# 6. Save PM2 state
pm2 save --force || true

echo "=============================================================================="
echo "🎉 TrafficAI Backend Deployed & Started successfully!"
echo "⚙️ Health check endpoint: http://localhost:5000/api/health"
echo "=============================================================================="

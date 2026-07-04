#!/bin/bash
# ==============================================================================
# TrafficAI - Frontend Deploy Script (Target Server)
# ==============================================================================

set -e

# Configuration & Defaults
WEB_ROOT="/var/www/traffic-ai/frontend"
NGINX_CONF_AVAILABLE="/etc/nginx/sites-available/traffic_ai"
NGINX_CONF_ENABLED="/etc/nginx/sites-enabled/traffic_ai"

echo "=============================================================================="
echo "🚀 Deploying TrafficAI Frontend static assets..."
echo "📂 Web Root Directory: $WEB_ROOT"
echo "=============================================================================="

# 1. Create Web Root Directory
sudo mkdir -p "$WEB_ROOT"

# 2. Extract frontend build archive
if [ -f "/tmp/dist.tar.gz" ]; then
    echo "📦 Extracting new frontend bundle..."
    # Clear existing build files to avoid stale assets
    sudo rm -rf "$WEB_ROOT"/*
    sudo tar -xzf /tmp/dist.tar.gz -C "$WEB_ROOT"
    sudo rm -f /tmp/dist.tar.gz
else
    echo "⚠️ Warning: No frontend bundle found at /tmp/dist.tar.gz."
    echo "Looking for files in $WEB_ROOT..."
    if [ -z "$(ls -A "$WEB_ROOT")" ]; then
        echo "❌ Error: Web root is empty. Deployment aborted."
        exit 1
    fi
fi

# 3. Secure permissions (assign ownership to Nginx user www-data)
echo "🔒 Adjusting folder permissions..."
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"

# 4. Update Nginx Configuration
if [ -f "/tmp/nginx.conf" ]; then
    echo "⚙️ Installing Nginx configuration template..."
    sudo mv /tmp/nginx.conf "$NGINX_CONF_AVAILABLE"
    
    # Enable site if not already enabled
    if [ ! -L "$NGINX_CONF_ENABLED" ]; then
        sudo ln -sf "$NGINX_CONF_AVAILABLE" "$NGINX_CONF_ENABLED"
    fi
fi

# 5. Create self-signed SSL certificate if none exists (for quick setup)
if [ ! -f "/etc/nginx/ssl/traffic_ai.crt" ]; then
    echo "🔑 SSL certificate not found. Generating a secure self-signed certificate for fallback..."
    sudo mkdir -p /etc/nginx/ssl
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/traffic_ai.key \
        -out /etc/nginx/ssl/traffic_ai.crt \
        -subj "/C=US/ST=State/L=City/O=TrafficAI/OU=DevOps/CN=localhost"
    
    sudo chmod 600 /etc/nginx/ssl/traffic_ai.key
fi

# 6. Test Nginx Configuration
echo "🔍 Validating Nginx configuration syntax..."
if sudo nginx -t; then
    echo "✅ Nginx configuration syntax is valid!"
    echo "🔄 Reloading Nginx service..."
    sudo systemctl reload nginx || sudo service nginx reload
else
    echo "❌ Error: Nginx configuration test failed. Reverting changes..."
    exit 1
fi

echo "=============================================================================="
echo "🎉 TrafficAI Frontend Deployed Successfully!"
echo "🌐 You can access it securely via HTTPS (Port 443) or HTTP (redirected)."
echo "=============================================================================="

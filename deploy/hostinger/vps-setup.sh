#!/usr/bin/env bash
# ============================================================
# Odhvica Platform — Full VPS Deployment Script
# Run this on Ubuntu VPS as root
# ============================================================
set -euo pipefail

DOMAIN="odhvica.com"
REPO_URL="https://github.com/sainisun/odhvica-ecommerce.git"
APP_DIR="/root/odhvica-ecommerce"

echo "=========================================="
echo "  Odhvica VPS Deployment Starting..."
echo "  Domain: $DOMAIN"
echo "=========================================="

# ----------------------------------------------------------
# STEP 1: Add 4GB Swap (2GB RAM is very tight for builds)
# ----------------------------------------------------------
echo ""
echo ">>> STEP 1: Setting up 4GB swap space..."
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "    Swap created and enabled."
else
  echo "    Swap already exists, skipping."
fi
free -h
echo ">>> STEP 1 DONE"

# ----------------------------------------------------------
# STEP 2: Install system dependencies
# ----------------------------------------------------------
echo ""
echo ">>> STEP 2: Installing system packages..."

# Normalize any pre-existing Docker apt source definitions to avoid signed-by conflicts
rm -f /etc/apt/sources.list.d/docker.sources

apt update -y
apt install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx git ufw openssl

# Docker GPG key & repo
install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
fi

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update -y
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl enable nginx
echo ">>> STEP 2 DONE"

# ----------------------------------------------------------
# STEP 3: Clone the repository
# ----------------------------------------------------------
echo ""
echo ">>> STEP 3: Cloning repository..."
if [ -d "$APP_DIR" ]; then
  echo "    Directory exists, pulling latest..."
  cd "$APP_DIR"
  git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi
echo ">>> STEP 3 DONE"

# ----------------------------------------------------------
# STEP 4: Create environment files
# ----------------------------------------------------------
echo ""
echo ">>> STEP 4: Creating environment files..."

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 32)
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 64)
STRIPE_SECRET_PLACEHOLDER="sk_live_replace_before_launch"
STRIPE_PUBLISHABLE_PLACEHOLDER="pk_live_replace_before_launch"

# 4a: .env.hostinger (Postgres config)
cat > "$APP_DIR/.env.hostinger" << EOF
POSTGRES_DB=odhvica
POSTGRES_USER=odhvica
POSTGRES_PASSWORD=${DB_PASSWORD}

STORE_DOMAIN=${DOMAIN}
STORE_WWW_DOMAIN=www.${DOMAIN}
ADMIN_DOMAIN=admin.${DOMAIN}
API_DOMAIN=api.${DOMAIN}
EOF

# 4b: backend/.env.production
cat > "$APP_DIR/backend/.env.production" << EOF
DATABASE_URL=postgresql://odhvica:${DB_PASSWORD}@postgres:5432/odhvica
NODE_ENV=production
PORT=4000
JWT_SECRET=${JWT_SECRET}

ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN},https://admin.${DOMAIN}
STOREFRONT_URL=https://${DOMAIN}
ADMIN_URL=https://admin.${DOMAIN}
FRONTEND_URL=https://${DOMAIN}
ADMIN_EMAIL=admin@${DOMAIN}

# Stripe (optional — leave blank if using RogerPay/PayPal)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email via Resend SMTP relay (https://resend.com)
# SMTP_PASS = your Resend API key (starts with re_)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_replace_with_your_resend_api_key
SMTP_FROM="Odhvica" <noreply@${DOMAIN}>
RESEND_API_KEY=re_replace_with_your_resend_api_key

# Google OAuth
GOOGLE_CLIENT_ID=replace_with_google_oauth_client_id

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=replace_with_cloud_name
CLOUDINARY_API_KEY=replace_with_api_key
CLOUDINARY_API_SECRET=replace_with_api_secret

# File uploads (local fallback if Cloudinary is not set)
UPLOAD_DIR=/app/uploads
UPLOAD_URL=https://api.${DOMAIN}/uploads
EOF

# 4c: storefront/.env.production
cat > "$APP_DIR/storefront/.env.production" << EOF
NEXT_PUBLIC_API_URL=https://api.${DOMAIN}
INTERNAL_API_URL=http://backend:4000
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NEXT_PUBLIC_STORE_URL=https://${DOMAIN}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_PLACEHOLDER}
EOF

# 4d: admin/.env.production
cat > "$APP_DIR/admin/.env.production" << EOF
NEXT_PUBLIC_API_URL=https://api.${DOMAIN}
BACKEND_URL=http://backend:4000
NEXT_PUBLIC_ADMIN_URL=https://admin.${DOMAIN}
EOF

# 4e: deploy/hostinger/.env (used by docker-compose for NEXT_PUBLIC_API_URL build arg substitution)
cat > "$APP_DIR/deploy/hostinger/.env" << EOF
NEXT_PUBLIC_API_URL=https://api.${DOMAIN}
EOF

echo "    Generated secure passwords."
echo "    DB_PASSWORD: ${DB_PASSWORD}"
echo "    JWT_SECRET:  ${JWT_SECRET}"
echo ""
echo "    >>> SAVE THESE PASSWORDS! <<<"
echo "    Stripe placeholders were written. Replace them before live checkout."
echo ">>> STEP 4 DONE"

# ----------------------------------------------------------
# STEP 5: Configure Nginx reverse proxy
# ----------------------------------------------------------
echo ""
echo ">>> STEP 5: Configuring Nginx..."

cp "$APP_DIR/deploy/hostinger/nginx/odhvica.conf" /etc/nginx/sites-available/odhvica.conf

# Enable the site
ln -sf /etc/nginx/sites-available/odhvica.conf /etc/nginx/sites-enabled/odhvica.conf
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t
systemctl reload nginx
echo ">>> STEP 5 DONE"

# ----------------------------------------------------------
# STEP 6: Build and Start Docker containers
# ----------------------------------------------------------
echo ""
echo ">>> STEP 6: Building and starting Docker containers..."
echo "    This may take 10-15 minutes on first build..."
cd "$APP_DIR"
docker compose -f deploy/hostinger/docker-compose.yml up -d --build
echo ""
echo ">>> Container Status:"
docker compose -f deploy/hostinger/docker-compose.yml ps
echo ">>> STEP 6 DONE"

# ----------------------------------------------------------
# STEP 7: Enable Firewall
# ----------------------------------------------------------
echo ""
echo ">>> STEP 7: Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
echo ">>> STEP 7 DONE"

# ----------------------------------------------------------
# DONE!
# ----------------------------------------------------------
echo ""
echo "=========================================="
echo "  🎉 DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "  Your services:"
echo "  • Storefront: http://${DOMAIN}"
echo "  • Admin:      http://admin.${DOMAIN}"
echo "  • API:        http://api.${DOMAIN}"
echo "  • MCP:        http://mcp.${DOMAIN}"
echo ""
echo "  NEXT STEPS:"
echo "  1. Set up DNS A records pointing to: $(curl -s ifconfig.me)"
echo "  2. Wait for DNS propagation (5min - 48hrs)"
echo "  3. Run SSL setup:"
echo "     sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d admin.${DOMAIN} -d api.${DOMAIN} -d mcp.${DOMAIN}"
echo "  4. Run manual DB migrations (one-time after first deploy):"
echo "     docker exec -it odhvica-backend-1 npm run migrate:manual"
echo "  5. Fill in API secrets in $APP_DIR/backend/.env.production:"
echo "     RESEND_API_KEY, SMTP_PASS, GOOGLE_CLIENT_ID, CLOUDINARY_*"
echo ""
echo "  SAVED CREDENTIALS:"
echo "  DB Password: ${DB_PASSWORD}"
echo "  JWT Secret:  ${JWT_SECRET}"
echo "=========================================="
